import { Module } from '@nestjs/common';
import { OpenAiService } from './services/openai.service';
import { PineconeService } from './services/pinecone.service';
import { FileService } from './services/file.service';
import { ReplicateService } from './services/replicate.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [OpenAiService, PineconeService, ReplicateService, FileService],
  exports: [OpenAiService, PineconeService, ReplicateService, FileService],
})
export class ExternalServicesModule {} 