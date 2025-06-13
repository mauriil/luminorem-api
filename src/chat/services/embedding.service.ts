import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../../external-services/services/openai.service';
import { PineconeService } from '../../external-services/services/pinecone.service';
import { MemoryIntelligenceService } from './memory-intelligence.service';
import { ConversationCoherenceService, ResolvedContext } from './conversation-coherence.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from '../entities/message.entity';

@Injectable()
export class EmbeddingService {
  constructor(
    private readonly openAiService: OpenAiService,
    private readonly pineconeService: PineconeService,
    private readonly memoryIntelligenceService: MemoryIntelligenceService,
    private readonly conversationCoherenceService: ConversationCoherenceService,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  /**
   * Genera embeddings para un texto usando OpenAI
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Validaciones más robustas
      if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string');
      }
      
      const trimmedText = text.trim();
      if (trimmedText === '') {
        throw new Error('Cannot generate embedding for empty or whitespace-only text');
      }
      
      if (trimmedText.length < 2) {
        throw new Error('Text must be at least 2 characters long');
      }
      
      return await this.openAiService.generateEmbedding(trimmedText);
    } catch (error) {
      console.error(`Error generating embedding for text: "${text?.substring(0, 50)}...":`, error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Calcula similitud coseno entre dos embeddings
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Busca mensajes similares en una conversación basado en embeddings
   */
  async findSimilarMessages(
    conversationId: string,
    queryEmbedding: number[],
    limit: number = 5,
    threshold: number = 0.7
  ): Promise<MessageDocument[]> {
    const messages = await this.messageModel
      .find({ 
        conversationId,
        embedding: { $exists: true, $ne: null }
      })
      .exec();

    const similarMessages = messages
      .map(message => ({
        message,
        similarity: this.cosineSimilarity(queryEmbedding, message.embedding)
      }))
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => item.message);

    return similarMessages;
  }

