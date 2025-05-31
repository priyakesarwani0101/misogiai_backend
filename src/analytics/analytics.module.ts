import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/entities/event.entity';
import { Rsvp } from '../rsvps/entities/rsvp.entity';
import { Checkin } from '../checkins/entities/checkin.entity';
import { Feedback } from '../feedback/entities/feedback.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Event, Rsvp, Checkin, Feedback])],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
