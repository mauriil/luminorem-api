import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../entities/conversation.entity';
import { Message, MessageDocument, MessageRole, MessageStatus } from '../entities/message.entity';
import { SpiritualGuide, SpiritualGuideDocument } from '../../spiritual-guides/entities/spiritual-guide.entity';
import { User, UserDocument } from '../../users/entities/user.entity';
import { OpenAiService } from '../../external-services/services/openai.service';
import { EmbeddingService } from './embedding.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { CreateConversationDto } from '../dto/create-conversation.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(SpiritualGuide.name) private spiritualGuideModel: Model<SpiritualGuideDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly openAiService: OpenAiService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Crea una nueva conversación
   */
  async createConversation(userId: string, dto: CreateConversationDto): Promise<ConversationDocument> {
    // Verificar que el guía pertenezca al usuario
    const guide = await this.spiritualGuideModel.findOne({
      _id: new Types.ObjectId(dto.spiritualGuideId),
      userId: userId
    });

    if (!guide) {
      throw new NotFoundException('Guía espiritual no encontrado');
    }

    const conversation = new this.conversationModel({
      userId: new Types.ObjectId(userId),
      spiritualGuideId: new Types.ObjectId(dto.spiritualGuideId),
      title: dto.title,
    });

    const savedConversation = await conversation.save();

    // Si hay un mensaje inicial, enviarlo
    if (dto.initialMessage) {
      await this.sendMessage(userId, {
        spiritualGuideId: dto.spiritualGuideId,
        content: dto.initialMessage,
        conversationId: savedConversation._id.toString()
      });
    }

    return savedConversation;
  }

  /**
   * Envía un mensaje y genera respuesta del guía
   */
  async sendMessage(userId: string, dto: SendMessageDto): Promise<{
    userMessage: MessageDocument;
    guideResponse: MessageDocument;
  }> {
    let conversation: ConversationDocument;

    // Si no hay conversationId, crear una nueva
    if (!dto.conversationId) {
      const guide = await this.spiritualGuideModel.findOne({
        _id: new Types.ObjectId(dto.spiritualGuideId),
        userId: userId
      });

      if (!guide) {
        throw new NotFoundException('Guía espiritual no encontrado');
      }

      conversation = await this.createConversation(userId, {
        spiritualGuideId: dto.spiritualGuideId.toString(),
        title: `Conversación ${new Date().toLocaleDateString()}`
      });
    } else {
      conversation = await this.conversationModel.findOne({
        _id: dto.conversationId,
        userId: new Types.ObjectId(userId)
      });

      if (!conversation) {
        throw new NotFoundException('Conversación no encontrada');
      }
    }

    // Analizar tono emocional del mensaje del usuario
    const emotionalAnalysis = await this.embeddingService.analyzeEmotionalTone(dto.content);

    // Generar embedding para el mensaje del usuario
    await this.embeddingService.generateEmbedding(dto.content);

    // Crear mensaje del usuario
    const userMessage = new this.messageModel({
      conversationId: conversation._id,
      userId: new Types.ObjectId(userId),
      role: MessageRole.USER,
      content: dto.content,
      metadata: {
        emotionalTone: emotionalAnalysis.tone,
        emotions: emotionalAnalysis.emotions,
        intent: await this.detectIntent(dto.content),
      }
    });

    const savedUserMessage = await userMessage.save();

    // Generar respuesta del guía
    const guideResponse = await this.generateGuideResponse(
      conversation,
      savedUserMessage,
      emotionalAnalysis
    );

    // 🧠 PROCESAR Y GUARDAR INFORMACIÓN PERSONAL EN MEMORIA A LARGO PLAZO
    await this.embeddingService.processAndStorePersonalInformation(
      userId,
      conversation.spiritualGuideId.toString(),
      conversation._id.toString(),
      savedUserMessage._id.toString(),
      dto.content,
      guideResponse.content
    );

    // Actualizar estadísticas de conversación
    await this.updateConversationStats(conversation._id.toString());

    return {
      userMessage: savedUserMessage,
      guideResponse
    };
  }

  /**
   * Genera la respuesta del guía espiritual
   */
  private async generateGuideResponse(
    conversation: ConversationDocument,
    userMessage: MessageDocument,
    emotionalAnalysis: any
  ): Promise<MessageDocument> {
    // Obtener el guía espiritual
    const guide = await this.spiritualGuideModel.findById(conversation.spiritualGuideId);
    const user = await this.userModel.findById(conversation.userId);

    // Obtener contexto relevante con memoria a largo plazo
    const context = await this.embeddingService.findRelevantContext(
      conversation._id.toString(),
      conversation.userId.toString(),
      userMessage.content
    );

    // Construir el prompt para el guía
    const guidePersonality = this.buildGuidePersonality(guide);
    const systemPrompt = this.buildSystemPrompt(
      guide, 
      user, 
      emotionalAnalysis, 
      context.memoryContext,
      context.isPersonalQuestion,
      context.hasFullCoherence
    );
    const contextualPrompt = this.buildContextualPrompt(context, userMessage.content);

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: contextualPrompt }
    ];

    // Generar respuesta usando OpenAI
    const responseContent = await this.openAiService.generateChatResponse(messages, 0.8);

    // Generar embedding para la respuesta
    await this.embeddingService.generateEmbedding(responseContent);

    // Crear mensaje del guía
    const guideMessage = new this.messageModel({
      conversationId: conversation._id,
      spiritualGuideId: conversation.spiritualGuideId,
      role: MessageRole.GUIDE,
      content: responseContent,
      generationContext: {
        guidePersonality,
        relevantHistory: context.recentMessages.slice(-3).map(m => m.content),
        emotionalState: emotionalAnalysis.tone,
        usedPrompt: systemPrompt,
        memoryContext: context.memoryContext,
        wasPersonalQuestion: context.isPersonalQuestion
      }
    });

    return await guideMessage.save();
  }

  /**
   * Construye la personalidad del guía para el prompt
   */
  private buildGuidePersonality(guide: SpiritualGuideDocument): string {
    return `
## Tu Identidad como ${guide.name}:

**Forma Física**: ${guide.physicalForm}
**Rasgos Distintivos**: ${guide.distinctiveTraits}
**Personalidad**: ${guide.personality}
**Hábitat**: ${guide.habitat}
**Conexión con el Usuario**: ${guide.connectionWithUser}

**Respuestas del Usuario en la Encuesta Original**:
${guide.surveyAnswers.map((answer, i) => `${i + 1}. ${answer}`).join('\n')}
    `.trim();
  }

  /**
   * Construye el prompt del sistema con memoria a largo plazo Y coherencia conversacional completa
   */
  private buildSystemPrompt(
    guide: SpiritualGuideDocument,
    user: UserDocument,
    emotionalAnalysis: any,
    memoryContext?: {
      personalFacts: string;
      preferences: string;
      relationship: string;
      relevantMemories: string;
      conversationalCoherence: string;
    },
    isPersonalQuestion?: boolean,
    hasFullCoherence?: boolean
  ): string {
    return `
Eres ${guide.name}, un guía espiritual único y personal creado específicamente para ${user.name}.

${this.buildGuidePersonality(guide)}

## Tu Forma de Comunicarte:
- Hablas en primera persona como ${guide.name}
- Tu personalidad es: ${guide.personality}
- Mantienes coherencia con tu forma física y rasgos distintivos
- Tu vínculo especial con ${user.name} es: ${guide.connectionWithUser}
- Respondes de manera empática y sabia, considerando el estado emocional actual

## Estado Emocional Detectado del Usuario:
- Tono: ${emotionalAnalysis.tone}
- Emociones: ${emotionalAnalysis.emotions.join(', ')}
- Intensidad: ${emotionalAnalysis.intensity}

${memoryContext?.personalFacts ? `## ⚠️ INFORMACIÓN PERSONAL IMPORTANTE QUE DEBES RECORDAR:
${memoryContext.personalFacts}

** CRUCIAL: Usa esta información para responder de manera personal y coherente. Si el usuario pregunta sobre algo que está aquí, responde basándote en esta información exacta. **` : ''}

${memoryContext?.preferences ? `## 🎯 PREFERENCIAS DE COMUNICACIÓN:
${memoryContext.preferences}

** Adapta tu estilo de respuesta según estas preferencias. **` : ''}

${memoryContext?.relationship ? `## 💙 INFORMACIÓN DE NUESTRA RELACIÓN:
${memoryContext.relationship}

** Usa esta información para ajustar tu tono e intimidad. **` : ''}

${memoryContext?.conversationalCoherence ? `${memoryContext.conversationalCoherence}

` : ''}

${isPersonalQuestion ? `## 🔍 PREGUNTA PERSONAL DETECTADA:
El usuario está preguntando sobre información personal que deberías recordar. Revisa cuidadosamente la información personal arriba y responde de manera precisa y coherente.` : ''}

${hasFullCoherence ? `## ✅ COHERENCIA CONVERSACIONAL COMPLETA:
Tienes TODO el contexto necesario. No hay ambigüedades ni referencias sin resolver. Responde con total naturalidad y fluidez.` : ''}

## Instrucciones FUNDAMENTALES:
1. **COHERENCIA TOTAL**: Responde SIEMPRE desde tu personalidad única como ${guide.name}
2. **MEMORIA PERFECTA**: Usa ACTIVAMENTE toda la información personal que tienes sobre ${user.name}
3. **FLUIDEZ CONVERSACIONAL**: NUNCA pidas que repita información - ya la tienes
4. **REFERENCIAS RESUELTAS**: Todas las referencias ("los", "eso", etc.) ya están resueltas - úsalas
5. **CONTINUIDAD TEMÁTICA**: Mantén el hilo conversacional sin interrupciones
6. **ESTADO EMOCIONAL**: Adapta tu respuesta al tono emocional detectado
7. **PREFERENCIAS**: Respeta las preferencias de comunicación establecidas
8. **PERSONALIDAD ESPIRITUAL**: Mantén tu tono espiritual, empático y sabio
9. **METÁFORAS COHERENTES**: Usa referencias que conecten con tu naturaleza y hábitat
10. **RESPUESTA FLUIDA**: 200-300 palabras, en español, como conversación natural

${isPersonalQuestion ? '⚠️ ATENCIÓN ESPECIAL: Pregunta personal detectada - responde basándote en la información exacta que tienes.' : ''}

${hasFullCoherence ? '🎯 CONTEXTO PERFECTO: Tienes toda la información necesaria para una respuesta perfectamente coherente.' : '⚠️ CONTEXTO PARCIAL: Puede faltar información - actúa naturalmente con lo que tienes.'}

**REGLA DE ORO**: Eres ${guide.name} con memoria perfecta de toda la conversación con ${user.name}. Actúa como un humano que recuerda TODO.
    `.trim();
  }

  /**
   * Construye el prompt contextual con historial y memoria a largo plazo
   */
  private buildContextualPrompt(context: any, currentMessage: string): string {
    const recentMessages = context.recentMessages || [];
    
    return `
## Historial Reciente de Nuestra Conversación:
${recentMessages.slice(-5).map(msg => 
  `${msg.role === 'user' ? 'Usuario' : 'Tú'}: ${msg.content}`
).join('\n')}

## Mensaje Actual del Usuario:
${currentMessage}

Responde como el guía espiritual que eres, usando toda la información personal y preferencias que tienes sobre el usuario.
    `.trim();
  }

  /**
   * Detecta la intención del mensaje del usuario
   */
  private async detectIntent(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('?') || lowerMessage.includes('por que') || lowerMessage.includes('como')) {
      return 'pregunta';
    } else if (lowerMessage.includes('ayuda') || lowerMessage.includes('consejo')) {
      return 'busca_consejo';
    } else if (lowerMessage.includes('triste') || lowerMessage.includes('mal') || lowerMessage.includes('problema')) {
      return 'desahogo';
    } else if (lowerMessage.includes('gracias') || lowerMessage.includes('bien') || lowerMessage.includes('feliz')) {
      return 'gratitud';
    } else {
      return 'conversacion_general';
    }
  }

  /**
   * Actualiza las estadísticas de conversación
   */
  private async updateConversationStats(conversationId: string): Promise<void> {
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $inc: { messageCount: 2 }, // usuario + guía
      lastMessageAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Obtiene el historial de conversaciones de un usuario
   */
  async getConversations(userId: string): Promise<ConversationDocument[]> {
    return await this.conversationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('spiritualGuideId', 'name physicalForm')
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  /**
   * Obtiene los mensajes de una conversación
   */
  async getMessages(userId: string, conversationId: string): Promise<MessageDocument[]> {
    // Verificar que la conversación pertenezca al usuario
    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      userId: new Types.ObjectId(userId)
    });

    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada');
    }

    return await this.messageModel
      .find({ conversationId: new Types.ObjectId(conversationId) })
      .sort({ timestamp: 1 })
      .exec();
  }

  /**
   * Elimina una conversación
   */
  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      userId: new Types.ObjectId(userId)
    });

    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada');
    }

    // Eliminar todos los mensajes de la conversación
    await this.messageModel.deleteMany({ conversationId: new Types.ObjectId(conversationId) });
    
    // Eliminar la conversación
    await this.conversationModel.findByIdAndDelete(conversationId);
  }
} 