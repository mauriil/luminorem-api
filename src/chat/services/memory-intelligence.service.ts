import { Injectable, Logger } from '@nestjs/common';
import { OpenAiService } from '../../external-services/services/openai.service';
import { MemoryMetadata } from '../../external-services/services/pinecone.service';

export interface ExtractedInformation {
  personalFacts: Array<{
    category: 'family' | 'pets' | 'work' | 'hobbies' | 'health' | 'location' | 'other';
    subject: string;
    value: string | number;
    confidence: number;
    extractedFrom: 'direct_statement' | 'implied' | 'question_answer' | 'correction';
  }>;
  
  preferences: Array<{
    category: 'communication' | 'treatment' | 'topics' | 'style';
    preference: string;
    intensity: number;
  }>;
  
  relationshipChanges: {
    userNickname?: string;
    guideNickname?: string;
    communicationTone?: 'formal' | 'casual' | 'intimate' | 'playful';
    intimacyLevel?: number;
  } | null;
  
  emotionalState: {
    tone: string;
    intensity: number;
    emotions: string[];
  };
  
  goals: Array<{
    goal: string;
    timeframe: string;
    importance: number;
  }>;
}

@Injectable()
export class MemoryIntelligenceService {
  private readonly logger = new Logger(MemoryIntelligenceService.name);

  constructor(private readonly openAiService: OpenAiService) {}

  /**
   * Analiza un mensaje y extrae información relevante para la memoria
   */
  async extractInformationFromMessage(
    userMessage: string,
    guideResponse?: string,
    conversationHistory?: string[]
  ): Promise<ExtractedInformation> {
    try {
      const analysisPrompt = this.buildAnalysisPrompt(userMessage, guideResponse, conversationHistory);
      
      const analysisResult = await this.openAiService.generateChatResponse([
        { role: 'system', content: analysisPrompt },
        { role: 'user', content: userMessage }
      ], 0.3);

      return this.parseAnalysisResult(analysisResult);
    } catch (error) {
      this.logger.error('Error extracting information:', error);
      return this.getEmptyExtraction();
    }
  }

