import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rsvp } from './entities/rsvp.entity';
import { Event } from '../events/entities/event.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from 'src/common/enums/user-role.enum';
import { EventsService } from 'src/events/events.service';
import { Checkin } from 'src/checkins/entities/checkin.entity';

@Injectable()
export class RsvpsService {
  constructor(
    @InjectRepository(Rsvp)
    private readonly rsvpRepo: Repository<Rsvp>,

    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly eventsService: EventsService,
  ) {}

  /**
   * Host invites multiple users by creating Rsvp rows with confirmed=false, cancelled=false.
   */
  async inviteUsersToEvent(
    eventId: string,
    userIds: string[],
  ): Promise<Rsvp[]> {
    const event = await this.eventsService.findById(eventId);
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const users = await this.userRepo.findByIds(userIds);
    if (users.length !== userIds.length) {
      const foundIds = users.map((u) => u.id);
      const missing = userIds.filter((id) => !foundIds.includes(id));
      throw new BadRequestException(`Invalid user IDs: ${missing.join(', ')}`);
    }

    const invites: Rsvp[] = [];
    for (const user of users) {
      // Skip if an Rsvp row already exists for this (event, user)
      const existing = await this.rsvpRepo.findOne({
        where: { event: { id: eventId }, attendee: { id: user.id } },
      });
      if (existing) {
        // If they’d previously canceled (existing.cancelled === true),
        // you could “re-invite” by resetting confirmed=false, cancelled=false:
        if (existing.confirmed && existing.cancelled) {
          existing.confirmed = false;
          existing.cancelled = false;
          existing.rsvpDate = null;
          invites.push(await this.rsvpRepo.save(existing));
        }
        // Otherwise, skip (already invited or already actively RSVP’d)
        continue;
      }

      const invite = this.rsvpRepo.create({
        attendee: user,
        event,
        confirmed: false,
        cancelled: false,
        rsvpDate: null,
      });
      invites.push(await this.rsvpRepo.save(invite));
    }

    return invites;
  }

  /**
   * Return all Rsvp rows for userId, each annotated with checkedIn:boolean.
   */
  async getInvitationsForUser(userId: string): Promise<
    Array<{
      rsvpId: string;
      status: 'invited' | 'accepted' | 'cancelled';
      invitedAt: Date;
      rsvpDate: Date | null;
      checkedIn: boolean;
      event: {
        id: string;
        title: string;
        startDateTime: Date;
        location: string | null;
        isVirtual: boolean;
        rsvpDeadline: Date;
        maxAttendees: number;
      };
    }>
  > {
    // Use a query builder to left‐join Checkin on (rsvp.eventId, rsvp.attendeeId)
    const rows = await this.rsvpRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.event', 'e')
      .leftJoin(
        Checkin,
        'c',
        'c."eventId" = r."eventId" AND c."userId" = r."attendeeId"',
      )
      .where('r."attendeeId" = :userId', { userId })
      .select([
        'r.id',
        'r.confirmed',
        'r.cancelled',
        'r.invitedAt',
        'r.rsvpDate',
        'e.id',
        'e.title',
        'e.startDateTime',
        'e.location',
        'e.isVirtual',
        'e.rsvpDeadline',
        'e.maxAttendees',
        'e.checkInEnabled',
        'e.description',
        'c.id', // used to determine if a checkin row exists
      ])
      .orderBy('r.invitedAt', 'DESC')
      .getRawMany();

    // Map each raw row to our DTO with checkedIn = (c.id != null)
    return rows.map((r) => {
      let status: 'invited' | 'accepted' | 'cancelled';
      if (r.r_cancelled) {
        status = 'cancelled';
      } else if (r.r_confirmed) {
        status = 'accepted';
      } else {
        status = 'invited';
      }

      return {
        rsvpId: r.r_id,
        status,
        confirmed: r.r_confirmed,
        cancelled: r.r_cancelled,
        invitedAt: r.r_invitedAt,
        rsvpDate: r.r_rsvpDate,
        checkedIn: r.c_id !== null,
        event: {
          id: r.e_id,
          title: r.e_title,
          startDateTime: r.e_startDateTime,
          location: r.e_location,
          isVirtual: r.e_isVirtual,
          rsvpDeadline: r.e_rsvpDeadline,
          maxAttendees: r.e_maxAttendees,
          checkInEnabled: r.e_checkInEnabled,
          description: r.e_description,
        },
      };
    });
  }

