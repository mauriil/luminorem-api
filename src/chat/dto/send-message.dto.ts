import { IsString, IsNotEmpty, IsOptional, IsMongoId, IsEnum } from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class SendMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  spiritualGuideId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType = MessageType.TEXT;

  @IsOptional()
  @IsMongoId()
  conversationId?: string; // Si no se proporciona, se crea una nueva conversación
} 