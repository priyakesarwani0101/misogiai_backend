import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { RsvpsModule } from './rsvps/rsvps.module';
import { CheckinsModule } from './checkins/checkins.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { MailModule } from './mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    EventsModule,
    RsvpsModule,
    CheckinsModule,
    FeedbackModule,
    AnalyticsModule,
    MailModule,
  ],
})
export class AppModule {}
