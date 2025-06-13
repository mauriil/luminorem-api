import { SurveyQuestionsService } from '../services/survey-questions.service';
import { SurveyQuestion } from '../entities/survey-question.entity';
export declare class SurveyQuestionsController {
    private readonly surveyQuestionsService;
    constructor(surveyQuestionsService: SurveyQuestionsService);
    getAllQuestions(): Promise<SurveyQuestion[]>;
    seedQuestions(): Promise<{
        message: string;
    }>;
}
