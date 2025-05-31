import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { User } from '../users/entities/user.entity';
import { EventStatus } from 'src/common/enums/event-status.enum';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async createEvent(host: User, dto: CreateEventDto): Promise<Event> {
    const event = this.eventRepo.create({
      ...dto,
      host,
    });
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
}
