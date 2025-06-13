// Este snippet usa OpenAI para generar el guía espiritual tras responder el test
// Asume que tenés tu API key de OpenAI cargada en una variable de entorno o config

import OpenAI from "openai";
import readline from "readline";
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Configurar ffmpeg para usar la versión estática
ffmpeg.setFfmpegPath(ffmpegStatic);

const execAsync = promisify(exec);
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "sk-proj-UAisaBsoTte1edBsxw9qT3BlbkFJgbi5kN09Dje8jtqNguDT",
});

const preguntas = [
    {
        texto: "Cuando todo a tu alrededor se detiene por un instante...",
        opciones: [
            "Escuchás algo que no sabías que estaba ahí.",
            "Te invade una sensación de haber vuelto a casa.",
            "Te sentís como si el tiempo te pidiera silencio.",
            "Recordás algo que no sabías que habías olvidado.",
            "Te conectás con algo que no podés nombrar."
        ]
    },
    {
        texto: "Si pudieras quedarte en un momento que no pertenece a ningún día...",
        opciones: [
            "Uno donde nada te apura.",
            "Uno que no necesitás entender.",
            "Uno que te atraviesa sin tocarte.",
            "Uno donde todo está en pausa.",
            "Uno donde te sentís observado sin miedo."
        ]
    },
    {
        texto: "Cuando estás al borde de una decisión importante...",
        opciones: [
            "Te confiás a lo que se siente verdadero.",
            "Buscás lo que permanece quieto.",
            "Esperás hasta que algo se acomode dentro tuyo.",
            "Consultás con lo que ya sabías pero habías olvidado.",
            "Seguís el ritmo de lo que te emociona."
        ]
    },
    {
        texto: "Cuando el mundo te resulta demasiado claro...",
        opciones: [
            "Extrañás lo que se esconde.",
            "Preferís la sutileza de lo que no se dice.",
            "Te alejás en busca de sombra.",
            "Te abrís a lo que no tiene forma definida.",
            "Te refugiás en lo que no necesita explicación."
        ]
    },
    {
        texto: "Cuando conectás con alguien de verdad...",
        opciones: [
            "Sentís que no necesitás hablar mucho.",
            "Sabés que te ve más allá de lo visible.",
            "Se crea un espacio nuevo entre los dos.",
            "Sentís que algo se despierta en vos.",
            "Te sentís acompañado incluso en el silencio."
        ]
    },
    {
        texto: "Cuando pensás en lo que te sostiene desde adentro...",
        opciones: [
            "Es algo que no cambia aunque cambies.",
            "Tiene la forma del recuerdo más viejo.",
            "Se parece a un gesto repetido sin pensar.",
            "Está siempre, incluso cuando no lo buscás.",
            "No sabés de dónde viene, pero es tuyo."
        ]
    },
    {
        texto: "Si lo invisible pudiera hablarte al oído...",
        opciones: [
            "Sería con una voz que ya escuchaste antes.",
            "Con palabras que parecen venir de un sueño.",
            "Sin sonidos, pero con total claridad.",
            "Como un pensamiento que no es del todo tuyo.",
            "Como una emoción que te deja inmóvil."
        ]
    },
    {
        texto: "Cuando te cuesta avanzar...",
        opciones: [
            "Te quedás quieto y dejás que todo pase por vos.",
            "Esperás a sentir un pequeño empujón interno.",
            "Volvés a lo que te daba calma de chico.",
            "Te permitís desaparecer por un rato.",
            "Buscás algo que te acompañe aunque no hable."
        ]
    },
    {
        texto: "Si tu forma de ver el mundo fuera un ritmo...",
        opciones: [
            "Sería lento, profundo y sin saltos.",
            "Tendría pausas inesperadas.",
            "Cambiaría sin previo aviso.",
            "Se repetiría en formas distintas.",
            "Tendría espacios vacíos que dicen mucho."
        ]
    },
    {
        texto: "Cuando más te conocés a vos mismo...",
        opciones: [
            "Te descubrís como si fueras otra persona.",
            "Confirmás cosas que nadie más entiende.",
            "Notás detalles que antes no veías.",
            "Volvés a sentir cosas que creías perdidas.",
            "Te sorprendés de lo que aún queda por mostrar."
        ]
    },
    {
        texto: "Si una parte tuya quedara viva en otro plano...",
        opciones: [
            "Sería la que observa en silencio.",
            "La que sueña con imágenes raras.",
            "La que acompaña sin hacerse notar.",
            "La que espera, pero nunca está quieta.",
            "La que siente antes de pensar."
        ]
    },
    {
        texto: "Cuando necesitás una guía sin forma ni rostro...",
        opciones: [
            "Deseás que te abrace sin tocarte.",
            "Querés que te muestre sin empujarte.",
            "Pedís que te escuche sin interrupciones.",
            "Esperás que te refleje lo que no podés ver.",
            "Confiás en que aparezca justo cuando dudás."
        ]
    },
    {
        texto: "Cuando mirás hacia adentro por demasiado tiempo...",
        opciones: [
            "Te perdés un poco, pero te gusta.",
            "Encontrás algo que no sabías que estaba ahí.",
            "Te da vértigo, pero te ancla.",
            "Te emocionás sin saber por qué.",
            "Descubrís otra voz adentro tuyo."
        ]
    },
    {
        texto: "Si pudieras habitar un instante eterno...",
        opciones: [
            "Uno donde todo suena apagado.",
            "Uno donde el cuerpo se siente liviano.",
            "Uno donde lo de afuera no importa.",
            "Uno donde las cosas no tienen nombre.",
            "Uno donde nadie necesita explicarse."
        ]
    },
    {
        texto: "Cuando algo te emociona sin explicación...",
        opciones: [
            "Te sentís en casa aunque no sepas por qué.",
            "Algo en tu cuerpo se acomoda distinto.",
            "Es como si recordaras un sueño olvidado.",
            "Te dan ganas de cerrar los ojos y quedarte ahí.",
            "Todo a tu alrededor parece respirar con vos."
        ]
    },
    {
        texto: "Cuando sentís que algo te cuida...",
        opciones: [
            "No necesitás que se muestre.",
            "Es como una presencia suave en la nuca.",
            "Es algo que reconocés sin haberlo visto.",
            "Es una sensación que no se puede decir en voz alta.",
            "Es como si alguien estuviera ahí desde antes que vos."
        ]
    },
    {
        texto: "Si tu parte más intuitiva pudiera elegir...",
        opciones: [
            "Se dejaría llevar sin saber a dónde.",
            "Buscaría lo que nadie está mirando.",
            "Haría silencio en vez de preguntar.",
            "Se quedaría con lo primero que sintió.",
            "Elegiría lo que le hace cosquillas al alma."
        ]
    },
    {
        texto: "Cuando todo parece tener demasiado sentido...",
        opciones: [
            "Desconfiás un poco, como si faltara algo.",
            "Te preguntás qué está fuera de ese orden.",
            "Preferís lo que no encaja del todo.",
            "Te hace falta un respiro entre certezas.",
            "Buscás grietas donde se filtre lo inesperado."
        ]
    },
    {
        texto: "Si un vínculo no necesitara palabras para ser real...",
        opciones: [
            "Sería hecho de presencias compartidas.",
            "Tendría la forma de un recuerdo sin fecha.",
            "Estaría en la forma de moverse juntos.",
            "Sería un hilo invisible que no se rompe.",
            "Sería como respirar en el mismo ritmo."
        ]
    },
    {
        texto: "Cuando necesitás un mensaje para seguir adelante...",
        opciones: [
            "Esperás una señal que solo vos puedas entender.",
            "Buscás una frase que se sienta como verdad antigua.",
            "Te alcanza con un gesto que te despierte.",
            "Necesitás recordar algo que sabías de chico.",
            "Confiás en que lo que no llega, también dice algo."
        ]
    }
];


