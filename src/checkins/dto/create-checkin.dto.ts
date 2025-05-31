import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateCheckinDto {
  @IsNotEmpty() @IsString() name: string;
  @IsNotEmpty() @IsEmail() email: string;
}
