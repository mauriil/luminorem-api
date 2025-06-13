import { ConfigService } from '@nestjs/config';
export declare class OpenAiService {
    private configService;
    private openai;
    constructor(configService: ConfigService);
    generateSpiritualGuide(surveyAnswers: string[]): Promise<string>;
    generateImage(dallePrompt: string): Promise<string>;
    generateEmbedding(text: string): Promise<number[]>;
    generateChatResponse(messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>, temperature?: number): Promise<string>;
    private searchWeb;
    private optimizeDallePrompt;
}
