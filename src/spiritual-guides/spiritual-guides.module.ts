import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpiritualGuidesController } from './controllers/spiritual-guides.controller';
import { SpiritualGuidesService } from './services/spiritual-guides.service';
import { SpiritualGuide, SpiritualGuideSchema } from './entities/spiritual-guide.entity';
import { ExternalServicesModule } from '../external-services/external-services.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SpiritualGuide.name, schema: SpiritualGuideSchema }]),
    ExternalServicesModule,
  ],
  controllers: [SpiritualGuidesController],
  providers: [SpiritualGuidesService],
  exports: [SpiritualGuidesService],
})
export class SpiritualGuidesModule {} 