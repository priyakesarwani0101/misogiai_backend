import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('checkin/:eventId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Roles(UserRole.ATTENDEE)
  @Post()
  async checkIn(@CurrentUser() user, @Param('eventId') eventId: string) {
    return this.checkinsService.createCheckin(user, eventId);
  }

  @Roles(UserRole.HOST)
  @Post('walk-in')
  async walkIn(
    @CurrentUser() user,
    @Param('eventId') eventId: string,
    @Body() dto: CreateCheckinDto,
  ) {
    return this.checkinsService.addWalkIn(user, eventId, dto);
  }

  @Roles(UserRole.HOST)
  @Get()
  async list(@Param('eventId') eventId: string) {
    return this.checkinsService.listCheckins(eventId);
  }
}
