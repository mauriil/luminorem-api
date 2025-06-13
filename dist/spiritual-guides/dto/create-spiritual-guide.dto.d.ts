import { GenerationStatus } from '../entities/spiritual-guide.entity';
export declare class CreateSpiritualGuideDto {
    userId: string;
    surveyAnswers: string[];
    name?: string;
    physicalForm?: string;
    distinctiveTraits?: string;
    personality?: string;
    habitat?: string;
    connectionWithUser?: string;
    imageUrl?: string;
    videoUrl?: string;
    boomerangVideoUrl?: string;
    dallePrompt?: string;
    imageStatus?: GenerationStatus;
    videoStatus?: GenerationStatus;
    boomerangStatus?: GenerationStatus;
    isFullyGenerated?: boolean;
    imageError?: string;
    videoError?: string;
    boomerangError?: string;
}