const respuestas = [];

function optimizarPromptDalle(prompt) {
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

    // 4. Añadir una ÚNICA cláusula negativa clara
    // if (!/no (palettes?|swatches?)/i.test(p)) {
    //   p += ' — no palettes, no swatches, no design overlays.';
    // }
    return p;
}



async function preguntar(i = 0) {
    if (i >= preguntas.length) {
        await generarGuia();
        rl.close();
        return;
    }
    const p = preguntas[i];
    console.log(`\n${i + 1}. ${p.texto}`);
    p.opciones.forEach((opt, idx) => {
        console.log(`${String.fromCharCode(65 + idx)}. ${opt}`);
    });
    rl.question("Elegí una opción (A/B/C/...): ", (resp) => {
        const idx = resp.toUpperCase().charCodeAt(0) - 65;
        if (idx >= 0 && idx < p.opciones.length) {
            respuestas.push(p.opciones[idx]);
            preguntar(i + 1);
        } else {
            console.log("Respuesta inválida.");
            preguntar(i);
        }
    });
}

async function descargarImagen(url, nombreArchivo) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('No se pudo descargar la imagen de DALL-E');
    const dest = fs.createWriteStream(nombreArchivo);
    await new Promise((resolve, reject) => {
        res.body.pipe(dest);
        res.body.on('error', reject);
        dest.on('finish', resolve);
    });
    return nombreArchivo;
}

