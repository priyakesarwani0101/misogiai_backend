import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users/me
   * Returns the current authenticated user's profile.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: User): Promise<UserResponseDto> {
    // The CurrentUser decorator will populate `user` from the JWT
    return new UserResponseDto({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      timezone: user.timezone,
    });
  }

  /**
   * PUT /users/me
   * Allows the authenticated user to update their own profile (name/timezone).
   */
  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateMe(
    @CurrentUser() user: User,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updated = await this.usersService.updateProfile(user.id, updateDto);
    return new UserResponseDto({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      timezone: updated.timezone,
    });
  }
}
