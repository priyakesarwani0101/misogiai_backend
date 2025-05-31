import { Module } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checkin } from './entities/checkin.entity';
import { EventsModule } from 'src/events/events.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Checkin, Event]),
    EventsModule,
    UsersModule,
  ],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
