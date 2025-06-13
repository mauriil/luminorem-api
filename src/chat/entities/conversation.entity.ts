import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

export enum ConversationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived'
}

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'SpiritualGuide', required: true })
  spiritualGuideId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ type: String, enum: ConversationStatus, default: ConversationStatus.ACTIVE })
  status: ConversationStatus;

  @Prop({ type: Number, default: 0 })
  messageCount: number;

  @Prop({ type: Date })
  lastMessageAt: Date;

  // Metadata para contexto
  @Prop({ type: [String], default: [] })
  conversationTags: string[]; // temas de conversación, emociones, etc.

  @Prop({ type: String })
  conversationSummary?: string; // resumen generado por IA para contexto

  // Embeddings del contexto general de la conversación
  @Prop({ type: [Number] })
  contextEmbedding?: number[];

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation); 