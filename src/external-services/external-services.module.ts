import { Module } from '@nestjs/common';
import { OpenAiService } from './services/openai.service';
import { FileService } from './services/file.service';
import { ReplicateService } from './services/replicate.service';

@Module({
  providers: [OpenAiService, ReplicateService, FileService],
  exports: [OpenAiService, ReplicateService, FileService],
})
export class ExternalServicesModule {} 