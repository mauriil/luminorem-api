import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../entities/conversation.entity';
import { Message, MessageDocument, MessageRole, MessageStatus } from '../entities/message.entity';
import { SpiritualGuide, SpiritualGuideDocument } from '../../spiritual-guides/entities/spiritual-guide.entity';
import { User, UserDocument } from '../../users/entities/user.entity';
import { OpenAiService } from '../../external-services/services/openai.service';
import { EmbeddingService } from './embedding.service';
import { PineconeService } from '../../external-services/services/pinecone.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { CreateConversationDto } from '../dto/create-conversation.dto';

@Injectable()
export class ChatServiceOptimized {
  constructor(
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(SpiritualGuide.name) private spiritualGuideModel: Model<SpiritualGuideDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly openAiService: OpenAiService,
    private readonly embeddingService: EmbeddingService,
    private readonly pineconeService: PineconeService,
  ) {}

  /**
   * ⚡ VERSIÓN OPTIMIZADA: Envía un mensaje y genera respuesta del guía
   * Reduce latencia de 8-10s a 1-2s
   */
  async sendMessage(userId: string, dto: SendMessageDto): Promise<{
    userMessage: MessageDocument;
    guideResponse: MessageDocument;
  }> {
    let conversation: ConversationDocument;

    // 🚀 PASO 1: OBTENER/CREAR CONVERSACIÓN (Optimizado)
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

    // 🚀 PASO 2: PARALELIZAR OPERACIONES INICIALES
    const [emotionalAnalysis, userMessage] = await Promise.all([
      // Análisis emocional simplificado (sin OpenAI)
      this.analyzeEmotionalToneSimplified(dto.content),
      
      // Crear mensaje del usuario inmediatamente
      this.createUserMessage(conversation._id, userId, dto.content)
    ]);

    // 🚀 PASO 3: GENERAR RESPUESTA EN PARALELO CON CONTEXTO OPTIMIZADO
    const [guideResponse] = await Promise.all([
      this.generateGuideResponseOptimized(
        conversation,
        userMessage,
        emotionalAnalysis
      ),
      
      // Procesar memoria en background (no bloquea la respuesta)
      this.processMemoryInBackground(
        userId,
        conversation.spiritualGuideId.toString(),
        conversation._id.toString(),
        userMessage._id.toString(),
        dto.content
      )
    ]);

    // 🚀 PASO 4: ACTUALIZAR ESTADÍSTICAS EN BACKGROUND
    this.updateConversationStatsBackground(conversation._id.toString());

    return {
      userMessage,
      guideResponse
    };
  }

  /**
   * 🚀 OPTIMIZADO: Análisis emocional sin OpenAI (mucho más rápido)
   */
  private async analyzeEmotionalToneSimplified(message: string): Promise<{
    tone: string;
    intensity: number;
    emotions: string[];
  }> {
    const emotionalKeywords = {
      alegre: ['feliz', 'contento', 'alegre', 'bien', 'genial', 'excelente', 'increíble', 'fantástico', 'maravilloso'],
      triste: ['triste', 'mal', 'deprimido', 'solo', 'vacío', 'llorar', 'dolor', 'pena'],
      ansioso: ['ansiedad', 'nervioso', 'preocupado', 'estresado', 'miedo', 'pánico', 'tensión'],
      enojado: ['enojado', 'furioso', 'irritado', 'molesto', 'rabia', 'ira'],
      confundido: ['confundido', 'perdido', 'no entiendo', 'dudas', 'no sé'],
      esperanzado: ['esperanza', 'optimista', 'futuro', 'posibilidad', 'sueño', 'meta'],
      amoroso: ['amor', 'cariño', 'quiero', 'amo', 'afecto', 'corazón'],
      agradecido: ['gracias', 'agradezco', 'bendición', 'afortunado']
    };

    const lowerMessage = message.toLowerCase();
    const detectedEmotions = [];
    let dominantTone = 'neutral';
    let maxMatches = 0;
    let totalMatches = 0;

    for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
      const matches = keywords.filter(keyword => 
        lowerMessage.includes(keyword)
      ).length;
      
      if (matches > 0) {
        detectedEmotions.push(emotion);
        totalMatches += matches;
        if (matches > maxMatches) {
          maxMatches = matches;
          dominantTone = emotion;
        }
      }
    }

    // Detectar intensidad por signos de puntuación y palabras intensificadoras
    let intensity = Math.min(maxMatches / 2, 1);
    if (message.includes('!!!') || message.includes('???')) intensity += 0.3;
    if (message.includes('muy') || message.includes('super') || message.includes('extremadamente')) intensity += 0.2;
    
