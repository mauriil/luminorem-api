"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ReplicateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplicateService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs = __importStar(require("fs"));
let ReplicateService = ReplicateService_1 = class ReplicateService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ReplicateService_1.name);
        this.replicateToken = this.configService.get('REPLICATE_TOKEN');
    }
    async animateImage(imagePath) {
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString('base64');
        const body = {
            input: {
                image: `data:image/png;base64,${imageBase64}`,
                prompt: "Animate subtle breathing and gentle tail sway for this single mystical anime-style spirit guide. Keep the motion slow, calm, and rhythmic, like inhaling and exhaling in a quiet forest. Should loop seamlessly, no jumps or unnatural movements, preserving the creature centered and majestic. Emphasize soft, organic motion only — no modern or mechanical effects."
            }
        };
        try {
            this.logger.log("📡 Enviando imagen a Replicate para animación...");
            const response = await (0, node_fetch_1.default)('https://api.replicate.com/v1/models/wavespeedai/wan-2.1-i2v-480p/predictions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.replicateToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al enviar a Replicate (${response.status}): ${errorText}`);
            }
            const prediction = await response.json();
            this.logger.log("🔄 Predicción iniciada. ID:", prediction.id);
            this.logger.log("⏳ Estado actual:", prediction.status);
            if (prediction.status === 'succeeded' && prediction.output) {
                this.logger.log("✅ Video completado inmediatamente!");
                return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
            }
            if (prediction.status === 'failed') {
                throw new Error(`La animación falló: ${prediction.error || 'Error desconocido'}`);
            }
            const pollUrl = prediction.urls.get;
            let intentos = 0;
            const maxIntentos = 60;
            while (intentos < maxIntentos) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                intentos++;
                this.logger.log(`🔄 Verificando progreso... (${intentos}/${maxIntentos}) ID: ${prediction.id}`);
                const pollResponse = await (0, node_fetch_1.default)(pollUrl, {
                    headers: { 'Authorization': `Bearer ${this.replicateToken}` }
                });
                if (!pollResponse.ok) {
                    throw new Error(`Error al verificar estado: ${pollResponse.status}`);
                }
                const pollData = await pollResponse.json();
                if (pollData.status === 'succeeded') {
                    this.logger.log("✅ ¡Animación completada con éxito!");
                    const videoUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;
                    if (!videoUrl) {
                        throw new Error('La animación se completó pero no se obtuvo URL del video');
                    }
                    return videoUrl;
                }
                if (pollData.status === 'failed') {
                    throw new Error(`La animación falló: ${pollData.error || 'Error desconocido'}`);
                }
                if (pollData.logs) {
                    const filteredLogs = this.filterProgressLogs(pollData.logs);
                    if (filteredLogs) {
                        this.logger.debug("📝 Progreso de animación:", filteredLogs);
                    }
                }
            }
            throw new Error('Timeout: La animación tardó demasiado en completarse');
        }
        catch (error) {
            this.logger.error("❌ Error en animación:", error.message);
            throw error;
        }
    }
    filterProgressLogs(logs) {
        if (!logs)
            return null;
        const lines = logs.split('\n');
        const lastLines = lines.slice(-10);
        const filteredLines = lastLines.filter(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.match(/^\d+%\|[█▋▊▌▍▎▏\s]+\|/)) {
                return false;
            }
            if (trimmedLine.includes('Processing') ||
                trimmedLine.includes('Generating') ||
                trimmedLine.includes('Completed') ||
                trimmedLine.includes('Error') ||
                trimmedLine.includes('Warning')) {
                return true;
            }
            return false;
        });
        return filteredLines.length > 0 ? filteredLines.join(' | ') : null;
    }
};
exports.ReplicateService = ReplicateService;
exports.ReplicateService = ReplicateService = ReplicateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ReplicateService);
//# sourceMappingURL=replicate.service.js.map