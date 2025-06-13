import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageRole {
  USER = 'user',
  GUIDE = 'guide',
  SYSTEM = 'system'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  SYSTEM_NOTIFICATION = 'system_notification'
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId; // null si es del guía

  @Prop({ type: Types.ObjectId, ref: 'SpiritualGuide' })
  spiritualGuideId?: Types.ObjectId; // null si es del usuario

  @Prop({ type: String, enum: MessageRole, required: true })
  role: MessageRole;

  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  type: MessageType;

  @Prop({ required: true })
  content: string;

  @Prop({ type: String, enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus;

  // Embeddings para búsqueda semántica
  @Prop({ type: [Number] })
  embedding?: number[];

  // Metadata contextual
  @Prop({ type: Object })
  metadata?: {
    emotionalTone?: string; // alegre, triste, ansioso, etc.
    topics?: string[]; // temas tratados en el mensaje
    intent?: string; // pregunta, consejo, desahogo, etc.
    spiritualContext?: string; // contexto espiritual/emocional
  };

  // Para respuestas del guía - contexto usado para generar la respuesta
  @Prop({ type: Object })
  generationContext?: {
    guidePersonality?: string;
    relevantHistory?: string[];
    emotionalState?: string;
    usedPrompt?: string;
  };

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message); 