import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SpiritualGuide, SpiritualGuideDocument, GenerationStatus } from '../entities/spiritual-guide.entity';
import { CreateSpiritualGuideDto } from '../dto/create-spiritual-guide.dto';
import { UpdateSpiritualGuideDto } from '../dto/update-spiritual-guide.dto';
import { GenerateSpiritualGuideDto } from '../dto/generate-spiritual-guide.dto';
import { OpenAiService } from '../../external-services/services/openai.service';
import { ReplicateService } from '../../external-services/services/replicate.service';
import { FileService } from '../../external-services/services/file.service';

@Injectable()
export class SpiritualGuidesService {
  private readonly logger = new Logger(SpiritualGuidesService.name);

  constructor(
    @InjectModel(SpiritualGuide.name) private spiritualGuideModel: Model<SpiritualGuideDocument>,
    private openAiService: OpenAiService,
    private replicateService: ReplicateService,
    private fileService: FileService,
  ) {}

  async create(createSpiritualGuideDto: CreateSpiritualGuideDto): Promise<SpiritualGuide> {
    const createdGuide = new this.spiritualGuideModel(createSpiritualGuideDto);
    return createdGuide.save();
  }

  async findAll(): Promise<SpiritualGuide[]> {
    return this.spiritualGuideModel.find().populate('userId').exec();
  }

  async findOne(id: string): Promise<SpiritualGuide> {
    const guide = await this.spiritualGuideModel.findById(id).populate('userId').exec();
    if (!guide) {
      throw new NotFoundException(`Spiritual guide with ID ${id} not found`);
    }
    return guide;
  }

  async findByUserId(userId: string): Promise<SpiritualGuide[]> {
    return this.spiritualGuideModel.find({ userId }).populate('userId').exec();
  }

  async update(id: string, updateSpiritualGuideDto: UpdateSpiritualGuideDto): Promise<SpiritualGuide> {
    const updatedGuide = await this.spiritualGuideModel
      .findByIdAndUpdate(id, updateSpiritualGuideDto, { new: true })
      .populate('userId')
      .exec();
    
    if (!updatedGuide) {
      throw new NotFoundException(`Spiritual guide with ID ${id} not found`);
    }
    return updatedGuide;
  }

