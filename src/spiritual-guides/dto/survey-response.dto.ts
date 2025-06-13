import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class SurveyResponseDto {
  @IsArray()
  @ArrayMinSize(20, { message: 'Debes responder todas las preguntas (20 respuestas requeridas)' })
  @ArrayMaxSize(20, { message: 'No puedes enviar más de 20 respuestas' })
  @IsString({ each: true })
  answers: string[];
} 