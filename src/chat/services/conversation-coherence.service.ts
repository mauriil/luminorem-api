import { Injectable, Logger } from '@nestjs/common';
import { OpenAiService } from '../../external-services/services/openai.service';
import { PineconeService } from '../../external-services/services/pinecone.service';
import { MessageDocument } from '../entities/message.entity';

export interface ConversationState {
  currentTopic: string;
  activeEntities: { [key: string]: any };
  implicitContext: string[];
  conversationFlow: string[];
  workingMemory: { [key: string]: any };
  lastReferences: string[];
  topicHistory: string[];
  emotionalFlow: string[];
}

export interface ResolvedContext {
  originalMessage: string;
  resolvedMessage: string;
  implicitInformation: string[];
  activeReferences: string[];
  contextualInferences: string[];
  conversationState: ConversationState;
  needsExplicitInfo: boolean;
}

@Injectable()
export class ConversationCoherenceService {
  private readonly logger = new Logger(ConversationCoherenceService.name);

  constructor(
    private readonly openAiService: OpenAiService,
    private readonly pineconeService: PineconeService,
  ) {}

  /**
   * FUNCIÓN PRINCIPAL: Resuelve todo el contexto conversacional
   */
  async resolveConversationalContext(
    userMessage: string,
    recentMessages: MessageDocument[],
    userId: string,
    conversationId: string
  ): Promise<ResolvedContext> {
    try {
      // 1. Analizar el estado conversacional actual
      const conversationState = await this.analyzeConversationState(recentMessages);

      // 2. Resolver referencias anafóricas y catafóricas
      const referenceResolution = await this.resolveAllReferences(
        userMessage,
        recentMessages,
        conversationState
      );

      // 3. Inferir información implícita
      const implicitInfo = await this.inferImplicitInformation(
        userMessage,
        recentMessages,
        conversationState
      );

      // 4. Completar contexto conversacional
      const completedContext = await this.completeConversationalContext(
        userMessage,
        referenceResolution,
        implicitInfo,
        conversationState
      );

      // 5. Construir mensaje resuelto completamente
      const resolvedMessage = await this.buildFullyResolvedMessage(
        userMessage,
        completedContext,
        conversationState
      );

      return {
        originalMessage: userMessage,
        resolvedMessage: resolvedMessage,
        implicitInformation: implicitInfo,
        activeReferences: referenceResolution.referencedEntities,
        contextualInferences: completedContext.inferences,
        conversationState: conversationState,
        needsExplicitInfo: completedContext.needsMoreInfo
      };

    } catch (error) {
      this.logger.error('Error resolving conversational context:', error);
      return this.getDefaultResolvedContext(userMessage);
    }
  }