  /**
   * Busca contexto relevante usando Pinecone y memoria a largo plazo CON coherencia conversacional total
   */
  async findRelevantContext(
    conversationId: string,
    userId: string,
    userMessage: string,
    limit: number = 3
  ): Promise<{
    recentMessages: MessageDocument[];
    memoryContext: {
      personalFacts: string;
      preferences: string;  
      relationship: string;
      relevantMemories: string;
      conversationalCoherence: string;
    };
    contextSummary: string;
    isPersonalQuestion: boolean;
    resolvedContext: ResolvedContext;
    hasFullCoherence: boolean;
  }> {
    // Obtener mensajes recientes de la conversación actual
    const recentMessages = await this.messageModel
      .find({ conversationId })
      .sort({ timestamp: -1 })
      .limit(15) // Aumentamos para mejor análisis conversacional
      .exec();

    // 🧠 PASO 1: RESOLVER COHERENCIA CONVERSACIONAL COMPLETA
    const resolvedContext = await this.conversationCoherenceService.resolveConversationalContext(
      userMessage,
      recentMessages,
      userId,
      conversationId
    );

    // 🔍 PASO 2: BUSCAR MEMORIAS USANDO CONTEXTO RESUELTO
    let conversationalMemories = {
      relevantMemories: [],
      entityMemories: [],
      topicMemories: []
    };
    
    try {
      conversationalMemories = await this.conversationCoherenceService.searchConversationalMemory(
        userId,
        resolvedContext
      );
    } catch (error) {
      console.error('Error searching conversational memory:', error);
      // Continuar con valores por defecto
    }

    // 🎯 PASO 3: GENERAR EMBEDDING CON CONTEXTO COMPLETO RESUELTO
    let queryEmbedding: number[] = [];
    const queryText = resolvedContext.resolvedMessage || userMessage || '';
    
    // ✅ VALIDAR QUE TENEMOS TEXTO VÁLIDO ANTES DE GENERAR EMBEDDING
    if (queryText.trim() && queryText.trim().length >= 2) {
      try {
        queryEmbedding = await this.generateEmbedding(queryText);
      } catch (error) {
        console.error('Error generating query embedding:', error);
        // Intentar con mensaje original como fallback
        if (userMessage && userMessage.trim() && userMessage.trim().length >= 2) {
          try {
            queryEmbedding = await this.generateEmbedding(userMessage);
          } catch (fallbackError) {
            console.error('Error generating fallback embedding:', fallbackError);
            // Usar un texto por defecto mínimo
            queryEmbedding = await this.generateEmbedding('conversación general');
          }
        } else {
          // Usar un texto por defecto mínimo
          queryEmbedding = await this.generateEmbedding('conversación general');
        }
      }
    } else {
      console.warn('No valid text found for embedding generation, using default');
      queryEmbedding = await this.generateEmbedding('conversación general');
    }

    // 🤔 PASO 4: DETECTAR INTENCIÓN CON CONTEXTO RESUELTO
    let questionIntent: {
      isPersonalQuestion: boolean;
      searchTerms: string[];
      questionType: 'fact_recall' | 'preference_check' | 'relationship_query' | 'general';
    } = {
      isPersonalQuestion: false,
      searchTerms: [],
      questionType: 'general'
    };
    
    try {
      questionIntent = await this.memoryIntelligenceService.detectPersonalQuestionIntent(
        queryText
      );
    } catch (error) {
      console.error('Error detecting question intent:', error);
      // Continuar con valores por defecto
    }

    // 📚 PASO 5: CONSTRUIR CONTEXTO DE MEMORIA TRADICIONAL
    let memoryContext = {
      personalFacts: '',
      preferences: '',  
      relationship: '',
      relevantMemories: ''
    };
    
    try {
      memoryContext = await this.pineconeService.buildMemoryContext(
        userId,
        queryText,
        queryEmbedding
      );
    } catch (error) {
      console.error('Error building memory context:', error);
      // Continuar con valores por defecto
    }

    // 🔗 PASO 6: BUSCAR INFORMACIÓN ESPECÍFICA (CON REFERENCIAS RESUELTAS)
    if (questionIntent.isPersonalQuestion) {
      const searchTerms = [
        ...questionIntent.searchTerms,
        ...resolvedContext.activeReferences
      ];
      
      const specificFacts = await this.searchSpecificPersonalFacts(
        userId,
        searchTerms,
        questionIntent.questionType
      );
      
      if (specificFacts) {
        memoryContext.personalFacts = specificFacts + '\n\n' + memoryContext.personalFacts;
      }
    }

    // 🎨 PASO 7: FORMATEAR CONTEXTO DE COHERENCIA CONVERSACIONAL
    let conversationalCoherence = '## 🧠 Contexto conversacional no disponible';
    
    try {
      conversationalCoherence = this.conversationCoherenceService.formatCoherenceContext(
        resolvedContext,
        conversationalMemories
      );
    } catch (error) {
      console.error('Error formatting coherence context:', error);
      // Continuar con valor por defecto
    }

    // 📋 PASO 8: CREAR RESUMEN COMPLETO DEL CONTEXTO
    let contextSummary = `Contexto básico para el mensaje: "${userMessage}"`;
    
    try {
      contextSummary = await this.createEnhancedContextSummary(
        recentMessages,
        { ...memoryContext, conversationalCoherence },
        userMessage,
        resolvedContext,
        questionIntent.isPersonalQuestion
      );
    } catch (error) {
      console.error('Error creating enhanced context summary:', error);
      // Continuar con valor por defecto
    }

    return {
      recentMessages: recentMessages.reverse(),
      memoryContext: {
        ...memoryContext,
        conversationalCoherence
      },
      contextSummary,
      isPersonalQuestion: questionIntent.isPersonalQuestion,
      resolvedContext,
      hasFullCoherence: !(resolvedContext.needsExplicitInfo ?? false)
    };
  }

