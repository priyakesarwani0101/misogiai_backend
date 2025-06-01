import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { User } from '../users/entities/user.entity';
import { EventStatus } from 'src/common/enums/event-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  /**
   * Create a new event. If startDateTime is “today” (UTC), set checkInEnabled = true.
   */
  async createEvent(host: User, dto: CreateEventDto): Promise<Event> {
    // 1) Parse the incoming ISO string / Date from the DTO
    const start = new Date(dto.startDateTime);

    // 2) Extract UTC Y/M/D for “now” and for the event’s start
    const now = new Date();
    const nowY = now.getUTCFullYear();
    const nowM = now.getUTCMonth();
    const nowD = now.getUTCDate();

    const sy = start.getUTCFullYear();
    const sm = start.getUTCMonth();
    const sd = start.getUTCDate();

    // 3) Compute a boolean: is the event’s UTC‐date equal to today’s UTC‐date?
    const isToday = nowY === sy && nowM === sm && nowD === sd;

    // 4) Create the Event entity, injecting checkInEnabled accordingly
    const event = this.eventRepo.create({
      ...dto, // title, description, startDateTime, etc.
      host, // the User object of the creator
      checkInEnabled: isToday, // true if startDateTime is today (UTC)
    });

    // 5) Save to database
    return await this.eventRepo.save(event);
  }

  async findAllByHost(hostId: string): Promise<Event[]> {
    return this.eventRepo.find({ where: { host: { id: hostId } } });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: ['host', 'rsvps', 'checkins', 'feedbacks'],
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async updateEvent(
    eventId: string,
    host: User,
    dto: UpdateEventDto,
  ): Promise<Event> {
    const event = await this.findOne(eventId);
    if (event.host.id !== host.id)
      throw new ForbiddenException('Not your event');
    Object.assign(event, dto);
    return this.eventRepo.save(event);
  }

  async deleteEvent(eventId: string, host: User): Promise<void> {
    const event = await this.findOne(eventId);
    if (event.host.id !== host.id)
      throw new ForbiddenException('Not your event');
    await this.eventRepo.delete(eventId);
  }

  // Optional: method to set status=LIVE when startDateTime <= now
  async markLiveEvents() {
    await this.eventRepo
      .createQueryBuilder()
      .update(Event)
      .set({ status: EventStatus.LIVE })
      .where('startDateTime <= :now AND status = :scheduled', {
        now: new Date(),
        scheduled: 'SCHEDULED',
      })
      .execute();
  }

  /**
   * Find an event by ID, including its `host` relation.
   * Throws NotFoundException if not found.
   */
  async findById(eventId: string): Promise<Event> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['host'],
    });
    if (!event) {
      throw new NotFoundException(`Event with id ${eventId} not found.`);
    }
    return event;
  }

  /**
   * Every minute, find all events that are still SCHEDULED
   * whose startDateTime <= now, and mark them LIVE.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async markScheduledEventsAsLive() {
    const now = new Date();

    // Find all events with status = SCHEDULED and startDateTime <= now
    const toActivate = await this.eventRepo.find({
      where: {
        status: EventStatus.SCHEDULED,
        startDateTime: LessThanOrEqual(now),
      },
    });

    if (toActivate.length > 0) {
      this.logger.log(`Marking ${toActivate.length} event(s) as LIVE`);
    }

    for (const ev of toActivate) {
      ev.status = EventStatus.LIVE;
      ev.checkInEnabled = true; // Enable check-in when event goes live
      await this.eventRepo.save(ev);
      this.logger.log(`Event ${ev.id} is now LIVE`);
    }
  }

  /**
   * (Optional) Every minute, find all events that are LIVE
   * whose startDateTime + duration <= now, and mark them CLOSED.
   * If you don’t track duration, you could close based on a fixed offset:
   * e.g. if (now > ev.startDateTime + 2 hours) then close.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async closeLiveEvents() {
    const now = new Date();

    // Example: if we close 1 hour after start
    // We can’t do the date math in a TypeORM query easily, so:
    const liveEvents = await this.eventRepo.find({
      where: { status: EventStatus.LIVE },
    });

    for (const ev of liveEvents) {
      const oneHourAfterStart = new Date(
        ev.startDateTime.getTime() + 60 * 60 * 1000,
      );
      if (now >= oneHourAfterStart) {
        ev.status = EventStatus.CLOSED;
        ev.checkInEnabled = false;
        await this.eventRepo.save(ev);
        this.logger.log(`Event ${ev.id} is now CLOSED`);
      }
    }
  }

  /**
   * Every day at 00:00 UTC, enable checkInEnabled = true
   * for any event whose startDateTime’s UTC date is today.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async enableTodayCheckIns() {
    const now = new Date();
    const utcYear = now.getUTCFullYear();
    const utcMonth = now.getUTCMonth();
    const utcDate = now.getUTCDate();

    // We want all events where the UTC calendar date of startDateTime equals (year, month, date)
    // TypeORM can’t directly compare date‐only in a query, so fetch candidates whose startDateTime
    // is between 00:00:00 and 23:59:59 UTC of today, then update them in a loop.

    // Compute today's UTC boundaries:
    const utcDayStart = new Date(Date.UTC(utcYear, utcMonth, utcDate, 0, 0, 0));
    const utcDayEnd = new Date(
      Date.UTC(utcYear, utcMonth, utcDate, 23, 59, 59, 999),
    );

    // Find all events scheduled to start sometime today (UTC).
    const toEnable = await this.eventRepo.find({
      where: {
        startDateTime: Between(utcDayStart, utcDayEnd),
      },
    });

    if (toEnable.length) {
      this.logger.log(
        `Enabling check-in for ${toEnable.length} event(s) today.`,
      );
      for (const ev of toEnable) {
        ev.checkInEnabled = true;
        await this.eventRepo.save(ev);
        this.logger.log(`Event ${ev.id} checkInEnabled = true`);
      }
    }
  }
}