  /**
   * Analiza el estado completo de la conversación
   */
  private async analyzeConversationState(recentMessages: MessageDocument[]): Promise<ConversationState> {
    // ✅ VALIDAR QUE TENEMOS MENSAJES PARA ANALIZAR
    if (!recentMessages || recentMessages.length === 0) {
      this.logger.warn('No recent messages provided for conversation analysis');
      return this.getDefaultConversationState();
    }

    // ✅ FILTRAR MENSAJES VÁLIDOS Y CONSTRUIR TEXTO
    const validMessages = recentMessages
      .filter(msg => msg && msg.content && msg.content.trim())
      .slice(-10); // Máximo 10 mensajes más recientes

    if (validMessages.length === 0) {
      this.logger.warn('No valid messages found for conversation analysis');
      return this.getDefaultConversationState();
    }

    const conversationText = validMessages
      .map(msg => `${msg.role}: ${msg.content.trim()}`)
      .join('\n');

    // ✅ VALIDAR QUE EL TEXTO FINAL NO ESTÉ VACÍO
    if (!conversationText.trim()) {
      this.logger.warn('Conversation text is empty after processing');
      return this.getDefaultConversationState();
    }

    const analysisPrompt = `
Analiza esta conversación y extrae el ESTADO CONVERSACIONAL COMPLETO:

${conversationText}

Responde SOLO en JSON:
{
  "currentTopic": "tema principal actual",
  "activeEntities": {
    "entity_name": "descripción/valor"
  },
  "implicitContext": ["información implícita", "contexto sobreentendido"],
  "conversationFlow": ["progresión de temas"],
  "workingMemory": {
    "key_info": "información activa en la conversación"
  },
  "lastReferences": ["últimas entidades mencionadas"],
  "topicHistory": ["temas anteriores"],
  "emotionalFlow": ["progresión emocional"]
}

EXTRAE:
1. **Tema actual** - ¿de qué estamos hablando AHORA?
2. **Entidades activas** - personas, objetos, conceptos que están "en el aire"
3. **Contexto implícito** - información que se da por sentada
4. **Memoria de trabajo** - información clave que está activa
5. **Referencias recientes** - qué se mencionó que puede ser referenciado

Sé específico y completo.`;

    try {
      const result = await this.openAiService.generateChatResponse([
        { role: 'system', content: analysisPrompt },
        { role: 'user', content: conversationText }
      ], 0.1); // Temperatura más baja para respuestas más consistentes

      if (!result || !result.trim()) {
        this.logger.warn('Empty result from OpenAI conversation analysis');
        return this.getDefaultConversationState();
      }

      // Limpiar y parsear la respuesta
      const cleanedResult = this.cleanJsonResponse(result);
      const parsed = JSON.parse(cleanedResult);
      
      // ✅ VALIDAR ESTRUCTURA DEL RESULTADO
      if (typeof parsed === 'object' && parsed !== null) {
        return {
          currentTopic: parsed.currentTopic || 'conversación general',
          activeEntities: parsed.activeEntities || {},
          implicitContext: Array.isArray(parsed.implicitContext) ? parsed.implicitContext : [],
          conversationFlow: Array.isArray(parsed.conversationFlow) ? parsed.conversationFlow : [],
          workingMemory: parsed.workingMemory || {},
          lastReferences: Array.isArray(parsed.lastReferences) ? parsed.lastReferences : [],
          topicHistory: Array.isArray(parsed.topicHistory) ? parsed.topicHistory : [],
          emotionalFlow: Array.isArray(parsed.emotionalFlow) ? parsed.emotionalFlow : []
        };
      } else {
        this.logger.warn('Invalid parsed result structure');
        return this.getDefaultConversationState();
      }
    } catch (error) {
      this.logger.error('Error analyzing conversation state:', error);
      return this.getDefaultConversationState();
    }
  }

