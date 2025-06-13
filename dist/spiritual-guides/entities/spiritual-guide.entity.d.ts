import { Document, Types } from 'mongoose';
export type SpiritualGuideDocument = SpiritualGuide & Document;
export declare enum GenerationStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class SpiritualGuide {
    userId: Types.ObjectId;
    name: string;
    physicalForm: string;
    distinctiveTraits: string;
    personality: string;
    habitat: string;
    connectionWithUser: string;
    surveyAnswers: string[];
    imageUrl?: string;
    videoUrl?: string;
    boomerangVideoUrl?: string;
    dallePrompt?: string;
    imageStatus: GenerationStatus;
    videoStatus: GenerationStatus;
    boomerangStatus: GenerationStatus;
    isFullyGenerated: boolean;
    imageError?: string;
    videoError?: string;
    boomerangError?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SpiritualGuideSchema: import("mongoose").Schema<SpiritualGuide, import("mongoose").Model<SpiritualGuide, any, any, any, Document<unknown, any, SpiritualGuide, any> & SpiritualGuide & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SpiritualGuide, Document<unknown, {}, import("mongoose").FlatRecord<SpiritualGuide>, {}> & import("mongoose").FlatRecord<SpiritualGuide> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