  /**
   * Busca hechos personales específicos para responder preguntas directas
   */
  private async searchSpecificPersonalFacts(
    userId: string,
    searchTerms: string[],
    questionType: 'fact_recall' | 'preference_check' | 'relationship_query' | 'general'
  ): Promise<string | null> {
    if (searchTerms.length === 0) return null;

    try {
      // Buscar por cada término específico
      for (const term of searchTerms) {
        const facts = await this.pineconeService.getUserPersonalFacts(userId);
        
        const relevantFact = facts.find(fact => 
          fact.metadata.personalFacts?.subject.toLowerCase().includes(term.toLowerCase()) ||
          fact.metadata.content.toLowerCase().includes(term.toLowerCase())
        );

        if (relevantFact && relevantFact.metadata.personalFacts) {
          return `## Información Específica Encontrada:\n- ${relevantFact.metadata.personalFacts.subject}: ${relevantFact.metadata.personalFacts.value}`;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error searching specific personal facts:', error);
      return null;
    }
  }

  /**
   * Crea un resumen del contexto para la IA
   */
  private async createContextSummary(
    recentMessages: MessageDocument[],
    memoryContext: {
      personalFacts: string;
      preferences: string;
      relationship: string;
      relevantMemories: string;
    },
    currentMessage: string,
    isPersonalQuestion: boolean = false
  ): Promise<string> {
    const recentContext = recentMessages
      .slice(-5)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return `
## Contexto Reciente de esta Conversación:
${recentContext}

${memoryContext.personalFacts}

${memoryContext.preferences}

${memoryContext.relationship}

${memoryContext.relevantMemories}

## Mensaje Actual del Usuario:
${currentMessage}

${isPersonalQuestion ? '⚠️ NOTA: El usuario está haciendo una pregunta sobre información personal que deberías recordar.' : ''}
`.trim();
  }

  /**
   * Crea un resumen MEJORADO del contexto con coherencia conversacional completa
   */
  private async createEnhancedContextSummary(
    recentMessages: MessageDocument[],
    memoryContext: {
      personalFacts: string;
      preferences: string;
      relationship: string;
      relevantMemories: string;
      conversationalCoherence: string;
    },
    currentMessage: string,
    resolvedContext: ResolvedContext,
    isPersonalQuestion: boolean = false
  ): Promise<string> {
    const recentContext = recentMessages
      .slice(-8) // Más contexto para mejor coherencia
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return `
## 🧠 CONTEXTO CONVERSACIONAL COMPLETO:

### Mensaje Original del Usuario:
"${currentMessage}"

### Contexto Resuelto y Analizado:
${resolvedContext.resolvedMessage || currentMessage}

${(resolvedContext.implicitInformation && resolvedContext.implicitInformation.length > 0) ? `
### Información Implícita Detectada:
${resolvedContext.implicitInformation.map(info => `- ${info}`).join('\n')}
` : ''}

### Historial Reciente de la Conversación:
${recentContext}

${memoryContext.conversationalCoherence}

${memoryContext.personalFacts}

${memoryContext.preferences}

${memoryContext.relationship}

${memoryContext.relevantMemories}

### Estado Conversacional Actual:
- **Tema:** ${resolvedContext.conversationState?.currentTopic || 'conversación general'}
- **Entidades Activas:** ${Object.keys(resolvedContext.conversationState?.activeEntities || {}).join(', ') || 'Ninguna'}
- **Referencias:** ${resolvedContext.activeReferences?.join(', ') || 'Ninguna'}
- **Flujo Emocional:** ${resolvedContext.conversationState?.emotionalFlow?.join(' → ') || 'Neutral'}

${isPersonalQuestion ? `
### ⚠️ PREGUNTA PERSONAL DETECTADA:
El usuario está preguntando sobre información personal que deberías recordar perfectamente.
` : ''}

### 🎯 INSTRUCCIONES ESPECIALES DE COHERENCIA:
1. **NUNCA** pidas que repita información que ya tienes
2. **SIEMPRE** mantén el hilo conversacional
3. **RESPONDE** como si recordaras cada detalle de la conversación
4. **USA** todas las referencias resueltas automáticamente
5. **MANTÉN** coherencia emocional y temática total

${(resolvedContext.needsExplicitInfo ?? false) ? '⚠️ NOTA: Puede necesitar información adicional que no está en el contexto.' : '✅ CONTEXTO COMPLETO: Tienes toda la información necesaria para responder perfectamente.'}
`.trim();
  }

  /**
   * Procesa y guarda información personal de un mensaje en Pinecone
   */
  async processAndStorePersonalInformation(
    userId: string,
    guideId: string,
    conversationId: string,
    messageId: string,
    userMessage: string,
    guideResponse?: string
  ): Promise<void> {
    try {
      // Extraer información del mensaje
      const extractedInfo = await this.memoryIntelligenceService.extractInformationFromMessage(
        userMessage,
        guideResponse
      );

      // Generar embedding para el mensaje
      const messageEmbedding = await this.generateEmbedding(userMessage);

      // Calcular importancia general
      const importance = this.memoryIntelligenceService.calculateImportance(extractedInfo);

      // Guardar hechos personales
      for (const fact of extractedInfo.personalFacts) {
        await this.pineconeService.updatePersonalFact(
          userId,
          guideId,
          conversationId,
          messageId,
          messageEmbedding,
          fact
        );
      }

      // Guardar preferencias
      for (const preference of extractedInfo.preferences) {
        const preferenceId = `${userId}_pref_${preference.category}_${Date.now()}`;
        await this.pineconeService.storeMemory(preferenceId, messageEmbedding, {
          userId,
          guideId,
          conversationId,
          messageId,
          content: preference.preference,
          timestamp: Date.now(),
          memoryType: 'preference',
          preferences: preference,
          extractedFrom: 'direct_statement',
          importance: preference.intensity,
          lastUpdated: Date.now(),
          updateCount: 1
        });
      }

      // Guardar cambios de relación
      if (extractedInfo.relationshipChanges) {
        const relationshipId = `${userId}_relationship`;
        await this.pineconeService.storeMemory(relationshipId, messageEmbedding, {
          userId,
          guideId,
          conversationId,
          messageId,
          content: `Cambio en la relación: ${JSON.stringify(extractedInfo.relationshipChanges)}`,
          timestamp: Date.now(),
          memoryType: 'relationship',
          relationship: {
            ...extractedInfo.relationshipChanges,
            intimacyLevel: extractedInfo.relationshipChanges.intimacyLevel ?? 0.5,
            communicationTone: extractedInfo.relationshipChanges.communicationTone ?? 'casual'
          },
          extractedFrom: 'direct_statement',
          importance: 0.8,
          lastUpdated: Date.now(),
          updateCount: 1
        });
      }

      // Guardar metas/objetivos
      for (const goal of extractedInfo.goals) {
        const goalId = `${userId}_goal_${Date.now()}`;
        await this.pineconeService.storeMemory(goalId, messageEmbedding, {
          userId,
          guideId,
          conversationId,
          messageId,
          content: `Meta: ${goal.goal} (${goal.timeframe})`,
          timestamp: Date.now(),
          memoryType: 'goal',
          extractedFrom: 'direct_statement',
          importance: goal.importance,
          lastUpdated: Date.now(),
          updateCount: 1
        });
      }

      // Guardar estado emocional si es significativo
      if (extractedInfo.emotionalState.intensity > 0.5) {
        const emotionId = `${userId}_emotion_${Date.now()}`;
        await this.pineconeService.storeMemory(emotionId, messageEmbedding, {
          userId,
          guideId,
          conversationId,
          messageId,
          content: `Estado emocional: ${extractedInfo.emotionalState.tone} (${extractedInfo.emotionalState.emotions.join(', ')})`,
          timestamp: Date.now(),
          memoryType: 'emotional_state',
          extractedFrom: 'direct_statement',
          importance: Math.min(extractedInfo.emotionalState.intensity + 0.2, 1),
          lastUpdated: Date.now(),
          updateCount: 1
        });
      }

      // Siempre guardar el mensaje completo para contexto
      const messageContextId = `${userId}_msg_${messageId}`;
      await this.pineconeService.storeMemory(messageContextId, messageEmbedding, {
        userId,
        guideId,
        conversationId,
        messageId,
        content: userMessage,
        timestamp: Date.now(),
        memoryType: 'personal_fact', // clasificar como hecho por defecto
        extractedFrom: 'direct_statement',
        importance: Math.max(importance, 0.3), // mínimo 0.3 para todos los mensajes
        lastUpdated: Date.now(),
        updateCount: 1
      });

    } catch (error) {
      console.error('Error processing personal information:', error);
      // No lanzar error para no interrumpir el flujo de conversación
    }
  }

  /**
   * Analiza el tono emocional de un mensaje (mantenemos la función original)
   */
  async analyzeEmotionalTone(message: string): Promise<{
    tone: string;
    intensity: number;
    emotions: string[];
  }> {
    // Esta función podría usar OpenAI para análisis más sofisticado
    // Por ahora implementamos una versión básica
    const emotionalKeywords = {
      alegre: ['feliz', 'contento', 'alegre', 'bien', 'genial', 'excelente'],
      triste: ['triste', 'mal', 'deprimido', 'solo', 'vacío'],
      ansioso: ['ansiedad', 'nervioso', 'preocupado', 'estresado', 'miedo'],
      enojado: ['enojado', 'furioso', 'irritado', 'molesto'],
      confundido: ['confundido', 'perdido', 'no entiendo', 'dudas'],
      esperanzado: ['esperanza', 'optimista', 'futuro', 'posibilidad']
    };

    const lowerMessage = message.toLowerCase();
    const detectedEmotions = [];
    let dominantTone = 'neutral';
    let maxMatches = 0;

    for (const [emotion, keywords] of Object.entries(emotionalKeywords)) {
      const matches = keywords.filter(keyword => 
        lowerMessage.includes(keyword)
      ).length;
      
      if (matches > 0) {
        detectedEmotions.push(emotion);
        if (matches > maxMatches) {
          maxMatches = matches;
          dominantTone = emotion;
        }
      }
    }

    return {
      tone: dominantTone,
      intensity: Math.min(maxMatches / 3, 1), // normalizar intensidad
      emotions: detectedEmotions
    };
  }

  /**
   * 🚀 OPTIMIZADO: Construir contexto de memoria simplificado para la versión optimizada
   */
  async buildMemoryContext(userId: string, currentMessage: string, queryEmbedding: number[]): Promise<{
    personalFacts: string;
    preferences: string;
    relationship: string;
    relevantMemories: string;
  }> {
    try {
      return await this.pineconeService.buildMemoryContext(userId, currentMessage, queryEmbedding);
    } catch (error) {
      console.error('Error building memory context:', error);
      return {
        personalFacts: '',
        preferences: '',
        relationship: '',
        relevantMemories: ''
      };
    }
  }
} 