  /**
   * Resuelve TODAS las referencias (anafóricas, catafóricas, implícitas)
   */
  private async resolveAllReferences(
    userMessage: string,
    recentMessages: MessageDocument[],
    conversationState: ConversationState
  ): Promise<{ resolvedText: string; referencedEntities: string[]; resolutionMap: any }> {
    // ✅ VALIDACIONES INICIALES
    if (!userMessage || !userMessage.trim()) {
      this.logger.warn('Empty user message provided for reference resolution');
      return {
        resolvedText: userMessage || '',
        referencedEntities: [],
        resolutionMap: {}
      };
    }

    // ✅ CONSTRUIR CONTEXTO CONVERSACIONAL SEGURO
    const validMessages = recentMessages
      ?.filter(msg => msg && msg.content && msg.content.trim())
      ?.slice(-5) || [];

    const conversationContext = validMessages.length > 0 
      ? validMessages.map(msg => `${msg.role}: ${msg.content.trim()}`).join('\n')
      : 'Sin contexto conversacional previo';

    const referencePrompt = `
CONTEXTO CONVERSACIONAL:
Tema actual: ${conversationState.currentTopic || 'conversación general'}
Entidades activas: ${JSON.stringify(conversationState.activeEntities || {})}
Última información: ${conversationState.lastReferences?.join(', ') || 'ninguna'}

CONVERSACIÓN RECIENTE:
${conversationContext}

MENSAJE A RESOLVER: "${userMessage.trim()}"

Tu tarea: Resolver TODAS las referencias para que el mensaje sea completamente explícito.

Responde en JSON:
{
  "resolvedText": "mensaje con todas las referencias resueltas",
  "referencedEntities": ["entidades referenciadas"],
  "resolutionMap": {
    "referencia_original": "entidad_resuelta"
  }
}

TIPOS DE REFERENCIAS A RESOLVER:
- Anafóricas: "los", "esos", "ellos" → entidades específicas
- Catafóricas: "esto que te voy a decir" → información que viene
- Implícitas: "¿cómo se llaman?" → "¿cómo se llaman [los gatos]?"
- Contextuales: "el que compramos" → "el [objeto] que compramos"

EJEMPLO:
Usuario dice: "¿cómo los puedo llamar?"
Si el tema son gatos: "¿cómo puedo llamar a los gatos?"`;

    try {
      const result = await this.openAiService.generateChatResponse([
        { role: 'system', content: referencePrompt },
        { role: 'user', content: userMessage.trim() }
      ], 0.1);

      if (!result || !result.trim()) {
        this.logger.warn('Empty result from reference resolution');
        return {
          resolvedText: userMessage,
          referencedEntities: [],
          resolutionMap: {}
        };
      }

      const cleanedResult = this.cleanJsonResponse(result);
      const parsed = JSON.parse(cleanedResult);
      
      // ✅ VALIDAR Y ESTRUCTURAR RESULTADO
      return {
        resolvedText: parsed.resolvedText && typeof parsed.resolvedText === 'string' 
          ? parsed.resolvedText 
          : userMessage,
        referencedEntities: Array.isArray(parsed.referencedEntities) 
          ? parsed.referencedEntities.filter(entity => entity && entity.trim())
          : [],
        resolutionMap: parsed.resolutionMap && typeof parsed.resolutionMap === 'object' 
          ? parsed.resolutionMap 
          : {}
      };
    } catch (error) {
      this.logger.error('Error resolving references:', error);
      return {
        resolvedText: userMessage,
        referencedEntities: [],
        resolutionMap: {}
      };
    }
  }

