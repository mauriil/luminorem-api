import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { EmbeddingService } from './services/embedding.service';
import { MemoryIntelligenceService } from './services/memory-intelligence.service';
import { ConversationCoherenceService } from './services/conversation-coherence.service';
import { Conversation, ConversationSchema } from './entities/conversation.entity';
import { Message, MessageSchema } from './entities/message.entity';
import { SpiritualGuide, SpiritualGuideSchema } from '../spiritual-guides/entities/spiritual-guide.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { ExternalServicesModule } from '../external-services/external-services.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: SpiritualGuide.name, schema: SpiritualGuideSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ExternalServicesModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, EmbeddingService, MemoryIntelligenceService, ConversationCoherenceService],
  exports: [ChatService, EmbeddingService, MemoryIntelligenceService, ConversationCoherenceService],
})
export class ChatModule {} 