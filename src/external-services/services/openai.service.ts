import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async generateSpiritualGuide(surveyAnswers: string[]): Promise<string> {
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
    } catch (error) {
      throw new Error(`Error generating spiritual guide: ${error.message}`);
    }
  }

  async generateImage(dallePrompt: string): Promise<string> {
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
    } catch (error) {
      throw new Error(`Error generating image: ${error.message}`);
    }
  }

  private optimizeDallePrompt(prompt: string): string {
    // 1. Garantizar criatura única
    let p = prompt.replace(/\b(two|pair|twins?|multiple|duo)\b/gi, 'single');

    // 2. Quitar palabras que inducen fichas técnicas
    const banWords = [
      'palette', 'swatches', 'color bar', 'color strip', 'color chart',
      'design sheet', 'reference sheet', 'ui', 'interface'
    ];
    banWords.forEach(w => { p = p.replace(new RegExp(w, 'gi'), ''); });

    // 3. Compactar espacios duplicados
    p = p.replace(/\s{2,}/g, ' ').trim();

    return p;
  }
} 