"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SpiritualGuidesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpiritualGuidesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const spiritual_guide_entity_1 = require("../entities/spiritual-guide.entity");
const openai_service_1 = require("../../external-services/services/openai.service");
const replicate_service_1 = require("../../external-services/services/replicate.service");
const file_service_1 = require("../../external-services/services/file.service");
let SpiritualGuidesService = SpiritualGuidesService_1 = class SpiritualGuidesService {
    constructor(spiritualGuideModel, openAiService, replicateService, fileService) {
        this.spiritualGuideModel = spiritualGuideModel;
        this.openAiService = openAiService;
        this.replicateService = replicateService;
        this.fileService = fileService;
        this.logger = new common_1.Logger(SpiritualGuidesService_1.name);
    }
    async create(createSpiritualGuideDto) {
        const createdGuide = new this.spiritualGuideModel(createSpiritualGuideDto);
        return createdGuide.save();
    }
    async findAll() {
        return this.spiritualGuideModel.find().populate('userId').exec();
    }
    async findOne(id) {
        const guide = await this.spiritualGuideModel.findById(id).populate('userId').exec();
        if (!guide) {
            throw new common_1.NotFoundException(`Spiritual guide with ID ${id} not found`);
        }
        return guide;
    }
    async findByUserId(userId) {
        return this.spiritualGuideModel.find({ userId }).populate('userId').exec();
    }
    async update(id, updateSpiritualGuideDto) {
        const updatedGuide = await this.spiritualGuideModel
            .findByIdAndUpdate(id, updateSpiritualGuideDto, { new: true })
            .populate('userId')
            .exec();
        if (!updatedGuide) {
            throw new common_1.NotFoundException(`Spiritual guide with ID ${id} not found`);
        }
        return updatedGuide;
    }
    async remove(id) {
        const result = await this.spiritualGuideModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new common_1.NotFoundException(`Spiritual guide with ID ${id} not found`);
        }
    }
    async generateComplete(generateDto) {
        try {
            this.logger.log('🔮 Iniciando generación de guía espiritual...');
            const spiritualGuideText = await this.openAiService.generateSpiritualGuide(generateDto.surveyAnswers);
            const extractedInfo = this.extractGuideInfo(spiritualGuideText);
            const dallePrompt = this.extractDallePrompt(spiritualGuideText);
            const spiritualGuide = await this.create({
                userId: generateDto.userId,
                surveyAnswers: generateDto.surveyAnswers,
                name: extractedInfo.name,
                physicalForm: extractedInfo.physicalForm,
                distinctiveTraits: extractedInfo.distinctiveTraits,
                personality: extractedInfo.personality,
                habitat: extractedInfo.habitat,
                connectionWithUser: extractedInfo.connectionWithUser,
                dallePrompt,
                imageStatus: spiritual_guide_entity_1.GenerationStatus.PENDING,
                videoStatus: spiritual_guide_entity_1.GenerationStatus.PENDING,
                boomerangStatus: spiritual_guide_entity_1.GenerationStatus.PENDING,
                isFullyGenerated: false,
            });
            this.logger.log('✨ Guía espiritual creada con textos, iniciando generación en background...');
            this.processBackgroundGeneration(spiritualGuide._id.toString())
                .catch(error => {
                this.logger.error('❌ Error en procesamiento background:', error.message);
            });
            return spiritualGuide;
        }
        catch (error) {
            this.logger.error('❌ Error en generación inicial:', error.message);
            throw new Error(`Error generating spiritual guide: ${error.message}`);
        }
    }
    async processBackgroundGeneration(guideId) {
        try {
            this.logger.log('🔄 Iniciando procesamiento background para guía:', guideId);
            const guide = await this.findOne(guideId);
            if (!guide || !guide.dallePrompt) {
                throw new Error('Guía no encontrada o sin prompt de DALL-E');
            }
            await this.processImageGeneration(guideId, guide.dallePrompt, guide.name);
            const updatedGuide = await this.findOne(guideId);
            if (updatedGuide.imageStatus === spiritual_guide_entity_1.GenerationStatus.COMPLETED && updatedGuide.imageUrl) {
                await this.processVideoGeneration(guideId, updatedGuide.name);
            }
            const finalGuide = await this.findOne(guideId);
            if (finalGuide.videoStatus === spiritual_guide_entity_1.GenerationStatus.COMPLETED && finalGuide.videoUrl) {
                await this.processBoomerangGeneration(guideId, finalGuide.name);
            }
            const completedGuide = await this.findOne(guideId);
            if (completedGuide.imageStatus === spiritual_guide_entity_1.GenerationStatus.COMPLETED &&
                completedGuide.videoStatus === spiritual_guide_entity_1.GenerationStatus.COMPLETED &&
                completedGuide.boomerangStatus === spiritual_guide_entity_1.GenerationStatus.COMPLETED) {
                await this.update(guideId, { isFullyGenerated: true });
                this.logger.log('🎉 Guía espiritual completamente generada:', guideId);
            }
        }
        catch (error) {
            this.logger.error('❌ Error en procesamiento background:', error.message);
        }
    }
    async processImageGeneration(guideId, dallePrompt, guideName) {
        try {
            this.logger.log('🎨 Generando imagen para guía:', guideId);
            await this.update(guideId, { imageStatus: spiritual_guide_entity_1.GenerationStatus.PROCESSING });
            const imageUrl = await this.openAiService.generateImage(dallePrompt);
            const imageFilename = this.fileService.generateFilename(guideName, 'image', 'png');
            await this.fileService.downloadImage(imageUrl, imageFilename);
            await this.update(guideId, {
                imageUrl: this.fileService.getFileUrl(imageFilename),
                imageStatus: spiritual_guide_entity_1.GenerationStatus.COMPLETED,
            });
            this.logger.log('✅ Imagen generada exitosamente para guía:', guideId);
        }
        catch (error) {
            this.logger.error('❌ Error generando imagen:', error.message);
            await this.update(guideId, {
                imageStatus: spiritual_guide_entity_1.GenerationStatus.FAILED,
                imageError: error.message,
            });
        }
    }
    async processVideoGeneration(guideId, guideName) {
        try {
            this.logger.log('🎬 Generando video para guía:', guideId);
            await this.update(guideId, { videoStatus: spiritual_guide_entity_1.GenerationStatus.PROCESSING });
            const guide = await this.findOne(guideId);
            if (!guide.imageUrl) {
                throw new Error('No hay imagen para animar');
            }
            const imageFilename = guide.imageUrl.split('/').pop();
            const imagePath = `uploads/${imageFilename}`;
            const videoUrl = await this.replicateService.animateImage(imagePath);
            const videoFilename = this.fileService.generateFilename(guideName, 'video', 'mp4');
            await this.fileService.downloadVideo(videoUrl, videoFilename);
            await this.update(guideId, {
                videoUrl: this.fileService.getFileUrl(videoFilename),
                videoStatus: spiritual_guide_entity_1.GenerationStatus.COMPLETED,
            });
            this.logger.log('✅ Video generado exitosamente para guía:', guideId);
        }
        catch (error) {
            this.logger.error('❌ Error generando video:', error.message);
            await this.update(guideId, {
                videoStatus: spiritual_guide_entity_1.GenerationStatus.FAILED,
                videoError: error.message,
            });
        }
    }
    async processBoomerangGeneration(guideId, guideName) {
        try {
            this.logger.log('🎪 Generando boomerang para guía:', guideId);
            await this.update(guideId, { boomerangStatus: spiritual_guide_entity_1.GenerationStatus.PROCESSING });
            const guide = await this.findOne(guideId);
            if (!guide.videoUrl) {
                throw new Error('No hay video para crear boomerang');
            }
            const videoFilename = guide.videoUrl.split('/').pop();
            const videoPath = `uploads/${videoFilename}`;
            const boomerangFilename = this.fileService.generateFilename(guideName, 'boomerang', 'mp4');
            const boomerangPath = `uploads/${boomerangFilename}`;
            await this.fileService.createBoomerang(videoPath, boomerangPath);
            await this.update(guideId, {
                boomerangVideoUrl: this.fileService.getFileUrl(boomerangFilename),
                boomerangStatus: spiritual_guide_entity_1.GenerationStatus.COMPLETED,
            });
            this.logger.log('✅ Boomerang generado exitosamente para guía:', guideId);
        }
        catch (error) {
            this.logger.error('❌ Error generando boomerang:', error.message);
            await this.update(guideId, {
                boomerangStatus: spiritual_guide_entity_1.GenerationStatus.FAILED,
                boomerangError: error.message,
            });
        }
    }
    async getGenerationStatus(id) {
        const guide = await this.findOne(id);
        let completedSteps = 0;
        const totalSteps = 3;
        if (guide.imageStatus === spiritual_guide_entity_1.GenerationStatus.COMPLETED)
            completedSteps++;
        if (guide.videoStatus === spiritual_guide_entity_1.GenerationStatus.COMPLETED)
            completedSteps++;
        if (guide.boomerangStatus === spiritual_guide_entity_1.GenerationStatus.COMPLETED)
            completedSteps++;
        const overallProgress = Math.round((completedSteps / totalSteps) * 100);
        const response = {
            guide,
            progress: {
                imageStatus: guide.imageStatus,
                videoStatus: guide.videoStatus,
                boomerangStatus: guide.boomerangStatus,
                isFullyGenerated: guide.isFullyGenerated,
                overallProgress,
            },
        };
        const errors = {};
        if (guide.imageError)
            errors.imageError = guide.imageError;
        if (guide.videoError)
            errors.videoError = guide.videoError;
        if (guide.boomerangError)
            errors.boomerangError = guide.boomerangError;
        if (Object.keys(errors).length > 0) {
            response.errors = errors;
        }
        return response;
    }
    extractGuideInfo(text) {
        this.logger.debug("🚀 ~ SpiritualGuidesService ~ extractGuideInfo ~ text:", text);
        const extractSection = (titulo) => {
            const lines = text.split('\n');
            let startIndex = -1;
            let endIndex = -1;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.includes(`**${titulo}**`)) {
                    startIndex = i;
                    break;
                }
            }
            if (startIndex === -1)
                return '';
            for (let i = startIndex + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('**') && line.endsWith('**') && line !== `**${titulo}**`) {
                    endIndex = i;
                    break;
                }
                if (line.includes('**Prompt')) {
                    endIndex = i;
                    break;
                }
                if (line.includes('---')) {
                    endIndex = i;
                    break;
                }
            }
            if (endIndex === -1)
                endIndex = lines.length;
            const contentLines = lines.slice(startIndex + 1, endIndex);
            let content = contentLines.join('\n').trim();
            content = content.replace(/\*\*/g, '');
            content = content.replace(/^\s*-\s*/, '');
            return content;
        };
        return {
            name: extractSection("Nombre del guía").replace(/\*\*/g, '') || 'Guía Espiritual',
            physicalForm: extractSection("Forma física") || 'Forma física única',
            distinctiveTraits: extractSection("Rasgos distintivos") || 'Rasgos especiales',
            personality: extractSection("Personalidad y forma de comunicarse") || 'Personalidad única',
            habitat: extractSection("Hábitat o espacio simbólico") || 'Espacio sagrado',
            connectionWithUser: extractSection("Vínculo con el usuario") || 'Conexión especial',
        };
    }
    extractDallePrompt(text) {
        const dallePromptMatch = text.match(/A mystical .*?(?=\n\n|$)/s);
        return dallePromptMatch ? dallePromptMatch[0].trim() : 'A mystical anime-style spirit guide';
    }
};
exports.SpiritualGuidesService = SpiritualGuidesService;
exports.SpiritualGuidesService = SpiritualGuidesService = SpiritualGuidesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(spiritual_guide_entity_1.SpiritualGuide.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        openai_service_1.OpenAiService,
        replicate_service_1.ReplicateService,
        file_service_1.FileService])
], SpiritualGuidesService);
//# sourceMappingURL=spiritual-guides.service.js.map