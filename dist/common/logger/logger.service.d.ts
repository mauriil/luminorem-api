import { ConsoleLogger, LoggerService } from '@nestjs/common';
export declare class CustomLoggerService extends ConsoleLogger implements LoggerService {
    private readonly colors;
    private readonly levelColors;
    private formatCustomMessage;
    log(message: any, context?: string): void;
    error(message: any, trace?: string, context?: string): void;
    warn(message: any, context?: string): void;
    debug(message: any, context?: string): void;
    verbose(message: any, context?: string): void;
    success(message: any, context?: string): void;
    info(message: any, context?: string): void;
    request(method: string, url: string, statusCode: number, responseTime: number, context?: string): void;
    startupMessage(message: string, context?: string): void;
    processMessage(message: string, context?: string): void;
}
