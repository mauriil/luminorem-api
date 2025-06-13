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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = __importDefault(require("openai"));
let OpenAiService = class OpenAiService {
    constructor(configService) {
        this.configService = configService;
        this.openai = new openai_1.default({
            apiKey: this.configService.get('OPENAI_API_KEY'),
        });
    }
    async generateSpiritualGuide(surveyAnswers) {
        const prompt = `Eres un chamán digital especializado en traducir emociones en criaturas simbólicas. Has recibido una serie de respuestas profundas, personales y simbólicas. Tu tarea es crear un **guía espiritual absolutamente único** para el usuario.

Estas respuestas revelan:
- Su mundo interior más íntimo
- Cómo percibe el consuelo, la intuición y el vínculo silencioso
- Qué tipo de energía lo calma o lo impulsa
- Qué presencia siente como protectora
- Cómo desea ser comprendido sin necesidad de explicarse
- La esencia interior del usuario
- La forma y presencia que el guía debe tener
- El tipo de conexión y vínculo que se establecerá
- Los colores y energía que resonarán con el usuario

---

### Objetivo:
Generar un texto con formato estricto que **sea interpretado automáticamente** por un sistema que identifica los siguientes encabezados:

1. **Nombre del guía**  
2. **Forma física**  
3. **Rasgos distintivos**  
4. **Personalidad y forma de comunicarse**  
5. **Hábitat o espacio simbólico**  
6. **Vínculo con el usuario**

**IMPORTANTE**:  
- No agregues ni omitas ninguna sección.  
- No uses guiones, subtítulos ni emojis dentro del contenido.  
- No insertes saltos innecesarios entre líneas.  
- No inventes secciones adicionales.  
- El texto debe seguir el siguiente **formato exacto**:

---

**Nombre del guía**  
[Texto poético que evoque su esencia, no más de 3 palabras]

**Forma física**  
[Descripción de su fusión de animales, estilo anime, presencia simbólica]

**Rasgos distintivos**  
[Detalles en ojos, piel, luz, entorno, marcas mágicas, etc.]

**Personalidad y forma de comunicarse**  
[Cómo se expresa, tono emocional, energía arquetípica]

**Hábitat o espacio simbólico**  
[Descripción del entre-mundo simbólico donde aparece]

**Vínculo con el usuario**  
[Cómo se conecta con el usuario, cómo se manifiesta esa relación emocional]

---

### Luego, genera un prompt en inglés para DALL·E, siguiendo este formato:

"A mystical anime-style spirit guide, a single [animal-hybrid] with [physical traits], [gender identity: feminine, masculine, or genderless], [pose and expression]. [Brief magical element, such as 'its wings shimmer with embedded starlight']. The creature glows with natural hues flowing through its body, softly illuminating from within. Set against a symbolic, seamless background that enhances its emotional presence. The creature is alone, centered, and majestic. Highly detailed, vibrant anime art style, magical realism. Pure artwork composition."

---

### 🧠 Respuestas del usuario:
${surveyAnswers.map((r, i) => `${i + 1}. ${r}`).join('\n')}
`;
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'Eres un chamán digital que invoca guías espirituales únicos. Tu lenguaje es poético, místico y profundo.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.9,
            });
            return completion.choices[0].message.content;
        }
        catch (error) {
            throw new Error(`Error generating spiritual guide: ${error.message}`);
        }
    }
    async generateImage(dallePrompt) {
        try {
            const optimizedPrompt = this.optimizeDallePrompt(dallePrompt);
            const imageResponse = await this.openai.images.generate({
                model: 'dall-e-3',
                prompt: optimizedPrompt,
                n: 1,
                size: '1024x1024',
                quality: 'hd',
                style: 'vivid'
            });
            return imageResponse.data[0].url;
        }
        catch (error) {
            throw new Error(`Error generating image: ${error.message}`);
        }
    }
    async generateEmbedding(text) {
        try {
            const response = await this.openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
            });
            return response.data[0].embedding;
        }
        catch (error) {
            throw new Error(`Error generating embedding: ${error.message}`);
        }
    }
    async generateChatResponse(messages, temperature = 0.7) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
                messages,
                temperature,
                max_tokens: 1000,
                tools: [
                    {
                        type: "function",
                        function: {
                            name: "web_search_preview",
                            description: "Busca información actualizada en la web sobre cualquier tema",
                            parameters: {
                                type: "object",
                                properties: {
                                    query: {
                                        type: "string",
                                        description: "La consulta de búsqueda a realizar"
                                    }
                                },
                                required: ["query"]
                            }
                        }
                    }
                ],
            });
            const message = completion.choices[0].message;
            if (message.tool_calls && message.tool_calls.length > 0) {
                const toolCall = message.tool_calls[0];
                if (toolCall.function.name === 'web_search_preview') {
                    const searchQuery = JSON.parse(toolCall.function.arguments).query;
                    const searchResults = await this.searchWeb(searchQuery);
                    const finalCompletion = await this.openai.chat.completions.create({
                        model: 'gpt-4o',
                        messages: [
                            ...messages,
                            {
                                role: 'assistant',
                                content: null,
                                tool_calls: message.tool_calls
                            },
                            {
                                role: 'tool',
                                content: searchResults,
                                tool_call_id: toolCall.id
                            }
                        ],
                        temperature,
                        max_tokens: 1000,
                    });
                    return finalCompletion.choices[0].message.content;
                }
            }
            return message.content;
        }
        catch (error) {
            throw new Error(`Error generating chat response: ${error.message}`);
        }
    }
    async searchWeb(query) {
        try {
            const lowerQuery = query.toLowerCase();
            if (lowerQuery.includes('fecha') || lowerQuery.includes('día') || lowerQuery.includes('hoy') || lowerQuery.includes('today')) {
                const now = new Date();
                const dateOptions = {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'America/Mexico_City'
                };
                const timeOptions = {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Mexico_City'
                };
                const currentDate = now.toLocaleDateString('es-MX', dateOptions);
                const currentTime = now.toLocaleTimeString('es-MX', timeOptions);
                return `📅 **Información actual:**\n\n**Fecha:** ${currentDate}\n**Hora:** ${currentTime} (hora de México)\n\nEsta información está actualizada en tiempo real.`;
            }
            if (lowerQuery.includes('año') || lowerQuery.includes('2024') || lowerQuery.includes('2025')) {
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().toLocaleDateString('es-MX', { month: 'long' });
                return `📅 **Información temporal actualizada:**\n\n**Año actual:** ${currentYear}\n**Mes actual:** ${currentMonth}\n\nEsta información está actualizada automáticamente.`;
            }
            const braveApiKey = this.configService.get('BRAVE_API_KEY');
            if (braveApiKey) {
                const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
                    headers: {
                        'Accept': 'application/json',
                        'Accept-Encoding': 'gzip',
                        'X-Subscription-Token': braveApiKey
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    if (data.web && data.web.results && data.web.results.length > 0) {
                        const results = data.web.results.slice(0, 3).map((result) => `**${result.title}**\n${result.description}\nFuente: ${result.url}`).join('\n\n');
                        return `🌐 **Información actualizada de la web sobre "${query}":**\n\n${results}`;
                    }
                }
            }
            return `🔍 **Búsqueda solicitada:** "${query}"\n\n⚠️ **Nota:** No tengo acceso a información actualizada de la web en este momento. Mi conocimiento se limita a información hasta abril de 2024.\n\n**Para información actualizada, te recomiendo:**\n- Consultar sitios web confiables\n- Verificar noticias recientes\n- Usar motores de búsqueda actualizados\n\n¿Hay algo específico de mi conocimiento base que pueda ayudarte?`;
        }
        catch (error) {
            console.error('Error searching web:', error);
            return `❌ **Error en la búsqueda**\n\nOcurrió un problema al buscar información actualizada. Mi conocimiento se limita a información hasta abril de 2024.\n\n¿Puedo ayudarte con algo específico de mi conocimiento base?`;
        }
    }
    optimizeDallePrompt(prompt) {
        let p = prompt.replace(/\b(two|pair|twins?|multiple|duo)\b/gi, 'single');
        const banWords = [
            'palette', 'swatches', 'color bar', 'color strip', 'color chart',
            'design sheet', 'reference sheet', 'ui', 'interface'
        ];
        banWords.forEach(w => { p = p.replace(new RegExp(w, 'gi'), ''); });
        p = p.replace(/\s{2,}/g, ' ').trim();
        return p;
    }
};
exports.OpenAiService = OpenAiService;
exports.OpenAiService = OpenAiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OpenAiService);
//# sourceMappingURL=openai.service.js.map