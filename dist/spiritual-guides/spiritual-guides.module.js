"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpiritualGuidesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const spiritual_guides_controller_1 = require("./controllers/spiritual-guides.controller");
const survey_questions_controller_1 = require("./controllers/survey-questions.controller");
const spiritual_guides_service_1 = require("./services/spiritual-guides.service");
const survey_questions_service_1 = require("./services/survey-questions.service");
const initialization_service_1 = require("./services/initialization.service");
const spiritual_guide_entity_1 = require("./entities/spiritual-guide.entity");
const survey_question_entity_1 = require("./entities/survey-question.entity");
const external_services_module_1 = require("../external-services/external-services.module");
let SpiritualGuidesModule = class SpiritualGuidesModule {
};
exports.SpiritualGuidesModule = SpiritualGuidesModule;
exports.SpiritualGuidesModule = SpiritualGuidesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: spiritual_guide_entity_1.SpiritualGuide.name, schema: spiritual_guide_entity_1.SpiritualGuideSchema },
                { name: survey_question_entity_1.SurveyQuestion.name, schema: survey_question_entity_1.SurveyQuestionSchema },
            ]),
            external_services_module_1.ExternalServicesModule,
        ],
        controllers: [spiritual_guides_controller_1.SpiritualGuidesController, survey_questions_controller_1.SurveyQuestionsController],
        providers: [spiritual_guides_service_1.SpiritualGuidesService, survey_questions_service_1.SurveyQuestionsService, initialization_service_1.InitializationService],
        exports: [spiritual_guides_service_1.SpiritualGuidesService, survey_questions_service_1.SurveyQuestionsService],
    })
], SpiritualGuidesModule);
//# sourceMappingURL=spiritual-guides.module.js.map