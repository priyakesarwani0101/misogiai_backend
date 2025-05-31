import { PartialType } from '@nestjs/swagger';
import { CreateEventDto } from './create-event.dto';
import { EventStatus } from 'src/common/enums/event-status.enum';
import { IsEnum } from 'class-validator';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsEnum(EventStatus)
  status: EventStatus;
}
