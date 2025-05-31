import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  // Make sure role is typed as the UserRole enum, not a plain string
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  timezone?: string;
}