  /**
   * Infiere información implícita que falta
   */
  private async inferImplicitInformation(
    userMessage: string,
    recentMessages: MessageDocument[],
    conversationState: ConversationState
  ): Promise<string[]> {
    // ✅ VALIDACIONES INICIALES
    if (!userMessage || !userMessage.trim()) {
      this.logger.warn('Empty user message provided for implicit information inference');
      return [];
    }

    // ✅ CONSTRUIR CONTEXTO SEGURO
    const validMessages = recentMessages
      ?.filter(msg => msg && msg.content && msg.content.trim())
      ?.slice(-5) || [];

    const conversationContext = validMessages.length > 0 
      ? validMessages.map(msg => `${msg.role}: ${msg.content.trim()}`).join('\n')
      : 'Sin contexto conversacional previo';

    const inferencePrompt = `
ESTADO CONVERSACIONAL:
${JSON.stringify(conversationState, null, 2)}

CONVERSACIÓN:
${conversationContext}

MENSAJE: "${userMessage.trim()}"

Identifica información IMPLÍCITA que falta para entender completamente el mensaje.

Responde array JSON de strings:
["información implícita 1", "información implícita 2"]

BUSCA:
1. Información que se da por sentada
2. Contexto que falta pero es obvio
3. Detalles que se asumen
4. Conexiones no explícitas

EJEMPLO:
Si dice "¿nombres?" y el tema son gatos → ["Se refiere a nombres para gatos", "Busca sugerencias de nombres"]`;

    try {
      const result = await this.openAiService.generateChatResponse([
        { role: 'system', content: inferencePrompt },
        { role: 'user', content: userMessage.trim() }
      ], 0.1);

      if (!result || !result.trim()) {
        this.logger.warn('Empty result from implicit information inference');
        return [];
      }

      // ✅ MANEJAR TANTO ARRAYS COMO OBJETOS JSON
      let parsed: any;
      
      try {
        // Limpiar la respuesta
        let cleaned = result.trim();
        
        // Si es un array directo, parsearlo
        if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
          parsed = JSON.parse(cleaned);
        } else {
          // Si viene en formato de objeto, intentar extraer el array
          const cleanedResult = this.cleanJsonResponse(result);
          parsed = JSON.parse(cleanedResult);
        }
        
        // Si es un array directo, devolverlo
        if (Array.isArray(parsed)) {
          return parsed.filter(item => item && typeof item === 'string' && item.trim());
        }
        
        // Si es un objeto, buscar propiedades que contengan arrays
        if (typeof parsed === 'object' && parsed !== null) {
          // Buscar posibles propiedades que contengan la información implícita
          const possibleArrays = Object.values(parsed).filter(value => Array.isArray(value));
          if (possibleArrays.length > 0) {
            return (possibleArrays[0] as string[]).filter(item => item && typeof item === 'string' && item.trim());
          }
        }
        
        return [];
      } catch (parseError) {
        this.logger.error('Error parsing implicit information result:', parseError);
        return [];
      }
    } catch (error) {
      this.logger.error('Error inferring implicit information:', error);
      return [];
    }
  }

  /**
   * Completa el contexto conversacional completo
   */
  private async completeConversationalContext(
    userMessage: string,
    referenceResolution: any,
    implicitInfo: string[],
    conversationState: ConversationState
  ): Promise<{ fullContext: string; inferences: string[]; needsMoreInfo: boolean }> {
    const contextPrompt = `
MENSAJE ORIGINAL: "${userMessage}"
MENSAJE RESUELTO: "${referenceResolution.resolvedText}"
INFORMACIÓN IMPLÍCITA: ${JSON.stringify(implicitInfo)}
ESTADO CONVERSACIONAL: ${JSON.stringify(conversationState)}

Construye el CONTEXTO CONVERSACIONAL COMPLETO para que un asistente pueda responder perfectamente sin necesidad de más información.

Responde en JSON:
{
  "fullContext": "contexto completo explicado",
  "inferences": ["inferencias adicionales"],
  "needsMoreInfo": boolean
}

El contexto debe incluir:
1. Todo lo que se está discutiendo
2. Referencias resueltas
3. Información implícita explicitada  
4. Estado emocional
5. Intención del usuario
6. Próximos pasos lógicos`;

    try {
      const result = await this.openAiService.generateChatResponse([
        { role: 'system', content: contextPrompt },
        { role: 'user', content: `${userMessage} | ${JSON.stringify({ referenceResolution, implicitInfo, conversationState })}` }
      ], 0.1);

      const cleanedResult = this.cleanJsonResponse(result);
      return JSON.parse(cleanedResult);
    } catch (error) {
      this.logger.error('Error completing conversational context:', error);
      return {
        fullContext: userMessage,
        inferences: [],
        needsMoreInfo: false
      };
    }
  }

  /**
   * Construye el mensaje completamente resuelto
   */
  private async buildFullyResolvedMessage(
    originalMessage: string,
    completedContext: any,
    conversationState: ConversationState
  ): Promise<string> {
    return `CONTEXTO COMPLETO: ${completedContext.fullContext}

MENSAJE RESUELTO: ${originalMessage}

INFORMACIÓN ACTIVA:
- Tema: ${conversationState.currentTopic}
- Entidades: ${Object.keys(conversationState.activeEntities || {}).join(', ') || 'ninguna'}
- Contexto implícito: ${conversationState.implicitContext?.join(', ') || 'ninguno'}

INFERENCIAS: ${completedContext.inferences?.join(', ') || 'ninguna'}`;
  }

  /**
   * Busca contexto conversacional en Pinecone usando el contexto resuelto
   */
  async searchConversationalMemory(
    userId: string,
    resolvedContext: ResolvedContext
  ): Promise<{
    relevantMemories: any[];
    entityMemories: any[];
    topicMemories: any[];
  }> {
    try {
      let relevantMemories = [];
      let entityMemories = [];
      let topicMemories = [];

      // ✅ VALIDAR Y BUSCAR MEMORIAS PARA EL CONTEXTO COMPLETO
      if (resolvedContext.resolvedMessage && resolvedContext.resolvedMessage.trim()) {
        try {
          const contextEmbedding = await this.openAiService.generateEmbedding(resolvedContext.resolvedMessage.trim());
          
          relevantMemories = await this.pineconeService.searchUserMemories(
            userId,
            contextEmbedding,
            {
              topK: 15,
              minScore: 0.4,
              includeRecent: true
            }
          );
        } catch (error) {
          this.logger.error('Error generating embedding for resolved message:', error);
        }
      }

      // ✅ BUSCAR MEMORIAS ESPECÍFICAS PARA ENTIDADES ACTIVAS (CON VALIDACIÓN)
      if (resolvedContext.activeReferences && resolvedContext.activeReferences.length > 0) {
        for (const entity of resolvedContext.activeReferences) {
          if (entity && entity.trim() && entity.trim().length > 2) { // Mínimo 3 caracteres
            try {
              const entityEmbedding = await this.openAiService.generateEmbedding(entity.trim());
              const memories = await this.pineconeService.searchUserMemories(
                userId,
                entityEmbedding,
                {
                  topK: 5,
                  minScore: 0.7
                }
              );
              entityMemories.push(...memories);
            } catch (error) {
              this.logger.error(`Error generating embedding for entity "${entity}":`, error);
            }
          }
        }
      }

      // ✅ BUSCAR MEMORIAS DEL TEMA ACTUAL (CON VALIDACIÓN)
      const currentTopic = resolvedContext.conversationState?.currentTopic;
      if (currentTopic && currentTopic.trim() && currentTopic.trim() !== 'conversación general') {
        try {
          const topicEmbedding = await this.openAiService.generateEmbedding(currentTopic.trim());
          topicMemories = await this.pineconeService.searchUserMemories(
            userId,
            topicEmbedding,
            {
              topK: 8,
              minScore: 0.5
            }
          );
        } catch (error) {
          this.logger.error(`Error generating embedding for topic "${currentTopic}":`, error);
        }
      }

      return {
        relevantMemories,
        entityMemories,
        topicMemories
      };

    } catch (error) {
      this.logger.error('Error searching conversational memory:', error);
      return {
        relevantMemories: [],
        entityMemories: [],
        topicMemories: []
      };
    }
  }

  /**
   * Formatea el contexto conversacional para el prompt
   */
  formatCoherenceContext(
    resolvedContext: ResolvedContext,
    memories: any
  ): string {
    let formatted = '## 🧠 CONTEXTO CONVERSACIONAL COMPLETO:\n\n';
    
    formatted += `**MENSAJE ORIGINAL:** "${resolvedContext.originalMessage}"\n\n`;
    formatted += `**CONTEXTO RESUELTO:** ${resolvedContext.resolvedMessage}\n\n`;
    
    if (resolvedContext.activeReferences.length > 0) {
      formatted += `**REFERENCIAS ACTIVAS:** ${resolvedContext.activeReferences.join(', ')}\n\n`;
    }
    
    if (resolvedContext.implicitInformation.length > 0) {
      formatted += `**INFORMACIÓN IMPLÍCITA:**\n`;
      resolvedContext.implicitInformation.forEach(info => {
        formatted += `- ${info}\n`;
      });
      formatted += '\n';
    }
    
    formatted += `**ESTADO CONVERSACIONAL:**\n`;
    formatted += `- Tema actual: ${resolvedContext.conversationState.currentTopic}\n`;
    formatted += `- Entidades activas: ${Object.keys(resolvedContext.conversationState.activeEntities || {}).join(', ') || 'ninguna'}\n`;
    formatted += `- Flujo emocional: ${resolvedContext.conversationState.emotionalFlow?.join(' → ') || 'neutro'}\n\n`;
    
    if (memories.entityMemories.length > 0) {
      formatted += `**INFORMACIÓN ESPECÍFICA RELEVANTE:**\n`;
      memories.entityMemories.slice(0, 5).forEach(memory => {
        formatted += `- ${memory.metadata.content}\n`;
      });
      formatted += '\n';
    }
    
    if (memories.topicMemories.length > 0) {
      formatted += `**MEMORIA DEL TEMA ACTUAL:**\n`;
      memories.topicMemories.slice(0, 3).forEach(memory => {
        formatted += `- ${memory.metadata.content}\n`;
      });
      formatted += '\n';
    }
    
    formatted += `**INSTRUCCIÓN ESPECIAL:** Responde manteniendo TOTAL coherencia con todo este contexto. No pidas que repita información que ya está aquí. Actúa como si recordaras perfectamente toda la conversación.`;
    
    return formatted;
  }

  // Funciones auxiliares
  
  /**
   * Limpia la respuesta de OpenAI para obtener JSON válido
   */
  private cleanJsonResponse(response: string): string {
    // console.log("🚀 ~ cleanJsonResponse ~ response:", response)
    try {
      if (!response || typeof response !== 'string') {
        this.logger.warn('Empty or invalid response received');
        return '{}';
      }

      let cleaned = response.trim();
      
      // Remover bloques de código markdown
      cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Remover texto antes del primer {
      const firstBraceIndex = cleaned.indexOf('{');
      if (firstBraceIndex === -1) {
        this.logger.warn('No opening brace found in response');
        return '{}';
      }
      
      if (firstBraceIndex > 0) {
        cleaned = cleaned.substring(firstBraceIndex);
      }
      
      // Encontrar el último } que cierre correctamente
      let braceCount = 0;
      let lastValidIndex = -1;
      
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '{') {
          braceCount++;
        } else if (cleaned[i] === '}') {
          braceCount--;
          if (braceCount === 0) {
            lastValidIndex = i;
            break;
          }
        }
      }
      
      if (lastValidIndex === -1) {
        this.logger.warn('No matching closing brace found');
        return '{}';
      }
      
      cleaned = cleaned.substring(0, lastValidIndex + 1);
      
      // Intentar parsear el JSON para validar
      const parsed = JSON.parse(cleaned);
      
      // Validar que tenga la estructura esperada
      if (typeof parsed === 'object' && parsed !== null) {
        return cleaned;
      } else {
        this.logger.warn('Parsed result is not a valid object');
        return '{}';
      }
      
    } catch (error) {
      this.logger.warn(`Failed to clean JSON response: ${error.message}. Original response: ${response?.substring(0, 200)}...`);
      return '{}';
    }
  }

  private getDefaultConversationState(): ConversationState {
    return {
      currentTopic: 'conversación general',
      activeEntities: {},
      implicitContext: [],
      conversationFlow: [],
      workingMemory: {},
      lastReferences: [],
      topicHistory: [],
      emotionalFlow: []
    };
  }

  private getDefaultResolvedContext(userMessage: string): ResolvedContext {
    return {
      originalMessage: userMessage,
      resolvedMessage: userMessage,
      implicitInformation: [],
      activeReferences: [],
      contextualInferences: [],
      conversationState: this.getDefaultConversationState(),
      needsExplicitInfo: false
    };
  }
} 