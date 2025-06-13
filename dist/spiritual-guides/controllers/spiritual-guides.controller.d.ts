import { SpiritualGuidesService } from '../services/spiritual-guides.service';
import { CreateSpiritualGuideDto } from '../dto/create-spiritual-guide.dto';
import { UpdateSpiritualGuideDto } from '../dto/update-spiritual-guide.dto';
import { GenerateSpiritualGuideDto } from '../dto/generate-spiritual-guide.dto';
export declare class SpiritualGuidesController {
    private readonly spiritualGuidesService;
    constructor(spiritualGuidesService: SpiritualGuidesService);
    create(createSpiritualGuideDto: CreateSpiritualGuideDto): Promise<import("../entities/spiritual-guide.entity").SpiritualGuide>;
    generateComplete(generateDto: GenerateSpiritualGuideDto): Promise<import("../entities/spiritual-guide.entity").SpiritualGuide>;
    findAll(userId?: string): Promise<import("../entities/spiritual-guide.entity").SpiritualGuide[]>;
    getGenerationStatus(id: string): Promise<{
        guide: import("../entities/spiritual-guide.entity").SpiritualGuide;
        progress: {
            imageStatus: import("../entities/spiritual-guide.entity").GenerationStatus;
            videoStatus: import("../entities/spiritual-guide.entity").GenerationStatus;
            boomerangStatus: import("../entities/spiritual-guide.entity").GenerationStatus;
            isFullyGenerated: boolean;
            overallProgress: number;
        };
        errors?: {
            imageError?: string;
            videoError?: string;
            boomerangError?: string;
        };
    }>;
    findOne(id: string): Promise<import("../entities/spiritual-guide.entity").SpiritualGuide>;
    findByUserId(userId: string): Promise<import("../entities/spiritual-guide.entity").SpiritualGuide[]>;
    update(id: string, updateSpiritualGuideDto: UpdateSpiritualGuideDto): Promise<import("../entities/spiritual-guide.entity").SpiritualGuide>;
    remove(id: string): Promise<void>;
}
