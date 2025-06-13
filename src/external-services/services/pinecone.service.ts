import { Injectable, Logger } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import { ConfigService } from '@nestjs/config';

export interface MemoryMetadata {
  userId: string;
  guideId: string;
  conversationId: string;
  messageId: string;
  content: string;
  timestamp: number;
  
  // Categorización de memoria
  memoryType: 'personal_fact' | 'preference' | 'emotional_state' | 'relationship' | 'goal' | 'communication_style';
  
  // Información específica según el tipo
  personalFacts?: {
    category: 'family' | 'pets' | 'work' | 'hobbies' | 'health' | 'location' | 'other';
    factType: 'has' | 'likes' | 'dislikes' | 'wants' | 'needs' | 'is';
    subject: string; // "perros", "trabajo", "hermanos", etc.
    value: string | number; // "5", "programador", "2", etc.
    confidence: number; // 0-1, qué tan seguro estamos de este hecho
  };
  
  preferences?: {
    category: 'communication' | 'treatment' | 'topics' | 'style';
    preference: string;
    intensity: number; // 0-1, qué tan importante es esta preferencia
  };
  
  relationship?: {
    userNickname?: string; // cómo el usuario quiere que lo llamen
    guideNickname?: string; // cómo el usuario llama al guía
    intimacyLevel: number; // 0-1, qué tan cercana es la relación
    communicationTone: 'formal' | 'casual' | 'intimate' | 'playful';
  };
  
  // Metadatos adicionales
  extractedFrom: 'direct_statement' | 'implied' | 'question_answer' | 'correction';  
  importance: number; // 0-1, qué tan importante es recordar esto
  lastUpdated: number;
  updateCount: number;
}

export interface MemorySearchResult {
  id: string;
  score: number;
  metadata: MemoryMetadata;
}

@Injectable()
export class PineconeService {
  private readonly logger = new Logger(PineconeService.name);
  private pinecone: Pinecone;
  private index: any;

  constructor(private configService: ConfigService) {
    this.initializePinecone();
  }

  private async initializePinecone() {
    try {
      const apiKey = this.configService.get<string>('PINECONE_API_KEY');
      const indexName = this.configService.get<string>('PINECONE_INDEX_NAME');

      if (!apiKey) {
        this.logger.warn('PINECONE_API_KEY not configured. Pinecone features disabled.');
        return;
      }

      if (!indexName) {
        this.logger.warn('PINECONE_INDEX_NAME not configured. Pinecone features disabled.');
        return;
      }

      this.pinecone = new Pinecone({
        apiKey: apiKey,
      });
      
      this.index = this.pinecone.index(indexName);
      
      // Verificar que el índice existe
      await this.verifyIndex(indexName);
      
      this.logger.log('Pinecone initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Pinecone:', error);
      this.logger.warn('Pinecone features will be disabled');
      // No lanzar error para permitir que la app funcione sin Pinecone
    }
  }

  private async verifyIndex(indexName: string) {
    try {
      // Intentar hacer una consulta simple para verificar conectividad
      await this.index.query({
        vector: new Array(1536).fill(0),
        topK: 1,
        filter: { _test: true }
      });
      this.logger.log(`Pinecone index '${indexName}' verified successfully`);
    } catch (error) {
      this.logger.error(`Failed to verify Pinecone index '${indexName}':`, error);
      throw new Error(`Pinecone index '${indexName}' not found or not accessible. Please create it first.`);
    }
  }

  /**
   * Verifica si Pinecone está disponible
   */
  private isPineconeAvailable(): boolean {
    return !!(this.pinecone && this.index);
  }

