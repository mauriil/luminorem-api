import { Injectable, ConsoleLogger, LoggerService } from '@nestjs/common';

@Injectable()
export class CustomLoggerService extends ConsoleLogger implements LoggerService {
  private readonly colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  };

  private readonly levelColors = {
    error: this.colors.red,
    warn: this.colors.yellow,
    log: this.colors.green,
    debug: this.colors.blue,
    verbose: this.colors.magenta,
  };

  private formatCustomMessage(level: string, message: any, context?: string): string {
    const coloredLevel = `${this.levelColors[level] || this.colors.white}${level.toUpperCase()}${this.colors.reset}`;
    const coloredContext = context ? `${this.colors.cyan}[${context}]${this.colors.reset}` : '';
    
    return `${coloredLevel} ${coloredContext} ${message}`;
  }

  log(message: any, context?: string) {
    super.log(this.formatCustomMessage('log', message, context || this.context));
  }

  error(message: any, trace?: string, context?: string) {
    super.error(this.formatCustomMessage('error', message, context || this.context), trace);
  }

  warn(message: any, context?: string) {
    super.warn(this.formatCustomMessage('warn', message, context || this.context));
  }

  debug(message: any, context?: string) {
    super.debug(this.formatCustomMessage('debug', message, context || this.context));
  }

  verbose(message: any, context?: string) {
    super.verbose(this.formatCustomMessage('verbose', message, context || this.context));
  }

  // Métodos de conveniencia para logs específicos de la aplicación
  success(message: any, context?: string) {
    this.log(`${this.colors.bright}${this.colors.green}✅ ${message}${this.colors.reset}`, context);
  }

  info(message: any, context?: string) {
    this.log(`${this.colors.cyan}ℹ️  ${message}${this.colors.reset}`, context);
  }

  request(method: string, url: string, statusCode: number, responseTime: number, context?: string) {
    const statusColor = statusCode >= 400 ? this.colors.red : statusCode >= 300 ? this.colors.yellow : this.colors.green;
    const message = `${method} ${url} ${statusColor}${statusCode}${this.colors.reset} - ${responseTime}ms`;
    this.log(message, context);
  }

  startupMessage(message: string, context?: string) {
    this.log(`${this.colors.bright}${this.colors.magenta}🚀 ${message}${this.colors.reset}`, context);
  }

  processMessage(message: string, context?: string) {
    this.log(`${this.colors.blue}🔄 ${message}${this.colors.reset}`, context);
  }
} 