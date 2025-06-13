import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { SurveyQuestionsService } from './survey-questions.service';

@Injectable()
export class InitializationService implements OnModuleInit {
  private readonly logger = new Logger(InitializationService.name);

  constructor(
    private readonly surveyQuestionsService: SurveyQuestionsService,
  ) {}

  async onModuleInit() {
    try {
      await this.surveyQuestionsService.seedInitialQuestions();
      this.logger.log('Sistema inicializado correctamente - Preguntas del survey verificadas');
    } catch (error) {
      this.logger.error(`Error durante la inicialización: ${error.message}`, error.stack);
    }
  }
} 