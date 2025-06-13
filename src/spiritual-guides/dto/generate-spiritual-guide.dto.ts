import { IsString, IsArray, IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateSpiritualGuideDto {
  @ApiProperty({ example: '64f5a2b8c4567890abcdef12', description: 'ID del usuario' })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @ApiProperty({ 
    example: [
      'Escuchás algo que no sabías que estaba ahí',
      'Uno donde nada te apura',
      'Te confiás a lo que se siente verdadero'
    ], 
    description: 'Array con las 20 respuestas del test espiritual' 
  })
  @IsArray()
  @IsNotEmpty()
  surveyAnswers: string[];
} 