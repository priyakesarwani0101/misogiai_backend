import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Event]), UsersModule],
  providers: [EventsService],
  controllers: [EventsController],
  exports: [EventsService, TypeOrmModule.forFeature([Event])],
})
export class EventsModule {}
