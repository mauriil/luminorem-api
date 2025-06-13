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
exports.SurveyQuestionsController = void 0;
const common_1 = require("@nestjs/common");
const survey_questions_service_1 = require("../services/survey-questions.service");
let SurveyQuestionsController = class SurveyQuestionsController {
    constructor(surveyQuestionsService) {
        this.surveyQuestionsService = surveyQuestionsService;
    }
    async getAllQuestions() {
        return this.surveyQuestionsService.getAllQuestions();
    }
    async seedQuestions() {
        await this.surveyQuestionsService.seedInitialQuestions();
        return { message: 'Preguntas iniciales cargadas exitosamente' };
    }
};
exports.SurveyQuestionsController = SurveyQuestionsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SurveyQuestionsController.prototype, "getAllQuestions", null);
__decorate([
    (0, common_1.Post)('seed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SurveyQuestionsController.prototype, "seedQuestions", null);
exports.SurveyQuestionsController = SurveyQuestionsController = __decorate([
    (0, common_1.Controller)('api/survey-questions'),
    __metadata("design:paramtypes", [survey_questions_service_1.SurveyQuestionsService])
], SurveyQuestionsController);
//# sourceMappingURL=survey-questions.controller.js.map