  /**
   * User “accepts” an invitation (i.e. sets confirmed=true, rsvpDate=now, cancelled=false).
   */
  async acceptInvitation(rsvpId: string, userId: string): Promise<Rsvp> {
    const rsvp = await this.rsvpRepo.findOne({
      where: { id: rsvpId },
      relations: ['event', 'attendee'],
    });
    if (!rsvp) {
      throw new NotFoundException('Invitation not found');
    }
    if (rsvp.attendee.id !== userId) {
      throw new BadRequestException('This invitation is not for you.');
    }
    if (rsvp.confirmed && !rsvp.cancelled) {
      throw new BadRequestException('You have already confirmed your RSVP.');
    }

    // Check RSVP deadline
    const now = new Date();
    if (now > rsvp.event.rsvpDeadline) {
      throw new BadRequestException('RSVP deadline has passed.');
    }

    // Check capacity (maxAttendees)
    const confirmedCount = await this.rsvpRepo.count({
      where: {
        event: { id: rsvp.event.id },
        confirmed: true,
        cancelled: false,
      },
    });
    if (confirmedCount >= rsvp.event.maxAttendees) {
      throw new BadRequestException('Event is already full.');
    }

    // Now mark as confirmed, clear cancelled flag, set rsvpDate
    rsvp.confirmed = true;
    rsvp.cancelled = false;
    rsvp.rsvpDate = new Date();
    return this.rsvpRepo.save(rsvp);
  }

  /**
   * User “cancels” their RSVP/invitation:
   * - If they never confirmed (confirmed=false), delete the row entirely.
   * - If they had confirmed (confirmed=true, cancelled=false), set cancelled=true.
   */
  async cancelInvitation(rsvpId: string, userId: string): Promise<Rsvp> {
    const rsvp = await this.rsvpRepo.findOne({
      where: { id: rsvpId },
      relations: ['event', 'attendee'],
    });
    if (!rsvp) {
      throw new NotFoundException('Invitation not found');
    }
    if (rsvp.attendee.id !== userId) {
      throw new BadRequestException('This invitation is not for you.');
    }
    if (rsvp.confirmed && !rsvp.cancelled) {
      throw new BadRequestException('You have already confirmed your RSVP.');
    }

    // Check RSVP deadline
    const now = new Date();
    if (now > rsvp.event.rsvpDeadline) {
      throw new BadRequestException('RSVP deadline has passed.');
    }

    // They had already confirmed—so mark as cancelled
    rsvp.confirmed = false;
    rsvp.cancelled = true;
    rsvp.rsvpDate = new Date();
    return this.rsvpRepo.save(rsvp);
  }

  /**
   * Host views all “active” RSVPs (confirmed = true, cancelled = false) for an event.
   */
  async getConfirmedRsvpsForEvent(eventId: string): Promise<Rsvp[]> {
    return this.rsvpRepo.find({
      where: { event: { id: eventId }, confirmed: true, cancelled: false },
      relations: ['attendee'],
      order: { rsvpDate: 'ASC' },
    });
  }

  /**
   * Return two lists for a given event:
   *  • “invited” = all Rsvp rows for this event (whether confirmed or pending), excluding those that were deleted.
   *  • “uninvited” = all Users with role = ATTENDEE who do NOT have an Rsvp row for this event.
   *
   * If you want to filter out “cancelled” invites from the invited list, just add cancelled: false in the WHERE clause.
   */
  async getInvitesAndUninvitedForEvent(event: any): Promise<
    Array<
      | {
          status: 'invited' | 'accepted' | 'cancelled';
          rsvpId: string;
          invitedAt: Date;
          rsvpDate: Date | null;
          user: {
            id: string;
            name: string;
            email: string;
            timezone: string | null;
          };
        }
      | {
          status: 'uninvited';
          user: {
            id: string;
            name: string;
            email: string;
            timezone: string | null;
          };
        }
    >
  > {
    const eventId = typeof event === 'string' ? event : event.id;

    // 1) Fetch all Rsvp rows for this event (any status).
    const allRsvps = await this.rsvpRepo.find({
      where: { event: { id: eventId } },
      relations: ['attendee'],
      order: { invitedAt: 'ASC' },
    });

    // 2) Build an array of “invited” entries (with status = invited/accepted/cancelled)
    const invitedEntries = allRsvps.map((r) => {
      let status: 'invited' | 'accepted' | 'cancelled';
      if (r.cancelled) {
        status = 'cancelled';
      } else if (r.confirmed) {
        status = 'accepted';
      } else {
        status = 'invited';
      }

      return {
        status,
        rsvpId: r.id,
        invitedAt: r.invitedAt,
        rsvpDate: r.rsvpDate,
        user: {
          id: r.attendee.id,
          name: r.attendee.name,
          email: r.attendee.email,
          timezone: r.attendee.timezone,
        },
      };
    });

    // 3) Collect all invited user IDs
    const invitedUserIds = allRsvps.map((r) => r.attendee.id);

    // 4) Fetch all “inviteable” users (role = ATTENDEE)
    const allAttendees = await this.userRepo.find({
      where: { role: UserRole.ATTENDEE },
      select: ['id', 'name', 'email', 'timezone'],
      order: { name: 'ASC' },
    });

    // 5) Build an array of “uninvited” entries (status = uninvited)
    const uninvitedEntries = allAttendees
      .filter((u) => !invitedUserIds.includes(u.id))
      .map((u) => ({
        status: 'uninvited' as const,
        user: {
          id: u.id,
          name: u.name,
          email: u.email,
          timezone: u.timezone,
        },
      }));

    // 6) Combine both lists into one array
    return [...invitedEntries, ...uninvitedEntries];
  }
}
