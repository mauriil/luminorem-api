import { Model } from 'mongoose';
import { SurveyQuestion, SurveyQuestionDocument } from '../entities/survey-question.entity';
export declare class SurveyQuestionsService {
    private surveyQuestionModel;
    constructor(surveyQuestionModel: Model<SurveyQuestionDocument>);
    getAllQuestions(): Promise<SurveyQuestion[]>;
    createQuestion(questionData: Partial<SurveyQuestion>): Promise<SurveyQuestion>;
    seedInitialQuestions(): Promise<void>;
}
