import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsDateString()
  startDateTime: string;

  @IsNotEmpty()
  @IsDateString()
  rsvpDeadline: string;

  @IsOptional()
  @IsBoolean()
  isVirtual: boolean = false;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  maxAttendees: number;
}
