import { IsNotEmpty, IsUUID, ArrayNotEmpty, IsArray } from 'class-validator';

export class CreateInvitationDto {
  @IsNotEmpty()
  @IsUUID()
  eventId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  attendeeIds: string[];
}
