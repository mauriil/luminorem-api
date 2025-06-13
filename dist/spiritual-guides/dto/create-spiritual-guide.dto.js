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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSpiritualGuideDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const spiritual_guide_entity_1 = require("../entities/spiritual-guide.entity");
class CreateSpiritualGuideDto {
}
exports.CreateSpiritualGuideDto = CreateSpiritualGuideDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '64f5a2b8c4567890abcdef12', description: 'ID del usuario' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['Escuchás algo que no sabías que estaba ahí', 'Uno donde nada te apura'],
        description: 'Respuestas del test espiritual'
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], CreateSpiritualGuideDto.prototype, "surveyAnswers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Luminia', description: 'Nombre del guía espiritual', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Forma física del guía', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "physicalForm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Rasgos distintivos', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "distinctiveTraits", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Personalidad y comunicación', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "personality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Hábitat o espacio simbólico', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "habitat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Conexión con el usuario', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "connectionWithUser", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL de la imagen generada', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "imageUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL del video animado', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "videoUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL del video boomerang', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "boomerangVideoUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Prompt usado para DALL-E', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "dallePrompt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: spiritual_guide_entity_1.GenerationStatus,
        description: 'Estado de generación de la imagen',
        required: false,
        default: spiritual_guide_entity_1.GenerationStatus.PENDING
    }),
    (0, class_validator_1.IsEnum)(spiritual_guide_entity_1.GenerationStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "imageStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: spiritual_guide_entity_1.GenerationStatus,
        description: 'Estado de generación del video',
        required: false,
        default: spiritual_guide_entity_1.GenerationStatus.PENDING
    }),
    (0, class_validator_1.IsEnum)(spiritual_guide_entity_1.GenerationStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "videoStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: spiritual_guide_entity_1.GenerationStatus,
        description: 'Estado de generación del boomerang',
        required: false,
        default: spiritual_guide_entity_1.GenerationStatus.PENDING
    }),
    (0, class_validator_1.IsEnum)(spiritual_guide_entity_1.GenerationStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "boomerangStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Indica si la guía fue completamente generada',
        required: false,
        default: false
    }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateSpiritualGuideDto.prototype, "isFullyGenerated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error en generación de imagen', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "imageError", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error en generación de video', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "videoError", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Error en generación de boomerang', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateSpiritualGuideDto.prototype, "boomerangError", void 0);
//# sourceMappingURL=create-spiritual-guide.dto.js.map