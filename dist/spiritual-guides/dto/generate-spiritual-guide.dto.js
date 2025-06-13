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
exports.GenerateSpiritualGuideDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class GenerateSpiritualGuideDto {
}
exports.GenerateSpiritualGuideDto = GenerateSpiritualGuideDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '64f5a2b8c4567890abcdef12', description: 'ID del usuario' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], GenerateSpiritualGuideDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [
            'Escuchás algo que no sabías que estaba ahí',
            'Uno donde nada te apura',
            'Te confiás a lo que se siente verdadero'
        ],
        description: 'Array con las 20 respuestas del test espiritual'
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], GenerateSpiritualGuideDto.prototype, "surveyAnswers", void 0);
//# sourceMappingURL=generate-spiritual-guide.dto.js.map