import { ConfigService } from '@nestjs/config';
export declare class OpenAiService {
    private configService;
    private openai;
    constructor(configService: ConfigService);
    generateSpiritualGuide(surveyAnswers: string[]): Promise<string>;
    generateImage(dallePrompt: string): Promise<string>;
    private optimizeDallePrompt;
}
