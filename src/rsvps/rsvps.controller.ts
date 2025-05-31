// src/rsvps/rsvps.controller.ts

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { RsvpsService } from './rsvps.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { EventsService } from 'src/events/events.service';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('rsvps')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RsvpsController {
  constructor(
    private readonly rsvpsService: RsvpsService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Host invites users (create “pending” RSVP rows).
   * POST /rsvps/invite
   * Body: { eventId: string, userIds: string[] }
   */

  @Roles(UserRole.HOST)
  @Post('invite')
  async inviteUsers(@Body() dto: CreateInvitationDto) {
    return this.rsvpsService.inviteUsersToEvent(dto.eventId, dto.attendeeIds);
  }

  /**
   * Any authenticated user sees all of their invitations (pending, confirmed, or canceled).
   * GET /rsvps/me
   */

  @Get('me')
  async getMyInvitations(@Request() req) {
    const userId = req.user.id;
    return this.rsvpsService.getInvitationsForUser(userId);
  }

  /**
   * User accepts their invitation (RSVP):
   * PATCH /rsvps/:id/accept
   */

  @Patch(':id/accept')
  async acceptInvite(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.rsvpsService.acceptInvitation(id, userId);
  }

  /**
   * User cancels their invitation or active RSVP:
   * DELETE /rsvps/:id
   */

  @Delete(':id')
  async cancelInvite(@Param('id') id: string, @Request() req) {
    const userId = req.user.id;
    return this.rsvpsService.cancelInvitation(id, userId);
  }

  /**
   * Host views all active RSVPs for a given event (only confirmed, not canceled):
   * GET /rsvps/event/:eventId/confirmed
   */

  @Roles(UserRole.HOST)
  @Get('event/:eventId/confirmed')
  async getConfirmedForEvent(@Param('eventId') eventId: string) {
    return this.rsvpsService.getConfirmedRsvpsForEvent(eventId);
  }

  /**
   * GET /rsvps/event/:eventId/manage
   * Returns { invited: [...], uninvited: [...] } for the given event.
   * Only the host of that event may call it.
   */

  @Roles(UserRole.HOST)
  @Get('event/:eventId')
  async manageEventInvites(@Param('eventId') eventId: string, @Request() req) {
    // 1) Verify the event exists and we can fetch its host
    const event = await this.eventsService.findById(eventId);
    if (event.host.id !== req.user.id) {
      // If the logged‐in user is not the host of this event, forbid access
      throw new ForbiddenException('You are not the host of this event.');
    }

    // 2) Delegate to the service method we just wrote
    return this.rsvpsService.getInvitesAndUninvitedForEvent(event);
  }
}
