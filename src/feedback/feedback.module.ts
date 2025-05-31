import { Module } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feedback } from './entities/feedback.entity';
import { EventsModule } from 'src/events/events.module';
import { UsersModule } from 'src/users/users.module';
import { Event } from 'src/events/entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Feedback, Event]),
    EventsModule,
    UsersModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
