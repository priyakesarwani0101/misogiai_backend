import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Checkin } from './entities/checkin.entity';
import { Event } from '../events/entities/event.entity';
import { User } from '../users/entities/user.entity';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Injectable()
export class CheckinsService {
  constructor(
    @InjectRepository(Checkin)
    private readonly checkinRepo: Repository<Checkin>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async createCheckin(user: User, eventId: string): Promise<Checkin> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    // Check if event is LIVE or within allowed window
    const now = new Date();
    if (now < event.startDateTime)
      throw new BadRequestException('Check-In not open yet.');

    // Ensure user has confirmed RSVP (unless walk-in)
    const hasRsvp = await this.checkinRepo.manager
      .getRepository('rsvps')
      .findOne({
        where: {
          attendee: { id: user.id },
          event: { id: eventId },
          confirmed: true,
        },
      });

    if (!hasRsvp) {
      throw new BadRequestException('No confirmed RSVP found.');
    }

    // Prevent duplicate check-in
    const existing = await this.checkinRepo.findOne({
      where: { user: { id: user.id }, event: { id: eventId } },
    });
    if (existing) {
      throw new BadRequestException('Already checked in.');
    }

    const checkin = this.checkinRepo.create({
      user,
      event,
      isWalkIn: false,
    });
    return this.checkinRepo.save(checkin);
  }

  async addWalkIn(
    host: User,
    eventId: string,
    dto: CreateCheckinDto,
  ): Promise<Checkin> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    // Host can mark walk-in regardless of RSVP
    const checkin = this.checkinRepo.create({
      event,
      isWalkIn: true,
      user: null, // because walk-in
    });
    return this.checkinRepo.save(checkin);
  }

  async listCheckins(eventId: string): Promise<Checkin[]> {
    return this.checkinRepo.find({
      where: { event: { id: eventId } },
      relations: ['user'],
    });
  }
}
