import { IsEmail, IsNotEmpty, IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'juan@ejemplo.com', description: 'Email del usuario' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Juan Pérez', description: 'Nombre completo del usuario' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    example: ['Escuchás algo que no sabías que estaba ahí', 'Uno donde nada te apura'], 
    description: 'Respuestas del test espiritual',
    required: false
  })
  @IsArray()
  @IsOptional()
  surveyAnswers?: string[];
} 