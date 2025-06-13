import { OnModuleInit } from '@nestjs/common';
import { SurveyQuestionsService } from './survey-questions.service';
export declare class InitializationService implements OnModuleInit {
    private readonly surveyQuestionsService;
    private readonly logger;
    constructor(surveyQuestionsService: SurveyQuestionsService);
    onModuleInit(): Promise<void>;
}