async function animarImagenConReplicate(rutaImagen) {
    const replicateToken = 'r8_PN1CXZZ78CWzGodR7VHmblNcfZzI8EM2tYQah';
    const imagenBuffer = fs.readFileSync(rutaImagen);
    const imagenBase64 = imagenBuffer.toString('base64');

    const body = {
        input: {
            image: `data:image/png;base64,${imagenBase64}`,
            prompt: "Animate subtle breathing and gentle tail sway for this single mystical anime-style spirit guide. Keep the motion slow, calm, and rhythmic, like inhaling and exhaling in a quiet forest. Should loop seamlessly, no jumps or unnatural movements, preserving the creature centered and majestic. Emphasize soft, organic motion only — no modern or mechanical effects."
        }
    };

    try {
        // Iniciar la predicción
        console.log("📡 Enviando imagen a Replicate para animación...");
        const response = await fetch('https://api.replicate.com/v1/models/wavespeedai/wan-2.1-i2v-480p/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${replicateToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al enviar a Replicate (${response.status}): ${errorText}`);
        }

        const prediction = await response.json();
        console.log("🔄 Predicción iniciada. ID:", prediction.id);
        console.log("⏳ Estado actual:", prediction.status);

        // Si ya está completada (raro pero posible)
        if (prediction.status === 'succeeded' && prediction.output) {
            console.log("✅ Video completado inmediatamente!");
            return Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        }

        // Si falló inmediatamente
        if (prediction.status === 'failed') {
            throw new Error(`La animación falló: ${prediction.error || 'Error desconocido'}`);
        }

        // Hacer polling hasta que esté completada
        const pollUrl = prediction.urls.get;
        let intentos = 0;
        const maxIntentos = 60; // 3 minutos máximo (60 * 3 segundos)

        while (intentos < maxIntentos) {
            await new Promise(resolve => setTimeout(resolve, 3000)); // Espera 3 segundos
            intentos++;

            console.log(`🔄 Verificando progreso... (${intentos}/${maxIntentos})`);

            const pollResponse = await fetch(pollUrl, {
                headers: { 'Authorization': `Bearer ${replicateToken}` }
            });

            if (!pollResponse.ok) {
                throw new Error(`Error al verificar estado: ${pollResponse.status}`);
            }

            const pollData = await pollResponse.json();
            console.log("📊 Estado:", pollData.status);

            if (pollData.status === 'succeeded') {
                console.log("✅ ¡Animación completada con éxito!");
                const videoUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;

                if (!videoUrl) {
                    throw new Error('La animación se completó pero no se obtuvo URL del video');
                }

                return videoUrl;
            }

            if (pollData.status === 'failed') {
                throw new Error(`La animación falló: ${pollData.error || 'Error desconocido'}`);
            }

            // Mostrar progreso si está disponible
            if (pollData.logs) {
                console.log("📝 Último log:", pollData.logs.slice(-100)); // Últimos 100 caracteres
            }
        }

        throw new Error('Timeout: La animación tardó demasiado en completarse');

    } catch (error) {
        console.error("❌ Error en animación:", error.message);
        throw error;
    }
}

