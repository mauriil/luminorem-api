import { Injectable, Logger } from '@nestjs/common';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Configurar ffmpeg para usar la versión estática
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

@Injectable()
export class FileService {
  private readonly uploadsDir = 'uploads';
  private readonly logger = new Logger(FileService.name);

  constructor() {
    // Crear directorio de uploads si no existe
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async downloadImage(url: string, filename: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('No se pudo descargar la imagen');
      }

      const filePath = path.join(this.uploadsDir, filename);
      const fileStream = fs.createWriteStream(filePath);

      await new Promise<void>((resolve, reject) => {
        response.body.pipe(fileStream);
        response.body.on('error', reject);
        fileStream.on('finish', () => resolve());
      });

      return filePath;
    } catch (error) {
      throw new Error(`Error descargando imagen: ${error.message}`);
    }
  }

  async downloadVideo(videoUrl: string, filename: string): Promise<void> {
    try {
      this.logger.log("📥 Descargando video...");
      
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Error al descargar video: ${response.status} ${response.statusText}`);
      }

      const buffer = await response.buffer();
      const filePath = path.join(this.uploadsDir, filename);
      
      await fs.promises.writeFile(filePath, buffer);
      
      this.logger.log("✅ Video descargado exitosamente");
    } catch (error) {
      throw new Error(`Error downloading video: ${error.message}`);
    }
  }

  async createBoomerang(inputPath: string, outputPath: string): Promise<void> {
    try {
      this.logger.log("🎪 Creando efecto boomerang...");
      
      return new Promise((resolve, reject) => {
        const command = ffmpeg(inputPath)
          .complexFilter([
            '[0:v]reverse[r]',
            '[0:v][r]concat=n=2:v=1[out]'
          ])
          .outputOptions(['-map', '[out]'])
          .output(outputPath);

        this.logger.log("🔧 Procesando video con FFmpeg...");
        
        command.on('progress', (progress) => {
          if (progress.percent) {
            this.logger.debug(`⏳ Progreso: ${Math.round(progress.percent)}%`);
          }
        });

        command.on('end', () => {
          this.logger.log("✅ Efecto boomerang creado exitosamente");
          resolve();
        });

        command.on('error', (error) => {
          reject(new Error(`Error creating boomerang: ${error.message}`));
        });

        command.run();
      });
    } catch (error) {
      throw new Error(`Error creating boomerang: ${error.message}`);
    }
  }

  generateFilename(guideName: string, type: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const cleanName = guideName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${cleanName}_${type}_${timestamp}.${extension}`;
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadsDir, filename);
      await fs.promises.unlink(filePath);
      this.logger.log("🧹 Archivo eliminado:", filePath);
    } catch (error) {
      this.logger.warn("⚠️ No se pudo eliminar archivo:", error.message);
    }
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
} 