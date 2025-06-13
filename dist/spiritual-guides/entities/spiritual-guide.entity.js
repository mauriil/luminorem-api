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
exports.SpiritualGuideSchema = exports.SpiritualGuide = exports.GenerationStatus = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var GenerationStatus;
(function (GenerationStatus) {
    GenerationStatus["PENDING"] = "pending";
    GenerationStatus["PROCESSING"] = "processing";
    GenerationStatus["COMPLETED"] = "completed";
    GenerationStatus["FAILED"] = "failed";
})(GenerationStatus || (exports.GenerationStatus = GenerationStatus = {}));
let SpiritualGuide = class SpiritualGuide {
};
exports.SpiritualGuide = SpiritualGuide;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SpiritualGuide.prototype, "userId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "physicalForm", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "distinctiveTraits", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "personality", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "habitat", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "connectionWithUser", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], required: true }),
    __metadata("design:type", Array)
], SpiritualGuide.prototype, "surveyAnswers", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "imageUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "videoUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "boomerangVideoUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "dallePrompt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: GenerationStatus, default: GenerationStatus.PENDING }),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "imageStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: GenerationStatus, default: GenerationStatus.PENDING }),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "videoStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: GenerationStatus, default: GenerationStatus.PENDING }),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "boomerangStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], SpiritualGuide.prototype, "isFullyGenerated", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "imageError", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "videoError", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], SpiritualGuide.prototype, "boomerangError", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], SpiritualGuide.prototype, "createdAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], SpiritualGuide.prototype, "updatedAt", void 0);
exports.SpiritualGuide = SpiritualGuide = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], SpiritualGuide);
exports.SpiritualGuideSchema = mongoose_1.SchemaFactory.createForClass(SpiritualGuide);
//# sourceMappingURL=spiritual-guide.entity.js.map