async function descargarVideo(url, nombreArchivo) {
    try {
        console.log("📥 Descargando video de Replicate...");
        const res = await fetch(url);
        if (!res.ok) throw new Error('No se pudo descargar el video de Replicate');
        const dest = fs.createWriteStream(nombreArchivo);
        await new Promise((resolve, reject) => {
            res.body.pipe(dest);
            res.body.on('error', reject);
            dest.on('finish', resolve);
        });
        console.log("✅ Video descargado exitosamente");
        return nombreArchivo;
    } catch (error) {
        console.error("❌ Error descargando video:", error.message);
        throw error;
    }
}

async function crearBoomerang(videoOriginal, videoBoomerang) {
    try {
        console.log("🎪 Creando efecto boomerang...");

        return new Promise((resolve, reject) => {
            ffmpeg(videoOriginal)
                .complexFilter([
                    '[0:v]reverse[r]',
                    '[0:v][r]concat=n=2:v=1[outv]'
                ])
                .map('[outv]')
                .output(videoBoomerang)
                .on('start', () => {
                    console.log("🔧 Procesando video con FFmpeg...");
                })
                .on('progress', (progress) => {
                    if (progress.percent) {
                        console.log(`⏳ Progreso: ${Math.round(progress.percent)}%`);
                    }
                })
                .on('end', () => {
                    console.log("✅ Efecto boomerang creado exitosamente");
                    resolve(videoBoomerang);
                })
                .on('error', (error) => {
                    console.error("❌ Error creando boomerang:", error.message);
                    reject(error);
                })
                .run();
        });
    } catch (error) {
        console.error("❌ Error creando boomerang:", error.message);
        throw error;
    }
}

function generarNombreArchivo(guiaNombre, tipo, extension) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const nombreLimpio = guiaNombre.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${nombreLimpio}_${tipo}_${timestamp}.${extension}`;
}

async function limpiarArchivosTemporales(archivo) {
    try {
        if (fs.existsSync(archivo)) {
            fs.unlinkSync(archivo);
            console.log("🧹 Archivo temporal eliminado");
        }
    } catch (error) {
        console.log("⚠️ No se pudo eliminar archivo temporal:", error.message);
    }
}

async function generarGuia() {
    const prompt = `Eres un chamán digital especializado en traducir emociones en criaturas simbólicas. 
Has recibido una serie de respuestas profundas, personales y simbólicas. 
Tu tarea es crear un guía espiritual absolutamente único para el usuario.

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

**Objetivo**: Manifestar un guía espiritual que sea reflejo puro del alma del usuario.

**Genera un texto con los siguientes elementos** (no inventes secciones adicionales):

1. **Nombre del guía**  
   - Que evoque su esencia, con resonancia simbólica o poética.  

2. **Forma física**  
   - Debe ser una fusión de animales reales o arquetipos simbólicos (no inventados).  
   - Estilo anime, con rasgos mágicos sutiles.  
   - Que su presencia sugiera su propósito (protección, claridad, guía, espejo, etc.).

3. **Rasgos distintivos**  
   - Texturas, luz interior, detalles en alas/piel/ojos/pasos.  
   - Qué lo rodea, qué lleva, qué lo hace único incluso entre lo mágico.  
   - Que no parezca disfraz ni adorno, sino símbolo vivo.

