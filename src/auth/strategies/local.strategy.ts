import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    // Override the default 'username' field to use 'email'
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Passport attaches the returned user object to request.user
    return user;
  }
}
