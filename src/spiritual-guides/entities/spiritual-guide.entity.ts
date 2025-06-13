import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SpiritualGuideDocument = SpiritualGuide & Document;

export enum GenerationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing', 
  COMPLETED = 'completed',
  FAILED = 'failed'
}

@Schema({ timestamps: true })
export class SpiritualGuide {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  physicalForm: string;

  @Prop({ required: true })
  distinctiveTraits: string;

  @Prop({ required: true })
  personality: string;

  @Prop({ required: true })
  habitat: string;

  @Prop({ required: true })
  connectionWithUser: string;

  @Prop({ type: [String], required: true })
  surveyAnswers: string[];

  @Prop()
  imageUrl?: string;

  @Prop()
  videoUrl?: string;

  @Prop()
  boomerangVideoUrl?: string;

  @Prop()
  dallePrompt?: string;

  // Status fields para trackear el progreso
  @Prop({ enum: GenerationStatus, default: GenerationStatus.PENDING })
  imageStatus: GenerationStatus;

  @Prop({ enum: GenerationStatus, default: GenerationStatus.PENDING })
  videoStatus: GenerationStatus;

  @Prop({ enum: GenerationStatus, default: GenerationStatus.PENDING })
  boomerangStatus: GenerationStatus;

  // Para trackear el progreso general
  @Prop({ default: false })
  isFullyGenerated: boolean;

  // Errores si algo falla
  @Prop()
  imageError?: string;

  @Prop()
  videoError?: string;

  @Prop()
  boomerangError?: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const SpiritualGuideSchema = SchemaFactory.createForClass(SpiritualGuide); 