import { Model } from 'mongoose';
import { SpiritualGuide, SpiritualGuideDocument, GenerationStatus } from '../entities/spiritual-guide.entity';
import { CreateSpiritualGuideDto } from '../dto/create-spiritual-guide.dto';
import { UpdateSpiritualGuideDto } from '../dto/update-spiritual-guide.dto';
import { GenerateSpiritualGuideDto } from '../dto/generate-spiritual-guide.dto';
import { OpenAiService } from '../../external-services/services/openai.service';
import { ReplicateService } from '../../external-services/services/replicate.service';
import { FileService } from '../../external-services/services/file.service';
export declare class SpiritualGuidesService {
    private spiritualGuideModel;
    private openAiService;
    private replicateService;
    private fileService;
    private readonly logger;
    constructor(spiritualGuideModel: Model<SpiritualGuideDocument>, openAiService: OpenAiService, replicateService: ReplicateService, fileService: FileService);
    create(createSpiritualGuideDto: CreateSpiritualGuideDto): Promise<SpiritualGuide>;
    findAll(): Promise<SpiritualGuide[]>;
    findOne(id: string): Promise<SpiritualGuide>;
    findByUserId(userId: string): Promise<SpiritualGuide[]>;
    update(id: string, updateSpiritualGuideDto: UpdateSpiritualGuideDto): Promise<SpiritualGuide>;
    remove(id: string): Promise<void>;
    generateComplete(generateDto: GenerateSpiritualGuideDto): Promise<SpiritualGuide>;
    private processBackgroundGeneration;
    private processImageGeneration;
    private processVideoGeneration;
    private processBoomerangGeneration;
    getGenerationStatus(id: string): Promise<{
        guide: SpiritualGuide;
        progress: {
            imageStatus: GenerationStatus;
            videoStatus: GenerationStatus;
            boomerangStatus: GenerationStatus;
            isFullyGenerated: boolean;
            overallProgress: number;
        };
        errors?: {
            imageError?: string;
            videoError?: string;
            boomerangError?: string;
        };
    }>;
    private extractGuideInfo;
    private extractDallePrompt;
}
