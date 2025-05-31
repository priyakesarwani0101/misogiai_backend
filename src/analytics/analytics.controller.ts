import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('events/:eventId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HOST)
  @Get()
  async getAnalytics(@Param('eventId') eventId: string) {
    return this.analyticsService.getSummary(eventId);
  }
}
