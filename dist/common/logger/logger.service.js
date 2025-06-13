"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLoggerService = void 0;
const common_1 = require("@nestjs/common");
let CustomLoggerService = class CustomLoggerService extends common_1.ConsoleLogger {
    constructor() {
        super(...arguments);
        this.colors = {
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
        this.levelColors = {
            error: this.colors.red,
            warn: this.colors.yellow,
            log: this.colors.green,
            debug: this.colors.blue,
            verbose: this.colors.magenta,
        };
    }
    formatCustomMessage(level, message, context) {
        const coloredLevel = `${this.levelColors[level] || this.colors.white}${level.toUpperCase()}${this.colors.reset}`;
        const coloredContext = context ? `${this.colors.cyan}[${context}]${this.colors.reset}` : '';
        return `${coloredLevel} ${coloredContext} ${message}`;
    }
    log(message, context) {
        super.log(this.formatCustomMessage('log', message, context || this.context));
    }
    error(message, trace, context) {
        super.error(this.formatCustomMessage('error', message, context || this.context), trace);
    }
    warn(message, context) {
        super.warn(this.formatCustomMessage('warn', message, context || this.context));
    }
    debug(message, context) {
        super.debug(this.formatCustomMessage('debug', message, context || this.context));
    }
    verbose(message, context) {
        super.verbose(this.formatCustomMessage('verbose', message, context || this.context));
    }
    success(message, context) {
        this.log(`${this.colors.bright}${this.colors.green}✅ ${message}${this.colors.reset}`, context);
    }
    info(message, context) {
        this.log(`${this.colors.cyan}ℹ️  ${message}${this.colors.reset}`, context);
    }
    request(method, url, statusCode, responseTime, context) {
        const statusColor = statusCode >= 400 ? this.colors.red : statusCode >= 300 ? this.colors.yellow : this.colors.green;
        const message = `${method} ${url} ${statusColor}${statusCode}${this.colors.reset} - ${responseTime}ms`;
        this.log(message, context);
    }
    startupMessage(message, context) {
        this.log(`${this.colors.bright}${this.colors.magenta}🚀 ${message}${this.colors.reset}`, context);
    }
    processMessage(message, context) {
        this.log(`${this.colors.blue}🔄 ${message}${this.colors.reset}`, context);
    }
};
exports.CustomLoggerService = CustomLoggerService;
exports.CustomLoggerService = CustomLoggerService = __decorate([
    (0, common_1.Injectable)()
], CustomLoggerService);
//# sourceMappingURL=logger.service.js.map