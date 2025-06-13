import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fetch from 'node-fetch';
import * as fs from 'fs';

interface ReplicatePrediction {
  id: string;
  status: string;
  output?: string | string[];
  error?: string;
  urls: {
    get: string;
  };
  logs?: string;
}

@Injectable()
export class ReplicateService {
  private readonly logger = new Logger(ReplicateService.name);
  private replicateToken: string;

  constructor(private configService: ConfigService) {
    this.replicateToken = this.configService.get<string>('REPLICATE_TOKEN');
  }

  async animateImage(imagePath: string): Promise<string> {
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');

    const body = {
      input: {
        image: `data:image/png;base64,${imageBase64}`,
        prompt: "Animate subtle breathing and gentle tail sway for this single mystical anime-style spirit guide. Keep the motion slow, calm, and rhythmic, like inhaling and exhaling in a quiet forest. Should loop seamlessly, no jumps or unnatural movements, preserving the creature centered and majestic. Emphasize soft, organic motion only — no modern or mechanical effects."
      }
    };

    try {
      // Iniciar la predicción
      this.logger.log("📡 Enviando imagen a Replicate para animación...");
      const response = await fetch('https://api.replicate.com/v1/models/wavespeedai/wan-2.1-i2v-480p/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.replicateToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al enviar a Replicate (${response.status}): ${errorText}`);
      }

      const prediction = await response.json() as ReplicatePrediction;
      this.logger.log("🔄 Predicción iniciada. ID:", prediction.id);
      this.logger.log("⏳ Estado actual:", prediction.status);

      // Si ya está completada (raro pero posible)
      if (prediction.status === 'succeeded' && prediction.output) {
        this.logger.log("✅ Video completado inmediatamente!");
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

        this.logger.log(`🔄 Verificando progreso... (${intentos}/${maxIntentos}) ID: ${prediction.id}`);

        const pollResponse = await fetch(pollUrl, {
          headers: { 'Authorization': `Bearer ${this.replicateToken}` }
        });

        if (!pollResponse.ok) {
          throw new Error(`Error al verificar estado: ${pollResponse.status}`);
        }

        const pollData = await pollResponse.json() as ReplicatePrediction;
        // this.logger.log("📊 Estado:", pollData.status);

        if (pollData.status === 'succeeded') {
          this.logger.log("✅ ¡Animación completada con éxito!");
          const videoUrl = Array.isArray(pollData.output) ? pollData.output[0] : pollData.output;

          if (!videoUrl) {
            throw new Error('La animación se completó pero no se obtuvo URL del video');
          }

          return videoUrl;
        }

        if (pollData.status === 'failed') {
          throw new Error(`La animación falló: ${pollData.error || 'Error desconocido'}`);
        }

        // Filtrar y limpiar logs de progreso si están disponibles
        if (pollData.logs) {
          const filteredLogs = this.filterProgressLogs(pollData.logs);
          if (filteredLogs) {
            this.logger.debug("📝 Progreso de animación:", filteredLogs);
          }
        }
      }

      throw new Error('Timeout: La animación tardó demasiado en completarse');

    } catch (error) {
      this.logger.error("❌ Error en animación:", error.message);
      throw error;
    }
  }

  /**
   * Filtra y limpia los logs de progreso de Replicate para mostrar solo información útil
   */
  private filterProgressLogs(logs: string): string | null {
    if (!logs) return null;
    
    // Extraer solo las últimas líneas relevantes
    const lines = logs.split('\n');
    const lastLines = lines.slice(-10); // Últimas 10 líneas
    
    // Filtrar líneas que contienen información útil (sin barras de progreso desordenadas)
    const filteredLines = lastLines.filter(line => {
      const trimmedLine = line.trim();
      // Filtrar líneas de progreso con barras y porcentajes desordenados
      if (trimmedLine.match(/^\d+%\|[█▋▊▌▍▎▏\s]+\|/)) {
        return false;
      }
      // Mantener líneas con información útil
      if (trimmedLine.includes('Processing') || 
          trimmedLine.includes('Generating') || 
          trimmedLine.includes('Completed') ||
          trimmedLine.includes('Error') ||
          trimmedLine.includes('Warning')) {
        return true;
      }
      return false;
    });
    
    return filteredLines.length > 0 ? filteredLines.join(' | ') : null;
  }
} 