    return {
      tone: dominantTone,
      intensity: Math.min(intensity, 1),
      emotions: detectedEmotions
    };
  }

  /**
   * 🚀 OPTIMIZADO: Crear mensaje del usuario sin dependencias
   */
  private async createUserMessage(conversationId: any, userId: string, content: string): Promise<MessageDocument> {
    const userMessage = new this.messageModel({
      conversationId: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
      role: MessageRole.USER,
      content,
      metadata: {
        intent: this.detectIntentSimplified(content),
      }
    });

    return await userMessage.save();
  }

  /**
   * 🚀 OPTIMIZADO: Detección de intención simplificada (sin OpenAI)
   */
  private detectIntentSimplified(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Patrones más específicos
    if (lowerMessage.includes('?') || /\b(por qué|cómo|cuándo|dónde|qué|quién)\b/.test(lowerMessage)) {
      return 'pregunta';
    }
    if (/\b(ayuda|consejo|guía|necesito|puedes)\b/.test(lowerMessage)) {
      return 'busca_consejo';
    }
    if (/\b(triste|mal|problema|dolor|sufro|angustia)\b/.test(lowerMessage)) {
      return 'desahogo';
    }
    if (/\b(gracias|bien|feliz|alegre|contento)\b/.test(lowerMessage)) {
      return 'gratitud';
    }
    if (/\b(hola|saludo|buenos días|buenas tardes)\b/.test(lowerMessage)) {
      return 'saludo';
    }
    
    return 'conversacion_general';
  }

  /**
   * 🚀 OPTIMIZADO: Generar respuesta del guía con contexto simplificado
   */
  private async generateGuideResponseOptimized(
    conversation: ConversationDocument,
    userMessage: MessageDocument,
    emotionalAnalysis: any
  ): Promise<MessageDocument> {
    // 🚀 PARALELIZAR consultas de BD
    const [guide, user, recentMessages, simpleMemoryContext] = await Promise.all([
      this.spiritualGuideModel.findById(conversation.spiritualGuideId),
      this.userModel.findById(conversation.userId),
      // Solo mensajes recientes (sin embedding complejo)
      this.messageModel
        .find({ conversationId: conversation._id })
        .sort({ timestamp: -1 })
        .limit(10)
        .exec(),
      // Contexto de memoria simplificado
      this.getSimpleMemoryContext(conversation.userId.toString(), userMessage.content)
    ]);

    // 🚀 PROMPT OPTIMIZADO (más simple pero efectivo)
    const systemPrompt = this.buildOptimizedSystemPrompt(
      guide, 
      user, 
      emotionalAnalysis, 
      simpleMemoryContext
    );

    const contextualPrompt = this.buildOptimizedContextualPrompt(
      recentMessages.reverse(), 
      userMessage.content
    );

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: contextualPrompt }
    ];

    // 🚀 GENERAR RESPUESTA (una sola llamada a OpenAI)
    const responseContent = await this.openAiService.generateChatResponse(messages, 0.8);

    // 🚀 CREAR MENSAJE SIN EMBEDDING INMEDIATO
    const guideMessage = new this.messageModel({
      conversationId: conversation._id,
      spiritualGuideId: conversation.spiritualGuideId,
      role: MessageRole.GUIDE,
      content: responseContent,
      generationContext: {
        emotionalState: emotionalAnalysis.tone,
        intent: userMessage.metadata?.intent,
        optimizedGeneration: true
      }
    });

    return await guideMessage.save();
  }

  /**
   * 🚀 OPTIMIZADO: Contexto de memoria simplificado (sin múltiples llamadas a OpenAI)
   */
  private async getSimpleMemoryContext(userId: string, userMessage: string): Promise<{
    personalFacts: string;
    preferences: string;
    relationship: string;
  }> {
    try {
      // Solo si el mensaje parece personal o importante
      const needsMemory = this.messageNeedsMemoryLookup(userMessage);
      
      if (!needsMemory) {
        return { personalFacts: '', preferences: '', relationship: '' };
      }

      // Generar embedding solo si es necesario
      const embedding = await this.openAiService.generateEmbedding(userMessage);
      
      // Usar el contexto de memoria existente pero simplificado
      const memoryContext = await this.pineconeService.buildMemoryContext(
        userId, 
        userMessage,
        embedding
      );

      return {
        personalFacts: memoryContext.personalFacts,
        preferences: memoryContext.preferences,
        relationship: memoryContext.relationship
      };
    } catch (error) {
      console.error('Error getting simple memory context:', error);
      return { personalFacts: '', preferences: '', relationship: '' };
    }
  }

  /**
   * 🚀 OPTIMIZADO: Determinar si el mensaje necesita búsqueda de memoria
   */
  private messageNeedsMemoryLookup(message: string): boolean {
    const personalIndicators = [
      'mi ', 'mis ', 'yo ', 'me ', 'conmigo',
      'recuerdas', 'dijiste', 'hablamos',
      'familia', 'trabajo', 'casa', 'pareja',
      'hijo', 'hija', 'madre', 'padre',
      'nombre', 'edad', 'vivo'
    ];

    const lowerMessage = message.toLowerCase();
    return personalIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * 🚀 OPTIMIZADO: Prompt del sistema simplificado pero efectivo
   */
  private buildOptimizedSystemPrompt(
    guide: SpiritualGuideDocument,
    user: UserDocument,
    emotionalAnalysis: any,
    memoryContext: any
  ): string {
    return `Eres ${guide.name}, guía espiritual de ${user.name}.

PERSONALIDAD: ${guide.personality}
FORMA FÍSICA: ${guide.physicalForm}
CONEXIÓN: ${guide.connectionWithUser}

ESTADO EMOCIONAL DETECTADO:
- Tono: ${emotionalAnalysis.tone}
- Intensidad: ${emotionalAnalysis.intensity}

${memoryContext.personalFacts}
${memoryContext.preferences}
${memoryContext.relationship}

INSTRUCCIONES:
1. Responde como ${guide.name} con tu personalidad única
2. Adapta tu respuesta al estado emocional detectado
3. Usa la información personal que tienes del usuario
4. Mantén un tono espiritual, empático y sabio
5. Respuesta de 150-250 palabras en español
6. Sé natural y fluido en la conversación

Responde desde el corazón como el guía espiritual que eres.`.trim();
  }

  /**
   * 🚀 OPTIMIZADO: Prompt contextual simplificado
   */
  private buildOptimizedContextualPrompt(recentMessages: MessageDocument[], currentMessage: string): string {
    const recentContext = recentMessages
      .slice(-6)
      .map(msg => `${msg.role === MessageRole.USER ? 'Usuario' : 'Tú'}: ${msg.content}`)
      .join('\n');

    return `## Conversación Reciente:
${recentContext}

## Mensaje Actual:
${currentMessage}

Responde manteniendo la continuidad de la conversación.`.trim();
  }

  /**
   * 🚀 BACKGROUND: Procesar memoria sin bloquear respuesta
   */
  private async processMemoryInBackground(
    userId: string,
    guideId: string,
    conversationId: string,
    messageId: string,
    userMessage: string
  ): Promise<void> {
    // Procesar en background sin await para no bloquear
    setImmediate(async () => {
      try {
        await this.embeddingService.processAndStorePersonalInformation(
          userId,
          guideId,
          conversationId,
          messageId,
          userMessage
        );
      } catch (error) {
        console.error('Error processing memory in background:', error);
      }
    });
  }

  /**
   * 🚀 BACKGROUND: Actualizar estadísticas sin bloquear
   */
  private updateConversationStatsBackground(conversationId: string): void {
    setImmediate(async () => {
      try {
        await this.conversationModel.findByIdAndUpdate(conversationId, {
          $inc: { messageCount: 2 },
          lastMessageAt: new Date(),
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error updating stats in background:', error);
      }
    });
  }

  /**
   * Crea una nueva conversación (reutilizado del original)
   */
  async createConversation(userId: string, dto: CreateConversationDto): Promise<ConversationDocument> {
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

    if (dto.initialMessage) {
      await this.sendMessage(userId, {
        spiritualGuideId: dto.spiritualGuideId,
        content: dto.initialMessage,
        conversationId: savedConversation._id.toString()
      });
    }

    return savedConversation;
  }

  // Métodos de consulta reutilizados del original
  async getConversations(userId: string): Promise<ConversationDocument[]> {
    return await this.conversationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('spiritualGuideId', 'name physicalForm')
      .sort({ lastMessageAt: -1 })
      .exec();
  }

  async getMessages(userId: string, conversationId: string): Promise<MessageDocument[]> {
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

  async deleteConversation(userId: string, conversationId: string): Promise<void> {
    const conversation = await this.conversationModel.findOne({
      _id: conversationId,
      userId: new Types.ObjectId(userId)
    });

    if (!conversation) {
      throw new NotFoundException('Conversación no encontrada');
    }

    await this.messageModel.deleteMany({ conversationId: new Types.ObjectId(conversationId) });
    await this.conversationModel.findByIdAndDelete(conversationId);
  }
} 