import { IsString, IsArray, IsNotEmpty, IsOptional, IsMongoId, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GenerationStatus } from '../entities/spiritual-guide.entity';

export class CreateSpiritualGuideDto {
  @ApiProperty({ example: '64f5a2b8c4567890abcdef12', description: 'ID del usuario' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @ApiProperty({ 
    example: ['Escuchás algo que no sabías que estaba ahí', 'Uno donde nada te apura'], 
    description: 'Respuestas del test espiritual' 
  })
  @IsArray()
  @IsNotEmpty()
  surveyAnswers: string[];

  @ApiProperty({ example: 'Luminia', description: 'Nombre del guía espiritual', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Forma física del guía', required: false })
  @IsString()
  @IsOptional()
  physicalForm?: string;

  @ApiProperty({ description: 'Rasgos distintivos', required: false })
  @IsString()
  @IsOptional()
  distinctiveTraits?: string;

  @ApiProperty({ description: 'Personalidad y comunicación', required: false })
  @IsString()
  @IsOptional()
  personality?: string;

  @ApiProperty({ description: 'Hábitat o espacio simbólico', required: false })
  @IsString()
  @IsOptional()
  habitat?: string;

  @ApiProperty({ description: 'Conexión con el usuario', required: false })
  @IsString()
  @IsOptional()
  connectionWithUser?: string;

  @ApiProperty({ description: 'URL de la imagen generada', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ description: 'URL del video animado', required: false })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiProperty({ description: 'URL del video boomerang', required: false })
  @IsString()
  @IsOptional()
  boomerangVideoUrl?: string;

  @ApiProperty({ description: 'Prompt usado para DALL-E', required: false })
  @IsString()
  @IsOptional()
  dallePrompt?: string;

  // Status fields para trackear el progreso
  @ApiProperty({ 
    enum: GenerationStatus, 
    description: 'Estado de generación de la imagen',
    required: false,
    default: GenerationStatus.PENDING
  })
  @IsEnum(GenerationStatus)
  @IsOptional()
  imageStatus?: GenerationStatus;

  @ApiProperty({ 
    enum: GenerationStatus, 
    description: 'Estado de generación del video',
    required: false,
    default: GenerationStatus.PENDING
  })
  @IsEnum(GenerationStatus)
  @IsOptional()
  videoStatus?: GenerationStatus;

  @ApiProperty({ 
    enum: GenerationStatus, 
    description: 'Estado de generación del boomerang',
    required: false,
    default: GenerationStatus.PENDING
  })
  @IsEnum(GenerationStatus)
  @IsOptional()
  boomerangStatus?: GenerationStatus;

  @ApiProperty({ 
    description: 'Indica si la guía fue completamente generada',
    required: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isFullyGenerated?: boolean;

  // Campos de error
  @ApiProperty({ description: 'Error en generación de imagen', required: false })
  @IsString()
  @IsOptional()
  imageError?: string;

  @ApiProperty({ description: 'Error en generación de video', required: false })
  @IsString()
  @IsOptional()
  videoError?: string;

  @ApiProperty({ description: 'Error en generación de boomerang', required: false })
  @IsString()
  @IsOptional()
  boomerangError?: string;
} 