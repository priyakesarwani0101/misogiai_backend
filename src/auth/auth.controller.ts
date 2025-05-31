import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    // dto contains name, email, password, role (HOST or ATTENDEE)
    return await this.usersService.create(dto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    // LocalAuthGuard populates req.user
    return this.authService.login(req.user);
  }
}
