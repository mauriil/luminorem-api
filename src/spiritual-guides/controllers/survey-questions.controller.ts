import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SurveyQuestionsService } from '../services/survey-questions.service';
import { SurveyQuestion } from '../entities/survey-question.entity';

@Controller('api/survey-questions')
export class SurveyQuestionsController {
  constructor(private readonly surveyQuestionsService: SurveyQuestionsService) {}

  @Get()
  async getAllQuestions(): Promise<SurveyQuestion[]> {
    return this.surveyQuestionsService.getAllQuestions();
  }

  @Post('seed')
  async seedQuestions(): Promise<{ message: string }> {
    await this.surveyQuestionsService.seedInitialQuestions();
    return { message: 'Preguntas iniciales cargadas exitosamente' };
  }
} 