  /**
   * Construye el prompt para análisis de información
   */
  private buildAnalysisPrompt(
    userMessage: string,
    guideResponse?: string,
    conversationHistory?: string[]
  ): string {
    return `
Eres un experto en análisis de conversaciones que extrae información personal importante.

Tu tarea es analizar el mensaje del usuario y extraer SOLO información que sea:
1. FACTUAL y específica (no opiniones vagas)
2. PERSONAL del usuario
3. MEMORABLE y relevante para futuras conversaciones

## CATEGORÍAS A EXTRAER:

### HECHOS PERSONALES (personal_facts):
- **family**: hermanos, padres, hijos, familia (ej: "tengo 2 hermanos")
- **pets**: mascotas específicas (ej: "tengo 5 perros", "mi gato se llama Luna")
- **work**: trabajo, profesión, estudios (ej: "soy programador", "trabajo en marketing")
- **hobbies**: aficiones, deportes, actividades (ej: "me gusta el yoga", "juego fútbol")
- **health**: salud, condiciones médicas (ej: "soy diabético", "tengo ansiedad")
- **location**: ubicación, ciudad, país (ej: "vivo en Madrid", "soy de México")
- **other**: otros hechos importantes

### PREFERENCIAS (preferences):
- **communication**: cómo le gusta que le hablen (ej: "háblame de manera casual")
- **treatment**: cómo quiere ser tratado (ej: "no me des consejos directos")
- **topics**: temas que le interesan o evita (ej: "no me gusta hablar de política")
- **style**: estilo de conversación preferido

### RELACIÓN (relationship):
- **userNickname**: cómo quiere que lo llamen (ej: "llámame Mario")
- **guideNickname**: cómo llama al guía (ej: "te voy a llamar Sabio")
- **communicationTone**: formal/casual/intimate/playful
- **intimacyLevel**: qué tan cercana es la relación (0-1)

### METAS/OBJETIVOS (goals):
- Objetivos mencionados por el usuario (ej: "quiero perder peso", "necesito encontrar trabajo")

## FORMATO DE RESPUESTA (JSON estricto):
{
  "personalFacts": [
    {
      "category": "pets",
      "subject": "perros",
      "value": "5",
      "confidence": 0.9,
      "extractedFrom": "direct_statement"
    }
  ],
  "preferences": [
    {
      "category": "communication",
      "preference": "hablar de manera casual y relajada",
      "intensity": 0.8
    }
  ],
  "relationshipChanges": {
    "userNickname": "nombre o null",
    "guideNickname": "nombre o null",
    "communicationTone": "casual",
    "intimacyLevel": 0.6
  },
  "emotionalState": {
    "tone": "alegre/triste/ansioso/etc",
    "intensity": 0.7,
    "emotions": ["feliz", "esperanzado"]
  },
  "goals": [
    {
      "goal": "descripción del objetivo",
      "timeframe": "corto/medio/largo plazo",
      "importance": 0.8
    }
  ]
}

## EJEMPLOS:

 **Usuario**: "Tengo 5 perros en casa y me encantan"
 **Respuesta**:
 {
   "personalFacts": [{"category": "pets", "subject": "perros", "value": "5", "confidence": 0.95, "extractedFrom": "direct_statement"}],
   "preferences": [{"category": "topics", "preference": "le encantan los perros", "intensity": 0.9}],
   "relationshipChanges": null,
   "emotionalState": {"tone": "alegre", "intensity": 0.7, "emotions": ["amor", "felicidad"]},
   "goals": []
 }
 
 **Usuario**: "Puedes hablarme más casual? No me gusta lo formal"
 **Respuesta**:
 {
   "personalFacts": [],
   "preferences": [{"category": "communication", "preference": "prefiere comunicación casual, no formal", "intensity": 0.9}],
   "relationshipChanges": {"communicationTone": "casual", "intimacyLevel": 0.6},
   "emotionalState": {"tone": "neutral", "intensity": 0.5, "emotions": []},
   "goals": []
 }

## REGLAS IMPORTANTES:
- Solo extrae información EXPLÍCITA del mensaje
- Asigna confidence alto (>0.8) solo a hechos muy claros
- Si no hay información de una categoría, deja el array vacío []
- Números deben ser extraídos como numbers, no strings
- Sé conservador: mejor omitir que inventar información

${conversationHistory ? `\n## CONTEXTO DE CONVERSACIÓN:\n${conversationHistory.join('\n')}` : ''}

Analiza SOLO el mensaje del usuario que sigue:`;
  }

  /**
   * Parsea el resultado del análisis de OpenAI
   */
  private parseAnalysisResult(analysisResult: string): ExtractedInformation {
    // console.log("🚀 ~ parseAnalysisResult ~ analysisResult:", analysisResult);
    
    try {
      if (!analysisResult || typeof analysisResult !== 'string') {
        this.logger.warn('Empty or invalid analysis result');
        return this.getEmptyExtraction();
      }

      let cleaned = analysisResult.trim();
      let parsed: any;

      // ✅ MÉTODO 1: Buscar JSON con regex mejorado
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          this.logger.warn('Failed to parse JSON from regex match:', parseError);
        }
      }

      // ✅ MÉTODO 2: Si no funcionó el regex, limpiar manualmente
      if (!parsed) {
        try {
          // Remover bloques de código markdown
          cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          
          // Buscar el primer { y el último }
          const firstBraceIndex = cleaned.indexOf('{');
          const lastBraceIndex = cleaned.lastIndexOf('}');
          
          if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
            const jsonString = cleaned.substring(firstBraceIndex, lastBraceIndex + 1);
            parsed = JSON.parse(jsonString);
          }
        } catch (parseError) {
          this.logger.warn('Failed to parse JSON with manual cleanup:', parseError);
        }
      }

      // ✅ MÉTODO 3: Si aún no funciona, crear estructura mínima desde texto
      if (!parsed) {
        this.logger.warn('No JSON found in analysis result, creating minimal structure');
        // Intentar extraer información básica del texto sin JSON
        const hasPersonalInfo = cleaned.toLowerCase().includes('tengo') || 
                               cleaned.toLowerCase().includes('mi ') ||
                               cleaned.toLowerCase().includes('soy ');
        
        if (hasPersonalInfo) {
          return {
            personalFacts: [],
            preferences: [],
            relationshipChanges: null,
            emotionalState: { tone: 'neutral', intensity: 0.5, emotions: [] },
            goals: []
          };
        } else {
          return this.getEmptyExtraction();
        }
      }

      // ✅ VALIDAR Y ESTRUCTURAR RESULTADO
      return {
        personalFacts: Array.isArray(parsed.personalFacts) ? parsed.personalFacts : [],
        preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
        relationshipChanges: parsed.relationshipChanges && typeof parsed.relationshipChanges === 'object' 
          ? parsed.relationshipChanges 
          : null,
        emotionalState: parsed.emotionalState && typeof parsed.emotionalState === 'object'
          ? {
              tone: parsed.emotionalState.tone || 'neutral',
              intensity: typeof parsed.emotionalState.intensity === 'number' 
                ? parsed.emotionalState.intensity 
                : 0.5,
              emotions: Array.isArray(parsed.emotionalState.emotions) 
                ? parsed.emotionalState.emotions 
                : []
            }
          : { tone: 'neutral', intensity: 0.5, emotions: [] },
        goals: Array.isArray(parsed.goals) ? parsed.goals : []
      };
    } catch (error) {
      this.logger.error('Error parsing analysis result:', error);
      return this.getEmptyExtraction();
    }
  }

  /**
   * Analiza una pregunta del usuario para detectar si busca información personal
   */
  async detectPersonalQuestionIntent(userMessage: string): Promise<{
    isPersonalQuestion: boolean;
    searchTerms: string[];
    questionType: 'fact_recall' | 'preference_check' | 'relationship_query' | 'general';
  }> {
    const lowerMessage = userMessage.toLowerCase();
    
    // Patrones comunes de preguntas personales
    const personalQuestionPatterns = [
      /cuántos?\s+(.*)\s+tengo/,
      /qué\s+(.*)\s+tengo/,
      /cómo\s+me\s+llamo/,
      /cuál\s+es\s+mi\s+(.*)/,
      /recuerdas?\s+(.*)/,
      /te\s+dije\s+(.*)/,
      /mencioné\s+(.*)/,
    ];

    let isPersonalQuestion = false;
    let searchTerms: string[] = [];
    let questionType: 'fact_recall' | 'preference_check' | 'relationship_query' | 'general' = 'general';

    for (const pattern of personalQuestionPatterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        isPersonalQuestion = true;
        if (match[1]) {
          searchTerms.push(match[1].trim());
        }
        
        if (lowerMessage.includes('cuántos') || lowerMessage.includes('qué tengo')) {
          questionType = 'fact_recall';
        } else if (lowerMessage.includes('prefiero') || lowerMessage.includes('me gusta')) {
          questionType = 'preference_check';
        } else if (lowerMessage.includes('llamo') || lowerMessage.includes('nombre')) {
          questionType = 'relationship_query';
        }
        break;
      }
    }

    // Detectar términos de búsqueda adicionales
    const keywords = ['perros', 'gatos', 'trabajo', 'hermanos', 'familia', 'casa', 'ciudad'];
    keywords.forEach(keyword => {
      if (lowerMessage.includes(keyword) && !searchTerms.includes(keyword)) {
        searchTerms.push(keyword);
      }
    });

    return {
      isPersonalQuestion,
      searchTerms,
      questionType
    };
  }

  /**
   * Retorna una extracción vacía
   */
  private getEmptyExtraction(): ExtractedInformation {
    return {
      personalFacts: [],
      preferences: [],
      relationshipChanges: null,
      emotionalState: { tone: 'neutral', intensity: 0.5, emotions: [] },
      goals: []
    };
  }

  /**
   * Evalúa la importancia de una información extraída
   */
  calculateImportance(info: ExtractedInformation): number {
    let totalImportance = 0;
    let factorCount = 0;

    // Hechos personales tienen alta importancia
    if (info.personalFacts.length > 0) {
      const avgConfidence = info.personalFacts.reduce((sum, fact) => sum + fact.confidence, 0) / info.personalFacts.length;
      totalImportance += avgConfidence * 0.4;
      factorCount++;
    }

    // Preferencias son importantes para la comunicación
    if (info.preferences.length > 0) {
      const avgIntensity = info.preferences.reduce((sum, pref) => sum + pref.intensity, 0) / info.preferences.length;
      totalImportance += avgIntensity * 0.3;
      factorCount++;
    }

    // Cambios de relación son muy importantes
    if (info.relationshipChanges) {
      totalImportance += 0.8;
      factorCount++;
    }

    // Metas son moderadamente importantes
    if (info.goals.length > 0) {
      const avgImportance = info.goals.reduce((sum, goal) => sum + goal.importance, 0) / info.goals.length;
      totalImportance += avgImportance * 0.2;
      factorCount++;
    }

    return factorCount > 0 ? totalImportance / factorCount : 0.1;
  }
} 