  /**
   * Convierte metadatos complejos a formato plano compatible con Pinecone
   */
  private flattenMetadata(metadata: MemoryMetadata): Record<string, string | number | boolean> {
    const flattened: Record<string, string | number | boolean> = {
      userId: metadata.userId,
      guideId: metadata.guideId,
      conversationId: metadata.conversationId,
      messageId: metadata.messageId,
      content: metadata.content,
      timestamp: metadata.timestamp,
      memoryType: metadata.memoryType,
      extractedFrom: metadata.extractedFrom,
      importance: metadata.importance,
      lastUpdated: metadata.lastUpdated,
      updateCount: metadata.updateCount
    };

    // Aplanar personalFacts si existe
    if (metadata.personalFacts) {
      flattened['personalFacts_category'] = metadata.personalFacts.category;
      flattened['personalFacts_factType'] = metadata.personalFacts.factType;
      flattened['personalFacts_subject'] = metadata.personalFacts.subject;
      flattened['personalFacts_value'] = typeof metadata.personalFacts.value === 'string' 
        ? metadata.personalFacts.value 
        : metadata.personalFacts.value.toString();
      flattened['personalFacts_confidence'] = metadata.personalFacts.confidence;
    }

    // Aplanar preferences si existe
    if (metadata.preferences) {
      flattened['preferences_category'] = metadata.preferences.category;
      flattened['preferences_preference'] = metadata.preferences.preference;
      flattened['preferences_intensity'] = metadata.preferences.intensity;
    }

    // Aplanar relationship si existe
    if (metadata.relationship) {
      if (metadata.relationship.userNickname) {
        flattened['relationship_userNickname'] = metadata.relationship.userNickname;
      }
      if (metadata.relationship.guideNickname) {
        flattened['relationship_guideNickname'] = metadata.relationship.guideNickname;
      }
      flattened['relationship_intimacyLevel'] = metadata.relationship.intimacyLevel;
      flattened['relationship_communicationTone'] = metadata.relationship.communicationTone;
    }

    return flattened;
  }

  /**
   * Reconstruye metadatos desde formato plano de Pinecone
   */
  private unflattenMetadata(flatMetadata: any): MemoryMetadata {
    const metadata: MemoryMetadata = {
      userId: flatMetadata.userId,
      guideId: flatMetadata.guideId,
      conversationId: flatMetadata.conversationId,
      messageId: flatMetadata.messageId,
      content: flatMetadata.content,
      timestamp: flatMetadata.timestamp,
      memoryType: flatMetadata.memoryType,
      extractedFrom: flatMetadata.extractedFrom,
      importance: flatMetadata.importance,
      lastUpdated: flatMetadata.lastUpdated,
      updateCount: flatMetadata.updateCount
    };

    // Reconstruir personalFacts si existe
    if (flatMetadata['personalFacts_category']) {
      metadata.personalFacts = {
        category: flatMetadata['personalFacts_category'],
        factType: flatMetadata['personalFacts_factType'],
        subject: flatMetadata['personalFacts_subject'],
        value: flatMetadata['personalFacts_value'],
        confidence: flatMetadata['personalFacts_confidence']
      };
    }

    // Reconstruir preferences si existe
    if (flatMetadata['preferences_category']) {
      metadata.preferences = {
        category: flatMetadata['preferences_category'],
        preference: flatMetadata['preferences_preference'],
        intensity: flatMetadata['preferences_intensity']
      };
    }

    // Reconstruir relationship si existe
    if (flatMetadata['relationship_communicationTone']) {
      metadata.relationship = {
        intimacyLevel: flatMetadata['relationship_intimacyLevel'],
        communicationTone: flatMetadata['relationship_communicationTone']
      };
      
      if (flatMetadata['relationship_userNickname']) {
        metadata.relationship.userNickname = flatMetadata['relationship_userNickname'];
      }
      if (flatMetadata['relationship_guideNickname']) {
        metadata.relationship.guideNickname = flatMetadata['relationship_guideNickname'];
      }
    }

    return metadata;
  }

  /**
   * Guarda una memoria en Pinecone con metadata categorizada
   */
  async storeMemory(
    id: string,
    embedding: number[],
    metadata: MemoryMetadata
  ): Promise<void> {
    if (!this.isPineconeAvailable()) {
      this.logger.debug('Pinecone not available, skipping memory storage');
      return;
    }

    try {
      // Convertir metadatos complejos a formato plano
      const flattenedMetadata = this.flattenMetadata({
        ...metadata,
        timestamp: Date.now(),
        lastUpdated: Date.now(),
      });

      await this.index.upsert([{
        id,
        values: embedding,
        metadata: flattenedMetadata
      }]);
      
      this.logger.debug(`Memory stored: ${id} (${metadata.memoryType})`);
    } catch (error) {
      this.logger.error('Error storing memory:', error);
      // No lanzar error para no interrumpir el flujo
    }
  }

