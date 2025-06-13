import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpiritualGuidesController } from './controllers/spiritual-guides.controller';
import { SurveyQuestionsController } from './controllers/survey-questions.controller';
import { SpiritualGuidesService } from './services/spiritual-guides.service';
import { SurveyQuestionsService } from './services/survey-questions.service';
import { InitializationService } from './services/initialization.service';
import { SpiritualGuide, SpiritualGuideSchema } from './entities/spiritual-guide.entity';
import { SurveyQuestion, SurveyQuestionSchema } from './entities/survey-question.entity';
import { ExternalServicesModule } from '../external-services/external-services.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SpiritualGuide.name, schema: SpiritualGuideSchema },
      { name: SurveyQuestion.name, schema: SurveyQuestionSchema },
    ]),
    ExternalServicesModule,
  ],
  controllers: [SpiritualGuidesController, SurveyQuestionsController],
  providers: [SpiritualGuidesService, SurveyQuestionsService, InitializationService],
  exports: [SpiritualGuidesService, SurveyQuestionsService],
})
export class SpiritualGuidesModule {} 