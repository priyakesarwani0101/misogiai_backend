import { Module } from '@nestjs/common';
import { RsvpsService } from './rsvps.service';
import { RsvpsController } from './rsvps.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rsvp } from './entities/rsvp.entity';
import { EventsModule } from 'src/events/events.module';
import { UsersModule } from 'src/users/users.module';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rsvp, Event, User]),
    EventsModule,
    UsersModule,
  ],
  providers: [RsvpsService],
  controllers: [RsvpsController],
  exports: [RsvpsService],
})
export class RsvpsModule {}