4. **Personalidad y forma de comunicarse**  
   - ¿Habla o vibra? ¿Se expresa con palabras, miradas, silencios?  
   - ¿Es más sabio, más dulce, más misterioso, más juguetón?

5. **Hábitat o espacio simbólico**  
   - No menciones ubicaciones reales. Describe el “entre-mundo” donde aparece.  
   - Que ese lugar esté emocionalmente conectado al usuario (vía las respuestas).  

6. **Vínculo con el usuario**  
   - Cómo se manifiesta esta relación especial, íntima y única.  

**Luego, genera un prompt en inglés para DALL·E**, siguiendo este formato exactamente:

"A mystical anime-style spirit guide, a single [animal-hybrid] with [physical traits], [gender identity: feminine, masculine, or genderless], [pose and expression]. [Brief magical element, such as 'its wings shimmer with embedded starlight']. The creature glows with natural hues flowing through its body, softly illuminating from within. Set against a symbolic, seamless background that enhances its emotional presence. The creature is alone, centered, and majestic. Highly detailed, vibrant anime art style, magical realism. Pure artwork composition."

**Prohibido en el prompt de imagen**:  
- Menciones a interfaz gráfica, “color palettes”, textos, íconos, nombres de estilo o elementos de diseño.  
- Nada que sugiera múltiples criaturas. Solo una.  

