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
exports.SurveyQuestionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const survey_question_entity_1 = require("../entities/survey-question.entity");
let SurveyQuestionsService = class SurveyQuestionsService {
    constructor(surveyQuestionModel) {
        this.surveyQuestionModel = surveyQuestionModel;
    }
    async getAllQuestions() {
        return this.surveyQuestionModel
            .find({ isActive: true })
            .sort({ order: 1 })
            .exec();
    }
    async createQuestion(questionData) {
        const question = new this.surveyQuestionModel(questionData);
        return question.save();
    }
    async seedInitialQuestions() {
        const count = await this.surveyQuestionModel.countDocuments();
        if (count > 0) {
            return;
        }
        const preguntasRefinadas = [
            {
                question: "Cuando todo a tu alrededor se silencia por un instante...",
                options: [
                    "Algo dentro tuyo se acomoda como si hubiera estado esperando.",
                    "Te invade una sensación de haber vuelto a un lugar que nunca abandonaste.",
                    "Sentís que el tiempo te abraza sin apurarte.",
                    "Reconocés algo que creías perdido pero nunca se fue.",
                    "Te conectás con una parte tuya que no necesita explicaciones."
                ],
                order: 1
            },
            {
                question: "Si pudieras refugiarte en un instante que no pertenece al reloj...",
                options: [
                    "Uno donde respirás sin recordar que tenés que hacerlo.",
                    "Uno que te sostiene sin pedirte nada a cambio.",
                    "Uno que te atraviesa como luz tibia.",
                    "Uno donde todo lo que necesitás ya está ahí.",
                    "Uno donde te sentís visto por algo que no juzga."
                ],
                order: 2
            },
            {
                question: "Cuando tu intuición te habla más fuerte que tus pensamientos...",
                options: [
                    "Te entregás a lo que se siente como verdad antigua.",
                    "Buscás el silencio donde las respuestas ya están.",
                    "Esperás hasta que algo dentro tuyo se asienta.",
                    "Consultás con la parte tuya que nunca duda.",
                    "Seguís el pulso de lo que te hace vibrar."
                ],
                order: 3
            },
            {
                question: "Cuando la claridad del mundo te resulta insuficiente...",
                options: [
                    "Te atraen los espacios donde las cosas no tienen bordes definidos.",
                    "Preferís la hondura de lo que no se puede nombrar completamente.",
                    "Te refugiás en las sombras que guardan secretos.",
                    "Te abrís a lo que vive entre las certezas.",
                    "Buscás lo que late debajo de las explicaciones."
                ],
                order: 4
            },
            {
                question: "Cuando alguien te ve de verdad, sin máscaras...",
                options: [
                    "Se crea un espacio sagrado donde no hacen falta las palabras.",
                    "Sentís que reconocés algo que siempre estuvo ahí.",
                    "Nace entre ustedes algo que no existía antes.",
                    "Algo dormido en vos se despierta y se estira.",
                    "El silencio se vuelve una conversación profunda."
                ],
                order: 5
            },
            {
                question: "Lo que te sostiene desde el fondo de quien sos...",
                options: [
                    "Es algo que permanece mientras todo lo demás cambia de forma.",
                    "Tiene la textura de tu primer recuerdo de seguridad.",
                    "Se parece a un ritual que hacés sin darte cuenta.",
                    "Está ahí incluso cuando te sentís perdido.",
                    "No sabés cuándo llegó, pero es parte de tu respiración."
                ],
                order: 6
            },
            {
                question: "Si lo invisible quisiera consolarte...",
                options: [
                    "Sería con una presencia que ya conocés desde siempre.",
                    "Con susurros que suenan como recuerdos de otro tiempo.",
                    "Sin tocar, pero llegando hasta donde duele.",
                    "Como un pensamiento que viene de un lugar más hondo.",
                    "Como una caricia que te calma desde adentro."
                ],
                order: 7
            },
            {
                question: "Cuando el camino se vuelve demasiado pesado...",
                options: [
                    "Te permitís hundirte un poco para luego flotar.",
                    "Esperás a que algo te tome de la mano desde adentro.",
                    "Volvés a los gestos que te tranquilizaban de niño.",
                    "Te dejás desaparecer hasta que volvés renovado.",
                    "Buscás una compañía silenciosa que no pide nada."
                ],
                order: 8
            },
            {
                question: "Si tu forma de sentir tuviera un movimiento...",
                options: [
                    "Sería como olas que van y vienen sin apurarse.",
                    "Tendría pausas donde se acumula toda la intensidad.",
                    "Cambiaría de dirección siguiendo corrientes invisibles.",
                    "Se repetiría en espirales cada vez más profundas.",
                    "Tendría espacios vacíos llenos de potencial."
                ],
                order: 9
            },
            {
                question: "En los momentos de mayor intimidad con vos mismo...",
                options: [
                    "Te sorprendés de quién sos cuando nadie te mira.",
                    "Confirmás verdades que solo vos entendés completamente.",
                    "Descubrís capas tuyas que nunca habías explorado.",
                    "Recuperás partes que creías que habías perdido para siempre.",
                    "Te emociona todo lo que aún no conocés de vos."
                ],
                order: 10
            },
            {
                question: "Si una esencia tuya habitara más allá de lo visible...",
                options: [
                    "Sería la que observa todo con curiosidad infinita.",
                    "La que sueña con símbolos que no tienen traducción.",
                    "La que acompaña sin necesidad de ser vista.",
                    "La que baila entre lo que fue y lo que será.",
                    "La que siente las emociones antes de que tengan nombre."
                ],
                order: 11
            },
            {
                question: "Cuando necesitás una guía que no tenga forma humana...",
                options: [
                    "Querés que te envuelva sin presionarte.",
                    "Esperás que te muestre caminos sin empujarte por ellos.",
                    "Pedís que te escuche sin tratar de arreglarte.",
                    "Deseás que te refleje tu propia sabiduría olvidada.",
                    "Confiás en que aparezca justo cuando más dudás de todo."
                ],
                order: 12
            },
            {
                question: "Cuando te sumergís en tu mundo interior...",
                options: [
                    "Te perdés de una manera que se siente como encontrarte.",
                    "Hallás tesoros que no sabías que habías enterrado.",
                    "El vértigo te aterroriza y te fascina al mismo tiempo.",
                    "Te emocionás sin entender por qué ni necesitar saberlo.",
                    "Escuchás voces que vienen de partes tuyas muy antiguas."
                ],
                order: 13
            },
            {
                question: "Si pudieras habitarte completamente...",
                options: [
                    "Sería en un espacio donde el ruido externo no llega.",
                    "Donde tu cuerpo se siente como casa y no como refugio.",
                    "Donde lo que pensás y lo que sentís son lo mismo.",
                    "Donde las cosas no necesitan nombres para existir.",
                    "Donde todos tus fragmentos conversan entre ellos."
                ],
                order: 14
            },
            {
                question: "Cuando algo te emociona sin razón aparente...",
                options: [
                    "Te sentís en casa en un lugar que nunca visitaste.",
                    "Tu cuerpo vibra como si recordara algo esencial.",
                    "Es como reencontrarte con una parte perdida de un sueño.",
                    "Todo tu ser quiere quedarse ahí para siempre.",
                    "Sentís que hasta el aire respira diferente a tu alrededor."
                ],
                order: 15
            },
            {
                question: "Cuando percibís que algo invisible te cuida...",
                options: [
                    "No necesitás verlo para saber que está ahí.",
                    "Es como una mano suave que nunca se retira de tu espalda.",
                    "Lo reconocés como si fuera parte de tu propia piel.",
                    "Es una presencia que se siente como un secreto sagrado.",
                    "Como si alguien hubiera estado ahí desde antes de que nacieras."
                ],
                order: 16
            },
            {
                question: "Si tu sabiduría más profunda pudiera elegir por vos...",
                options: [
                    "Se entregaría al movimiento sin resistencia.",
                    "Buscaría lo que otros no están viendo.",
                    "Haría silencio en vez de llenar los espacios vacíos.",
                    "Se quedaría con la primera verdad que sintió.",
                    "Elegiría lo que hace que tu alma se ría por dentro."
                ],
                order: 17
            },
            {
                question: "Cuando todo parece encajar demasiado perfectamente...",
                options: [
                    "Intuís que falta algo que no podés nombrar.",
                    "Te preguntás qué secreto se esconde en tanta claridad.",
                    "Preferís lo que no termina de resolver del todo.",
                    "Necesitás respirar en los espacios entre certezas.",
                    "Buscás las grietas por donde entra lo misterioso."
                ],
                order: 18
            },
            {
                question: "Si existiera una conexión que no dependiera de las palabras...",
                options: [
                    "Sería tejida con hilos de presencias compartidas.",
                    "Tendría la forma de un recuerdo que nunca se desvanece.",
                    "Viviría en la manera de moverse en el mismo ritmo.",
                    "Sería un cordón invisible que se fortalece con la distancia.",
                    "Como respirar junto a alguien sin ponerse de acuerdo."
                ],
                order: 19
            },
            {
                question: "Cuando buscás una señal para continuar...",
                options: [
                    "Esperás algo que solo tu corazón pueda descifrar.",
                    "Buscás una verdad que se sienta como reconocimiento.",
                    "Te alcanza con un gesto que despierte algo dormido.",
                    "Necesitás recordar algo que sabías antes de aprender a hablar.",
                    "Sabés que hasta el silencio puede ser la respuesta que necesitás."
                ],
                order: 20
            }
        ];
        await this.surveyQuestionModel.insertMany(preguntasRefinadas);
    }
};
exports.SurveyQuestionsService = SurveyQuestionsService;
exports.SurveyQuestionsService = SurveyQuestionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(survey_question_entity_1.SurveyQuestion.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], SurveyQuestionsService);
//# sourceMappingURL=survey-questions.service.js.map