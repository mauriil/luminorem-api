import { ConfigService } from '@nestjs/config';
export declare class ReplicateService {
    private configService;
    private readonly logger;
    private replicateToken;
    constructor(configService: ConfigService);
    animateImage(imagePath: string): Promise<string>;
    private filterProgressLogs;
}