**Respuestas del usuario**:  
${respuestas.map((r, i) => `${i + 1}. ${r}`).join("\n")}
`;



    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "Eres un chamán digital que invoca guías espirituales únicos. Tu lenguaje es poético, místico y profundo." },
                { role: "user", content: prompt }
            ],
            temperature: 0.9,
        });

        const extractSection = (text, numeroSeccion, titulo) => {
            // Dividir texto en líneas para análisis más fácil
            const lines = text.split('\n');
            let startIndex = -1;
            let endIndex = -1;
            
            // Buscar línea de inicio
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.includes(`**${numeroSeccion}. ${titulo}**`)) {
                    startIndex = i;
                    break;
                }
            }
            
            if (startIndex === -1) return '';
            
            // Buscar línea de fin (siguiente sección o final)
            for (let i = startIndex + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.match(/^\*\*\d+\./)) {
                    endIndex = i;
                    break;
                } else if (line.includes('**Prompt')) {
                    endIndex = i;
                    break;
                } else if (line.includes('---')) {
                    endIndex = i;
                    break;
                }
            }
            
            if (endIndex === -1) endIndex = lines.length;
            
            // Extraer contenido entre startIndex y endIndex
            const contentLines = lines.slice(startIndex + 1, endIndex);
            let content = contentLines.join('\n').trim();
            
            // Limpiar formato
            content = content.replace(/\*\*/g, '');
            content = content.replace(/^\s*-\s*/, '');
            
            return content;
          };

        const output = completion.choices[0].message.content;
        console.log("\n✨ Tu Guía Espiritual Se Ha Manifestado ✨\n");
        console.log(output);

        const nombreGuia = extractSection(output,1 , "Nombre del guía").replace(/\*\*/g, '');
        console.log("🔮 Nombre del guía extraído:", nombreGuia);

        const formaFisica = extractSection(output,2 , "Forma física");
        console.log("🔮 Forma física extraída:", formaFisica);

        const rasgosDistintivos = extractSection(output,3 , "Rasgos distintivos");
        console.log("🔮 Rasgos distintivos extraídos:", rasgosDistintivos);

        const personalidad = extractSection(output,4 , "Personalidad y forma de comunicarse");
        console.log("🔮 Personalidad extraída:", personalidad);

        const habitatNatural = extractSection(output,5 , "Hábitat o espacio simbólico");
        console.log("🔮 Hábitat natural extraído:", habitatNatural);

        const conexionEspecial = extractSection(output,6 , "Vínculo con el usuario");
        console.log("🔮 Conexión especial extraída:", conexionEspecial);

        // Extraer el prompt de DALL-E del output con mejor precisión
        let dallePromptMatch = output.match(/A mystical .*?(?=\n\n|$)/s);

        if (dallePromptMatch) {
            let dallePrompt = dallePromptMatch[0].trim();

            // Optimizar el prompt para asegurar que cumple con los requisitos
            dallePrompt = optimizarPromptDalle(dallePrompt);

            console.log("\n🎨 Invocando la imagen de tu guía...\n");
            console.log("Prompt optimizado:", dallePrompt);

            const imageResponse = await openai.images.generate({
                model: "dall-e-3",
                prompt: dallePrompt,
                n: 1,
                size: "1024x1024",
                quality: "hd",
                style: "vivid"
            });

            console.log("\n✨ Tu guía espiritual se ha materializado ✨\n");
            console.log("URL de la imagen:", imageResponse.data[0].url);

            // Generar nombres de archivos permanentes
            const nombreImagen = generarNombreArchivo(nombreGuia, "imagen", "png");
            const nombreVideoOriginal = generarNombreArchivo(nombreGuia, "video_original", "mp4");
            const nombreVideoBoomerang = generarNombreArchivo(nombreGuia, "video_boomerang", "mp4");

            // Obtener directorio actual para ES modules
            const __dirname = path.dirname(new URL(import.meta.url).pathname);
            const rutaImagen = path.join(__dirname, nombreImagen);
            const rutaVideoOriginal = path.join(__dirname, nombreVideoOriginal);
            const rutaVideoBoomerang = path.join(__dirname, nombreVideoBoomerang);

            // Array para almacenar rutas de archivos creados
            const archivosCreados = [];

            try {
                // 1. Descargar y guardar la imagen permanentemente
                await descargarImagen(imageResponse.data[0].url, rutaImagen);
                archivosCreados.push(rutaImagen);
                console.log("💾 Imagen guardada como:", nombreImagen);

                console.log("\n⏳ Iniciando animación con Replicate...\n");
                const urlVideo = await animarImagenConReplicate(rutaImagen);

                if (urlVideo) {
                    console.log("\n🎥✨ ¡Tu guía espiritual ha cobrado vida! ✨🎥");
                    console.log("URL del video animado:", urlVideo);

                    // 2. Descargar y guardar el video original
                    await descargarVideo(urlVideo, rutaVideoOriginal);
                    archivosCreados.push(rutaVideoOriginal);
                    console.log("💾 Video original guardado como:", nombreVideoOriginal);

                    // 3. Crear y guardar el video con efecto boomerang
                    console.log("\n🎪 Creando versión boomerang...\n");
                    await crearBoomerang(rutaVideoOriginal, rutaVideoBoomerang);
                    archivosCreados.push(rutaVideoBoomerang);
                    console.log("💾 Video boomerang guardado como:", nombreVideoBoomerang);

                    // Resumen final
                    console.log("\n🎉 ¡Proceso completado exitosamente! 🎉");
                    console.log("\n📁 Archivos guardados:");
                    console.log("📸 Imagen:", nombreImagen);
                    console.log("🎬 Video original:", nombreVideoOriginal);
                    console.log("🎪 Video boomerang:", nombreVideoBoomerang);
                    console.log("\n✨ Todos los archivos están guardados en la carpeta del proyecto ✨");

                } else {
                    console.log("\n❌ No se pudo obtener el video animado de Replicate");
                    console.log("💾 Imagen guardada exitosamente como:", nombreImagen);
                }

            } catch (videoError) {
                console.error("\n❌ Error durante el procesamiento:", videoError.message);
                console.log("\n💾 Archivos creados hasta el momento:");
                archivosCreados.forEach(archivo => {
                    console.log("📁", path.basename(archivo));
                });
            }
        } else {
            console.log("\n❌ No se pudo extraer el prompt para la materialización visual");
        }
    } catch (error) {
        console.error("\n❌ Error en la invocación:", error.message);
    }
}

preguntar();
