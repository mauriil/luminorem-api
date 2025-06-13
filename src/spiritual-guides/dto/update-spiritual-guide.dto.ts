import { PartialType } from '@nestjs/swagger';
import { CreateSpiritualGuideDto } from './create-spiritual-guide.dto';

export class UpdateSpiritualGuideDto extends PartialType(CreateSpiritualGuideDto) {} 