import { PartialType } from '@nestjs/swagger';
import { CreateRsvpDto } from './create-rsvp.dto';

export class UpdateRsvpDto extends PartialType(CreateRsvpDto) {}
