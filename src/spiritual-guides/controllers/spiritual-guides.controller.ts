import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SpiritualGuidesService } from '../services/spiritual-guides.service';
import { CreateSpiritualGuideDto } from '../dto/create-spiritual-guide.dto';
import { UpdateSpiritualGuideDto } from '../dto/update-spiritual-guide.dto';
import { GenerateSpiritualGuideDto } from '../dto/generate-spiritual-guide.dto';

@ApiTags('spiritual-guides')
@Controller('spiritual-guides')
export class SpiritualGuidesController {
  constructor(private readonly spiritualGuidesService: SpiritualGuidesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new spiritual guide manually' })
  @ApiResponse({ status: 201, description: 'Spiritual guide created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createSpiritualGuideDto: CreateSpiritualGuideDto) {
    return this.spiritualGuidesService.create(createSpiritualGuideDto);
  }

  @Post('generate')
  @ApiOperation({ 
    summary: 'Generate complete spiritual guide from survey answers',
    description: 'Creates a spiritual guide with text content immediately and processes image/video generation in background. Returns the guide with text content and status fields for polling.'
  })
  @ApiResponse({ status: 201, description: 'Spiritual guide created with text content. Image/video generation started in background.' })
  @ApiResponse({ status: 400, description: 'Invalid survey data' })
  @ApiResponse({ status: 500, description: 'Error during generation process' })
  async generateComplete(@Body() generateDto: GenerateSpiritualGuideDto) {
    return this.spiritualGuidesService.generateComplete(generateDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all spiritual guides' })
  @ApiResponse({ status: 200, description: 'Spiritual guides retrieved successfully' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.spiritualGuidesService.findByUserId(userId);
    }
    return this.spiritualGuidesService.findAll();
  }

  @Get(':id/status')
  @ApiOperation({ 
    summary: 'Get generation status of a spiritual guide',
    description: 'Returns the current generation status including progress for image, video, and boomerang generation. Use this endpoint for polling until isFullyGenerated is true.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Generation status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        guide: { type: 'object', description: 'Complete spiritual guide object' },
        progress: {
          type: 'object',
          properties: {
            imageStatus: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
            videoStatus: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
            boomerangStatus: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
            isFullyGenerated: { type: 'boolean' },
            overallProgress: { type: 'number', description: 'Progress percentage (0-100)' }
          }
        },
        errors: {
          type: 'object',
          description: 'Error details if any step failed',
          properties: {
            imageError: { type: 'string' },
            videoError: { type: 'string' },
            boomerangError: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Spiritual guide not found' })
  getGenerationStatus(@Param('id') id: string) {
    return this.spiritualGuidesService.getGenerationStatus(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get spiritual guide by ID' })
  @ApiResponse({ status: 200, description: 'Spiritual guide found' })
  @ApiResponse({ status: 404, description: 'Spiritual guide not found' })
  findOne(@Param('id') id: string) {
    return this.spiritualGuidesService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all spiritual guides for a specific user' })
  @ApiResponse({ status: 200, description: 'User spiritual guides retrieved successfully' })
  findByUserId(@Param('userId') userId: string) {
    return this.spiritualGuidesService.findByUserId(userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update spiritual guide by ID' })
  @ApiResponse({ status: 200, description: 'Spiritual guide updated successfully' })
  @ApiResponse({ status: 404, description: 'Spiritual guide not found' })
  update(@Param('id') id: string, @Body() updateSpiritualGuideDto: UpdateSpiritualGuideDto) {
    return this.spiritualGuidesService.update(id, updateSpiritualGuideDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete spiritual guide by ID' })
  @ApiResponse({ status: 204, description: 'Spiritual guide deleted successfully' })
  @ApiResponse({ status: 404, description: 'Spiritual guide not found' })
  remove(@Param('id') id: string) {
    return this.spiritualGuidesService.remove(id);
  }
} 