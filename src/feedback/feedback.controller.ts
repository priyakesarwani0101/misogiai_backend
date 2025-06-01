import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Get,
  Query,
  Patch,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Controller('feedback/:eventId/')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ATTENDEE)
  @Post()
  async create(
    @CurrentUser() user,
    @Param('eventId') eventId: string,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.createFeedback(user, eventId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HOST)
  @Patch(':feedbackId/pin')
  async pin(@Param('feedbackId') feedbackId: string, @CurrentUser() user) {
    return this.feedbackService.pinFeedback(user, feedbackId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.HOST)
  @Patch(':feedbackId/flag')
  async flag(@Param('feedbackId') feedbackId: string, @CurrentUser() user) {
    return this.feedbackService.flagFeedback(user, feedbackId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async list(
    @Param('eventId') eventId: string,
    @Query('type') type: 'EMOJI' | 'TEXT',
  ) {
    return this.feedbackService.listFeedback(eventId, {
      type: type as any,
    });
  }
}
