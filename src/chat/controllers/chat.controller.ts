import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Body, 
  Param, 
  Query,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { CreateConversationDto } from '../dto/create-conversation.dto';

// Simular un decorador de autenticación
// En un proyecto real, esto vendría de un módulo de auth
const GetUserId = () => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  // Mock implementation - en producción esto extraería el userId del JWT
  return descriptor;
};

const mockUserId = '684c728322b05f605c23d81e'; // Mock user ID para desarrollo

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Crear una nueva conversación con un guía espiritual' })
  @ApiResponse({ status: 201, description: 'Conversación creada exitosamente' })
  @ApiResponse({ status: 404, description: 'Guía espiritual no encontrado' })
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    // @GetUserId() userId: string // En producción sería así
  ) {
    const userId = mockUserId; // Mock para desarrollo
    const conversation = await this.chatService.createConversation(userId, createConversationDto);
    
    return {
      status: 'success',
      data: conversation,
      message: 'Conversación creada exitosamente'
    };
  }

  @Post('messages')
  @ApiOperation({ summary: 'Enviar un mensaje al guía espiritual' })
  @ApiResponse({ status: 201, description: 'Mensaje enviado y respuesta generada' })
  @ApiResponse({ status: 404, description: 'Conversación o guía no encontrado' })
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    // @GetUserId() userId: string
  ) {
    const userId = mockUserId; // Mock para desarrollo
    const result = await this.chatService.sendMessage(userId, sendMessageDto);
    
    return {
      status: 'success',
      data: {
        userMessage: result.userMessage,
        guideResponse: result.guideResponse
      },
      message: 'Mensaje enviado exitosamente'
    };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Obtener todas las conversaciones del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de conversaciones obtenida exitosamente' })
  async getConversations(
    // @GetUserId() userId: string
  ) {
    const userId = mockUserId; // Mock para desarrollo
    const conversations = await this.chatService.getConversations(userId);
    
    return {
      status: 'success',
      data: conversations,
      message: 'Conversaciones obtenidas exitosamente'
    };
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Obtener todos los mensajes de una conversación' })
  @ApiParam({ name: 'conversationId', description: 'ID de la conversación' })
  @ApiResponse({ status: 200, description: 'Mensajes obtenidos exitosamente' })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  async getMessages(
    @Param('conversationId') conversationId: string,
    // @GetUserId() userId: string
  ) {
    const userId = mockUserId; // Mock para desarrollo
    const messages = await this.chatService.getMessages(userId, conversationId);
    
    return {
      status: 'success',
      data: messages,
      message: 'Mensajes obtenidos exitosamente'
    };
  }

  @Delete('conversations/:conversationId')
  @ApiOperation({ summary: 'Eliminar una conversación y todos sus mensajes' })
  @ApiParam({ name: 'conversationId', description: 'ID de la conversación' })
  @ApiResponse({ status: 200, description: 'Conversación eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    // @GetUserId() userId: string
  ) {
    const userId = mockUserId; // Mock para desarrollo
    await this.chatService.deleteConversation(userId, conversationId);
    
    return {
      status: 'success',
      message: 'Conversación eliminada exitosamente'
    };
  }

  @Get('test')
  @ApiOperation({ summary: 'Endpoint de prueba para verificar que el módulo funciona' })
  @ApiResponse({ status: 200, description: 'Módulo de chat funcionando correctamente' })
  async testEndpoint() {
    return {
      status: 'success',
      message: 'Módulo de chat funcionando correctamente',
      timestamp: new Date().toISOString(),
      features: [
        'Conversaciones con guías espirituales',
        'Embeddings semánticos',
        'Análisis emocional',
        'Contexto conversacional',
        'Respuestas personalizadas'
      ]
    };
  }

  @Post('conversations/:conversationId/regenerate-last')
  @ApiOperation({ summary: 'Regenerar la última respuesta del guía' })
  @ApiParam({ name: 'conversationId', description: 'ID de la conversación' })
  @ApiResponse({ status: 200, description: 'Respuesta regenerada exitosamente' })
  @ApiResponse({ status: 404, description: 'Conversación no encontrada' })
  async regenerateLastResponse(
    @Param('conversationId') conversationId: string,
    // @GetUserId() userId: string
  ) {
    // Esta funcionalidad se puede implementar después
    return {
      status: 'info',
      message: 'Funcionalidad de regeneración disponible próximamente'
    };
  }

  @Get('conversations/:conversationId/summary')
  @ApiOperation({ summary: 'Obtener resumen de una conversación' })
  @ApiParam({ name: 'conversationId', description: 'ID de la conversación' })
  @ApiResponse({ status: 200, description: 'Resumen obtenido exitosamente' })
  async getConversationSummary(
    @Param('conversationId') conversationId: string,
    // @GetUserId() userId: string
  ) {
    // Esta funcionalidad se puede implementar después
    return {
      status: 'info',
      message: 'Funcionalidad de resumen disponible próximamente'
    };
  }
} 