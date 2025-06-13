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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpiritualGuidesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const spiritual_guides_service_1 = require("../services/spiritual-guides.service");
const create_spiritual_guide_dto_1 = require("../dto/create-spiritual-guide.dto");
const update_spiritual_guide_dto_1 = require("../dto/update-spiritual-guide.dto");
const generate_spiritual_guide_dto_1 = require("../dto/generate-spiritual-guide.dto");
let SpiritualGuidesController = class SpiritualGuidesController {
    constructor(spiritualGuidesService) {
        this.spiritualGuidesService = spiritualGuidesService;
    }
    create(createSpiritualGuideDto) {
        return this.spiritualGuidesService.create(createSpiritualGuideDto);
    }
    async generateComplete(generateDto) {
        return this.spiritualGuidesService.generateComplete(generateDto);
    }
    findAll(userId) {
        if (userId) {
            return this.spiritualGuidesService.findByUserId(userId);
        }
        return this.spiritualGuidesService.findAll();
    }
    getGenerationStatus(id) {
        return this.spiritualGuidesService.getGenerationStatus(id);
    }
    findOne(id) {
        return this.spiritualGuidesService.findOne(id);
    }
    findByUserId(userId) {
        return this.spiritualGuidesService.findByUserId(userId);
    }
    update(id, updateSpiritualGuideDto) {
        return this.spiritualGuidesService.update(id, updateSpiritualGuideDto);
    }
    remove(id) {
        return this.spiritualGuidesService.remove(id);
    }
};
exports.SpiritualGuidesController = SpiritualGuidesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new spiritual guide manually' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Spiritual guide created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_spiritual_guide_dto_1.CreateSpiritualGuideDto]),
    __metadata("design:returntype", void 0)
], SpiritualGuidesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate complete spiritual guide from survey answers',
        description: 'Creates a spiritual guide with text content immediately and processes image/video generation in background. Returns the guide with text content and status fields for polling.'
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Spiritual guide created with text content. Image/video generation started in background.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid survey data' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Error during generation process' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_spiritual_guide_dto_1.GenerateSpiritualGuideDto]),
    __metadata("design:returntype", Promise)
], SpiritualGuidesController.prototype, "generateComplete", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all spiritual guides' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Spiritual guides retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'Filter by user ID' }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SpiritualGuidesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get generation status of a spiritual guide',
        description: 'Returns the current generation status including progress for image, video, and boomerang generation. Use this endpoint for polling until isFullyGenerated is true.'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Generation status retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                guide: { type: 'object', description: 'Complete spiritual guide object' },
                progress: {
                    type: 'object',
                    properties: {
                        imageStatus: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
                        videoStatus: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
                        boomerangStatus: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
                        isFullyGenerated: { type: 'boolean' },
                        overallProgress: { type: 'number', description: 'Progress percentage (0-100)' }
                    }
                },
                errors: {
                    type: 'object',
                    description: 'Error details if any step failed',
                    properties: {
                        imageError: { type: 'string' },
                        videoError: { type: 'string' },
                        boomerangError: { type: 'string' }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Spiritual guide not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SpiritualGuidesController.prototype, "getGenerationStatus", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get spiritual guide by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Spiritual guide found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Spiritual guide not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SpiritualGuidesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all spiritual guides for a specific user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User spiritual guides retrieved successfully' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SpiritualGuidesController.prototype, "findByUserId", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update spiritual guide by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Spiritual guide updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Spiritual guide not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_spiritual_guide_dto_1.UpdateSpiritualGuideDto]),
    __metadata("design:returntype", void 0)
], SpiritualGuidesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete spiritual guide by ID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Spiritual guide deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Spiritual guide not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SpiritualGuidesController.prototype, "remove", null);
exports.SpiritualGuidesController = SpiritualGuidesController = __decorate([
    (0, swagger_1.ApiTags)('spiritual-guides'),
    (0, common_1.Controller)('spiritual-guides'),
    __metadata("design:paramtypes", [spiritual_guides_service_1.SpiritualGuidesService])
], SpiritualGuidesController);
//# sourceMappingURL=spiritual-guides.controller.js.map