  async remove(id: string): Promise<void> {
    const result = await this.spiritualGuideModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Spiritual guide with ID ${id} not found`);
    }
  }

  async generateComplete(generateDto: GenerateSpiritualGuideDto): Promise<SpiritualGuide> {
    try {
      this.logger.log('🔮 Iniciando generación de guía espiritual...');
      
      // 1. Generar la descripción del guía espiritual con OpenAI
      const spiritualGuideText = await this.openAiService.generateSpiritualGuide(generateDto.surveyAnswers);
      
      // 2. Extraer información del texto generado
      const extractedInfo = this.extractGuideInfo(spiritualGuideText);
      
      // 3. Extraer el prompt de DALL-E
      const dallePrompt = this.extractDallePrompt(spiritualGuideText);
      
      // 4. Crear la guía espiritual inmediatamente con solo los textos
      const spiritualGuide = await this.create({
        userId: generateDto.userId,
        surveyAnswers: generateDto.surveyAnswers,
        name: extractedInfo.name,
        physicalForm: extractedInfo.physicalForm,
        distinctiveTraits: extractedInfo.distinctiveTraits,
        personality: extractedInfo.personality,
        habitat: extractedInfo.habitat,
        connectionWithUser: extractedInfo.connectionWithUser,
        dallePrompt,
        imageStatus: GenerationStatus.PENDING,
        videoStatus: GenerationStatus.PENDING,
        boomerangStatus: GenerationStatus.PENDING,
        isFullyGenerated: false,
      });

      this.logger.log('✨ Guía espiritual creada con textos, iniciando generación en background...');
      
      // 5. Ejecutar el resto del proceso en background (no await!)
      this.processBackgroundGeneration((spiritualGuide as any)._id.toString())
        .catch(error => {
          this.logger.error('❌ Error en procesamiento background:', error.message);
        });
      
      return spiritualGuide;
      
    } catch (error) {
      this.logger.error('❌ Error en generación inicial:', error.message);
      throw new Error(`Error generating spiritual guide: ${error.message}`);
    }
  }

  // Método para procesar imagen, video y boomerang en background
  private async processBackgroundGeneration(guideId: string): Promise<void> {
    try {
      this.logger.log('🔄 Iniciando procesamiento background para guía:', guideId);
      
      // Obtener la guía
      const guide = await this.findOne(guideId);
      if (!guide || !guide.dallePrompt) {
        throw new Error('Guía no encontrada o sin prompt de DALL-E');
      }

      // Paso 1: Generar imagen
      await this.processImageGeneration(guideId, guide.dallePrompt, guide.name);
      
      // Paso 2: Generar video (solo si la imagen fue exitosa)
      const updatedGuide = await this.findOne(guideId);
      if (updatedGuide.imageStatus === GenerationStatus.COMPLETED && updatedGuide.imageUrl) {
        await this.processVideoGeneration(guideId, updatedGuide.name);
      }
      
      // Paso 3: Generar boomerang (solo si el video fue exitoso)
      const finalGuide = await this.findOne(guideId);
      if (finalGuide.videoStatus === GenerationStatus.COMPLETED && finalGuide.videoUrl) {
        await this.processBoomerangGeneration(guideId, finalGuide.name);
      }
      
      // Marcar como completamente generado si todo salió bien
      const completedGuide = await this.findOne(guideId);
      if (completedGuide.imageStatus === GenerationStatus.COMPLETED && 
          completedGuide.videoStatus === GenerationStatus.COMPLETED && 
          completedGuide.boomerangStatus === GenerationStatus.COMPLETED) {
        await this.update(guideId, { isFullyGenerated: true });
        this.logger.log('🎉 Guía espiritual completamente generada:', guideId);
      }
      
    } catch (error) {
      this.logger.error('❌ Error en procesamiento background:', error.message);
    }
  }

  // Método para generar imagen
  private async processImageGeneration(guideId: string, dallePrompt: string, guideName: string): Promise<void> {
    try {
      this.logger.log('🎨 Generando imagen para guía:', guideId);
      
      // Actualizar status a processing
      await this.update(guideId, { imageStatus: GenerationStatus.PROCESSING });
      
      // Generar imagen con DALL-E
      const imageUrl = await this.openAiService.generateImage(dallePrompt);
      
      // Descargar y guardar la imagen
      const imageFilename = this.fileService.generateFilename(guideName, 'image', 'png');
      await this.fileService.downloadImage(imageUrl, imageFilename);
      
      // Actualizar la guía con la URL de la imagen
      await this.update(guideId, {
        imageUrl: this.fileService.getFileUrl(imageFilename),
        imageStatus: GenerationStatus.COMPLETED,
      });
      
      this.logger.log('✅ Imagen generada exitosamente para guía:', guideId);
      
    } catch (error) {
      this.logger.error('❌ Error generando imagen:', error.message);
      await this.update(guideId, {
        imageStatus: GenerationStatus.FAILED,
        imageError: error.message,
      });
    }
  }

  // Método para generar video
  private async processVideoGeneration(guideId: string, guideName: string): Promise<void> {
    try {
      this.logger.log('🎬 Generando video para guía:', guideId);
      
      // Actualizar status a processing
      await this.update(guideId, { videoStatus: GenerationStatus.PROCESSING });
      
      const guide = await this.findOne(guideId);
      if (!guide.imageUrl) {
        throw new Error('No hay imagen para animar');
      }
      
      // Construir path de la imagen local
      const imageFilename = guide.imageUrl.split('/').pop();
      const imagePath = `uploads/${imageFilename}`;
      
      // Animar imagen con Replicate
      const videoUrl = await this.replicateService.animateImage(imagePath);
      
      // Descargar video
      const videoFilename = this.fileService.generateFilename(guideName, 'video', 'mp4');
      await this.fileService.downloadVideo(videoUrl, videoFilename);
      
      // Actualizar la guía con la URL del video
      await this.update(guideId, {
        videoUrl: this.fileService.getFileUrl(videoFilename),
        videoStatus: GenerationStatus.COMPLETED,
      });
      
      this.logger.log('✅ Video generado exitosamente para guía:', guideId);
      
    } catch (error) {
      this.logger.error('❌ Error generando video:', error.message);
      await this.update(guideId, {
        videoStatus: GenerationStatus.FAILED,
        videoError: error.message,
      });
    }
  }

  // Método para generar boomerang
  private async processBoomerangGeneration(guideId: string, guideName: string): Promise<void> {
    try {
      this.logger.log('🎪 Generando boomerang para guía:', guideId);
      
      // Actualizar status a processing
      await this.update(guideId, { boomerangStatus: GenerationStatus.PROCESSING });
      
      const guide = await this.findOne(guideId);
      if (!guide.videoUrl) {
        throw new Error('No hay video para crear boomerang');
      }
      
      // Construir paths
      const videoFilename = guide.videoUrl.split('/').pop();
      const videoPath = `uploads/${videoFilename}`;
      const boomerangFilename = this.fileService.generateFilename(guideName, 'boomerang', 'mp4');
      const boomerangPath = `uploads/${boomerangFilename}`;
      
      // Crear video boomerang
      await this.fileService.createBoomerang(videoPath, boomerangPath);
      
      // Actualizar la guía con la URL del boomerang
      await this.update(guideId, {
        boomerangVideoUrl: this.fileService.getFileUrl(boomerangFilename),
        boomerangStatus: GenerationStatus.COMPLETED,
      });
      
      this.logger.log('✅ Boomerang generado exitosamente para guía:', guideId);
      
    } catch (error) {
      this.logger.error('❌ Error generando boomerang:', error.message);
      await this.update(guideId, {
        boomerangStatus: GenerationStatus.FAILED,
        boomerangError: error.message,
      });
    }
  }

  // Método para polling del estado (para el frontend)
  async getGenerationStatus(id: string): Promise<{
    guide: SpiritualGuide;
    progress: {
      imageStatus: GenerationStatus;
      videoStatus: GenerationStatus;
      boomerangStatus: GenerationStatus;
      isFullyGenerated: boolean;
      overallProgress: number;
    };
    errors?: {
      imageError?: string;
      videoError?: string;
      boomerangError?: string;
    };
  }> {
    const guide = await this.findOne(id);
    
    // Calcular progreso general
    let completedSteps = 0;
    const totalSteps = 3;
    
    if (guide.imageStatus === GenerationStatus.COMPLETED) completedSteps++;
    if (guide.videoStatus === GenerationStatus.COMPLETED) completedSteps++;
    if (guide.boomerangStatus === GenerationStatus.COMPLETED) completedSteps++;
    
    const overallProgress = Math.round((completedSteps / totalSteps) * 100);
    
    const response = {
      guide,
      progress: {
        imageStatus: guide.imageStatus,
        videoStatus: guide.videoStatus,
        boomerangStatus: guide.boomerangStatus,
        isFullyGenerated: guide.isFullyGenerated,
        overallProgress,
      },
    };
    
    // Agregar errores si existen
    const errors: any = {};
    if (guide.imageError) errors.imageError = guide.imageError;
    if (guide.videoError) errors.videoError = guide.videoError;
    if (guide.boomerangError) errors.boomerangError = guide.boomerangError;
    
    if (Object.keys(errors).length > 0) {
      (response as any).errors = errors;
    }
    
    return response;
  }

  private extractGuideInfo(text: string): any {
    this.logger.debug("🚀 ~ SpiritualGuidesService ~ extractGuideInfo ~ text:", text)
    const extractSection = (titulo: string) => {
      const lines = text.split('\n');
      let startIndex = -1;
      let endIndex = -1;
      
      // Buscar línea de inicio (sin números, solo el título)
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes(`**${titulo}**`)) {
          startIndex = i;
          break;
        }
      }
      
      if (startIndex === -1) return '';
      
      // Buscar línea de fin (siguiente sección o fin del texto)
      for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        // Buscar siguiente sección (que empiece con **) o el prompt de DALL-E
        if (line.startsWith('**') && line.endsWith('**') && line !== `**${titulo}**`) {
          endIndex = i;
          break;
        }
        if (line.includes('**Prompt')) {
          endIndex = i;
          break;
        }
        if (line.includes('---')) {
          endIndex = i;
          break;
        }
      }
      
      if (endIndex === -1) endIndex = lines.length;
      
      const contentLines = lines.slice(startIndex + 1, endIndex);
      let content = contentLines.join('\n').trim();
      
      // Limpiar contenido
      content = content.replace(/\*\*/g, '');
      content = content.replace(/^\s*-\s*/, '');
      
      return content;
    };

    return {
      name: extractSection("Nombre del guía").replace(/\*\*/g, '') || 'Guía Espiritual',
      physicalForm: extractSection("Forma física") || 'Forma física única',
      distinctiveTraits: extractSection("Rasgos distintivos") || 'Rasgos especiales',
      personality: extractSection("Personalidad y forma de comunicarse") || 'Personalidad única',
      habitat: extractSection("Hábitat o espacio simbólico") || 'Espacio sagrado',
      connectionWithUser: extractSection("Vínculo con el usuario") || 'Conexión especial',
    };
  }

  private extractDallePrompt(text: string): string {
    const dallePromptMatch = text.match(/A mystical .*?(?=\n\n|$)/s);
    return dallePromptMatch ? dallePromptMatch[0].trim() : 'A mystical anime-style spirit guide';
  }
} 