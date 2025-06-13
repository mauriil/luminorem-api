import { Document } from 'mongoose';
export type SurveyQuestionDocument = SurveyQuestion & Document;
export declare class SurveyQuestion {
    question: string;
    options: string[];
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SurveyQuestionSchema: import("mongoose").Schema<SurveyQuestion, import("mongoose").Model<SurveyQuestion, any, any, any, Document<unknown, any, SurveyQuestion, any> & SurveyQuestion & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SurveyQuestion, Document<unknown, {}, import("mongoose").FlatRecord<SurveyQuestion>, {}> & import("mongoose").FlatRecord<SurveyQuestion> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
