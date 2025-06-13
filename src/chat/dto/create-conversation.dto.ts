import { IsString, IsNotEmpty, IsMongoId, IsOptional } from 'class-validator';

export class CreateConversationDto {
  @IsMongoId()
  @IsNotEmpty()
  spiritualGuideId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  initialMessage?: string;
} 