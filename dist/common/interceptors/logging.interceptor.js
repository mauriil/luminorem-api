"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = class LoggingInterceptor {
    constructor() {
        this.logger = new common_1.Logger('HTTP');
    }
    intercept(context, next) {
        if (context.getType() === 'http') {
            const ctx = context.switchToHttp();
            const request = ctx.getRequest();
            const response = ctx.getResponse();
            const { method, url, ip } = request;
            const userAgent = request.get('User-Agent') || '';
            const startTime = Date.now();
            return next.handle().pipe((0, operators_1.tap)(() => {
                const { statusCode } = response;
                const responseTime = Date.now() - startTime;
                let statusColor = '';
                if (statusCode >= 500) {
                    statusColor = '\x1b[31m';
                }
                else if (statusCode >= 400) {
                    statusColor = '\x1b[33m';
                }
                else if (statusCode >= 300) {
                    statusColor = '\x1b[36m';
                }
                else {
                    statusColor = '\x1b[32m';
                }
                const methodColor = this.getMethodColor(method);
                const reset = '\x1b[0m';
                const dim = '\x1b[2m';
                const logMessage = `${methodColor}${method}${reset} ${url} ${statusColor}${statusCode}${reset} ${dim}${responseTime}ms - ${ip} ${userAgent}${reset}`;
                if (statusCode >= 400) {
                    this.logger.warn(logMessage);
                }
                else {
                    this.logger.log(logMessage);
                }
            }));
        }
        return next.handle();
    }
    getMethodColor(method) {
        switch (method) {
            case 'GET':
                return '\x1b[34m';
            case 'POST':
                return '\x1b[32m';
            case 'PUT':
                return '\x1b[33m';
            case 'DELETE':
                return '\x1b[31m';
            case 'PATCH':
                return '\x1b[35m';
            default:
                return '\x1b[37m';
        }
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map