  /**
   * Busca memorias relevantes para un usuario específico
   */
  async searchUserMemories(
    userId: string,
    queryEmbedding: number[],
    options: {
      topK?: number;
      memoryTypes?: MemoryMetadata['memoryType'][];
      minScore?: number;
      includeRecent?: boolean; // incluir memorias recientes aunque no sean muy similares
    } = {}
  ): Promise<MemorySearchResult[]> {
    if (!this.isPineconeAvailable()) {
      this.logger.debug('Pinecone not available, returning empty memories');
      return [];
    }

    const { topK = 20, memoryTypes, minScore = 0.3, includeRecent = true } = options;

    try {
      const filter: any = { userId };
      
      if (memoryTypes && memoryTypes.length > 0) {
        filter.memoryType = { $in: memoryTypes };
      }

      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        filter,
        topK,
        includeMetadata: true,
      });

      if (!queryResponse || !queryResponse.matches) {
        this.logger.debug('No matches returned from Pinecone');
        return [];
      }

      let results = queryResponse.matches
        .filter(match => match.score >= minScore)
        .map(match => ({
          id: match.id,
          score: match.score,
          metadata: this.unflattenMetadata(match.metadata)
        }));

      // Si includeRecent está activado, agregar memorias recientes importantes
      if (includeRecent) {
        const recentImportantMemories = await this.getRecentImportantMemories(userId, 5);
        
        // Agregar memorias recientes que no estén ya en los resultados
        recentImportantMemories.forEach(recentMemory => {
          if (!results.find(r => r.id === recentMemory.id)) {
            results.push(recentMemory);
          }
        });
      }

      // Ordenar por importancia y score combinados
      results.sort((a, b) => {
        const scoreA = (a.score * 0.7) + (a.metadata.importance * 0.3);
        const scoreB = (b.score * 0.7) + (b.metadata.importance * 0.3);
        return scoreB - scoreA;
      });

