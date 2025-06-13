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
var FileService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = void 0;
const common_1 = require("@nestjs/common");
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
if (ffmpeg_static_1.default) {
    fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_static_1.default);
}
let FileService = FileService_1 = class FileService {
    constructor() {
        this.uploadsDir = 'uploads';
        this.logger = new common_1.Logger(FileService_1.name);
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }
    }
    async downloadImage(url, filename) {
        try {
            const response = await (0, node_fetch_1.default)(url);
            if (!response.ok) {
                throw new Error('No se pudo descargar la imagen');
            }
            const filePath = path.join(this.uploadsDir, filename);
            const fileStream = fs.createWriteStream(filePath);
            await new Promise((resolve, reject) => {
                response.body.pipe(fileStream);
                response.body.on('error', reject);
                fileStream.on('finish', () => resolve());
            });
            return filePath;
        }
        catch (error) {
            throw new Error(`Error descargando imagen: ${error.message}`);
        }
    }
    async downloadVideo(videoUrl, filename) {
        try {
            this.logger.log("📥 Descargando video...");
            const response = await (0, node_fetch_1.default)(videoUrl);
            if (!response.ok) {
                throw new Error(`Error al descargar video: ${response.status} ${response.statusText}`);
            }
            const buffer = await response.buffer();
            const filePath = path.join(this.uploadsDir, filename);
            await fs.promises.writeFile(filePath, buffer);
            this.logger.log("✅ Video descargado exitosamente");
        }
        catch (error) {
            throw new Error(`Error downloading video: ${error.message}`);
        }
    }
    async createBoomerang(inputPath, outputPath) {
        try {
            this.logger.log("🎪 Creando efecto boomerang...");
            return new Promise((resolve, reject) => {
                const command = (0, fluent_ffmpeg_1.default)(inputPath)
                    .complexFilter([
                    '[0:v]reverse[r]',
                    '[0:v][r]concat=n=2:v=1[out]'
                ])
                    .outputOptions(['-map', '[out]'])
                    .output(outputPath);
                this.logger.log("🔧 Procesando video con FFmpeg...");
                command.on('progress', (progress) => {
                    if (progress.percent) {
                        this.logger.debug(`⏳ Progreso: ${Math.round(progress.percent)}%`);
                    }
                });
                command.on('end', () => {
                    this.logger.log("✅ Efecto boomerang creado exitosamente");
                    resolve();
                });
                command.on('error', (error) => {
                    reject(new Error(`Error creating boomerang: ${error.message}`));
                });
                command.run();
            });
        }
        catch (error) {
            throw new Error(`Error creating boomerang: ${error.message}`);
        }
    }
    generateFilename(guideName, type, extension) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const cleanName = guideName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        return `${cleanName}_${type}_${timestamp}.${extension}`;
    }
    async deleteFile(filename) {
        try {
            const filePath = path.join(this.uploadsDir, filename);
            await fs.promises.unlink(filePath);
            this.logger.log("🧹 Archivo eliminado:", filePath);
        }
        catch (error) {
            this.logger.warn("⚠️ No se pudo eliminar archivo:", error.message);
        }
    }
    fileExists(filePath) {
        return fs.existsSync(filePath);
    }
    getFileUrl(filename) {
        return `/uploads/${filename}`;
    }
};
exports.FileService = FileService;
exports.FileService = FileService = FileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FileService);
//# sourceMappingURL=file.service.js.map