      return results.slice(0, topK);
    } catch (error) {
      this.logger.error('Error searching memories:', error);
      return [];
    }
  }

  /**
   * Obtiene memorias recientes importantes del usuario
   */
  async getRecentImportantMemories(
    userId: string,
    limit: number = 10
  ): Promise<MemorySearchResult[]> {
    if (!this.isPineconeAvailable()) {
      return [];
    }

    try {
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      const queryResponse = await this.index.query({
        vector: new Array(1536).fill(0), // Vector dummy, no importa para esta consulta
        filter: {
          userId,
          timestamp: { $gte: oneDayAgo },
          importance: { $gte: 0.7 }
        },
        topK: limit,
        includeMetadata: true,
      });

      if (!queryResponse || !queryResponse.matches) {
        return [];
      }

      return queryResponse.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: this.unflattenMetadata(match.metadata)
      }));
    } catch (error) {
      this.logger.error('Error getting recent important memories:', error);
      return [];
    }
  }

  /**
   * Obtiene hechos personales específicos del usuario
   */
  async getUserPersonalFacts(
    userId: string,
    category?: string
  ): Promise<MemorySearchResult[]> {
    if (!this.isPineconeAvailable()) {
      return [];
    }

    try {
      const filter: any = {
        userId,
        memoryType: 'personal_fact'
      };

      if (category) {
        filter['personalFacts_category'] = category;
      }

      const queryResponse = await this.index.query({
        vector: new Array(1536).fill(0),
        filter,
        topK: 50,
        includeMetadata: true,
      });

      if (!queryResponse || !queryResponse.matches) {
        return [];
      }

      return queryResponse.matches
        .map(match => ({
          id: match.id,
          score: match.score,
          metadata: this.unflattenMetadata(match.metadata)
        }))
        .sort((a, b) => (b.metadata.personalFacts?.confidence || 0) - (a.metadata.personalFacts?.confidence || 0));
    } catch (error) {
      this.logger.error('Error getting personal facts:', error);
      return [];
    }
  }

  /**
   * Obtiene las preferencias de comunicación del usuario
   */
  async getUserPreferences(userId: string): Promise<MemorySearchResult[]> {
    return this.searchUserMemories(userId, new Array(1536).fill(0), {
      memoryTypes: ['preference', 'communication_style', 'relationship'],
      topK: 20,
      minScore: 0
    });
  }

  /**
   * Actualiza o crea un hecho personal
   */
  async updatePersonalFact(
    userId: string,
    guideId: string,
    conversationId: string,
    messageId: string,
    embedding: number[],
    fact: {
      category: string;
      subject: string;
      value: string | number;
      confidence: number;
      extractedFrom: MemoryMetadata['extractedFrom'];
    }
  ): Promise<void> {
    const id = `${userId}_fact_${fact.subject}_${fact.category}`;
    
    const metadata: MemoryMetadata = {
      userId,
      guideId,
      conversationId,
      messageId,
      content: `${fact.subject}: ${fact.value}`,
      timestamp: Date.now(),
      memoryType: 'personal_fact',
      personalFacts: {
        category: fact.category as any,
        factType: 'has', // determinar dinámicamente
        subject: fact.subject,
        value: fact.value,
        confidence: fact.confidence
      },
      extractedFrom: fact.extractedFrom,
      importance: Math.min(fact.confidence + 0.3, 1),
      lastUpdated: Date.now(),
      updateCount: 1
    };

    await this.storeMemory(id, embedding, metadata);
  }

  /**
   * Construye un resumen de memoria para usar en prompts
   */
  async buildMemoryContext(
    userId: string,
    currentMessage: string,
    queryEmbedding: number[]
  ): Promise<{
    personalFacts: string;
    preferences: string;
    relationship: string;
    relevantMemories: string;
  }> {
    try {
      // Buscar memorias relevantes
      const relevantMemories = await this.searchUserMemories(userId, queryEmbedding, {
        topK: 15,
        includeRecent: true
      });

      // Obtener hechos personales
      const personalFacts = await this.getUserPersonalFacts(userId);
      
      // Obtener preferencias
      const preferences = await this.getUserPreferences(userId);

      return {
        personalFacts: this.formatPersonalFacts(personalFacts),
        preferences: this.formatPreferences(preferences),
        relationship: this.formatRelationshipInfo(preferences),
        relevantMemories: this.formatRelevantMemories(relevantMemories)
      };
    } catch (error) {
      this.logger.error('Error building memory context:', error);
      return {
        personalFacts: '',
        preferences: '',
        relationship: '', 
        relevantMemories: ''
      };
    }
  }

  private formatPersonalFacts(facts: MemorySearchResult[]): string {
    if (facts.length === 0) return '';

    const factsByCategory = facts.reduce((acc, fact) => {
      const category = fact.metadata.personalFacts?.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(fact);
      return acc;
    }, {} as Record<string, MemorySearchResult[]>);

    let formatted = '## Hechos Personales del Usuario:\n';
    
    Object.entries(factsByCategory).forEach(([category, categoryFacts]) => {
      formatted += `**${category.charAt(0).toUpperCase() + category.slice(1)}:**\n`;
      categoryFacts.forEach(fact => {
        if (fact.metadata.personalFacts) {
          formatted += `- ${fact.metadata.personalFacts.subject}: ${fact.metadata.personalFacts.value}\n`;
        }
      });
    });

    return formatted;
  }

  private formatPreferences(preferences: MemorySearchResult[]): string {
    if (preferences.length === 0) return '';

    let formatted = '## Preferencias del Usuario:\n';
    
    preferences.forEach(pref => {
      if (pref.metadata.preferences) {
        formatted += `- ${pref.metadata.preferences.category}: ${pref.metadata.preferences.preference}\n`;
      }
    });

    return formatted;
  }

  private formatRelationshipInfo(preferences: MemorySearchResult[]): string {
    const relationshipInfo = preferences.find(p => p.metadata.relationship);
    
    if (!relationshipInfo?.metadata.relationship) return '';

    const rel = relationshipInfo.metadata.relationship;
    let formatted = '## Información de la Relación:\n';
    
    if (rel.userNickname) {
      formatted += `- Llama al usuario: ${rel.userNickname}\n`;
    }
    if (rel.guideNickname) {
      formatted += `- El usuario te llama: ${rel.guideNickname}\n`;
    }
    formatted += `- Tono de comunicación: ${rel.communicationTone}\n`;
    formatted += `- Nivel de intimidad: ${Math.round(rel.intimacyLevel * 100)}%\n`;

    return formatted;
  }

  private formatRelevantMemories(memories: MemorySearchResult[]): string {
    if (memories.length === 0) return '';

    let formatted = '## Contexto Relevante de Conversaciones Pasadas:\n';
    
    memories.slice(0, 8).forEach(memory => {
      formatted += `- ${memory.metadata.content} (${memory.metadata.memoryType})\n`;
    });

    return formatted;
  }

  /**
   * Elimina memorias de un usuario
   */
  async deleteUserMemories(userId: string): Promise<void> {
    try {
      // Nota: Pinecone no tiene delete by filter directo,
      // necesitaríamos implementar una solución más compleja
      this.logger.warn(`Delete user memories not fully implemented for user: ${userId}`);
    } catch (error) {
      this.logger.error('Error deleting user memories:', error);
      throw error;
    }
  }
} 