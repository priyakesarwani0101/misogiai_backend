import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { FeedbackType } from '../common/enums/feedback-type.enum';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async createFeedback(
    user: User,
    eventId: string,
    dto: CreateFeedbackDto,
  ): Promise<Feedback> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    if (event.status !== 'LIVE') {
      throw new BadRequestException('Event is not live.');
    }

    // Validate emoji vs text
    let type = FeedbackType.TEXT;
    if (dto.emoji) {
      type = FeedbackType.EMOJI;
    }

    const fb = this.feedbackRepo.create({
      user,
      event,
      type,
      content: dto.emoji || dto.comment,
    });
    return this.feedbackRepo.save(fb);
  }

  async pinFeedback(host: User, feedbackId: string): Promise<Feedback> {
    const fb = await this.feedbackRepo.findOne({
      where: { id: feedbackId },
      relations: ['event', 'event.host'],
    });
    if (!fb) throw new NotFoundException('Feedback not found');
    if (fb.event.host.id !== host.id)
      throw new BadRequestException('Not your event feedback.');

    fb.pinned = true;
    return this.feedbackRepo.save(fb);
  }

  async flagFeedback(host: User, feedbackId: string): Promise<Feedback> {
    const fb = await this.feedbackRepo.findOne({
      where: { id: feedbackId },
      relations: ['event', 'event.host'],
    });
    if (!fb) throw new NotFoundException('Feedback not found');
    if (fb.event.host.id !== host.id)
      throw new BadRequestException('Not your event feedback.');

    fb.flagged = true;
    return this.feedbackRepo.save(fb);
  }

  async listFeedback(
    eventId: string,
    filter?: { type?: FeedbackType },
  ): Promise<Feedback[]> {
    const query = this.feedbackRepo
      .createQueryBuilder('fb')
      .where('fb.eventId = :eid', { eid: eventId });

    if (filter?.type) {
      query.andWhere('fb.type = :type', { type: filter.type });
    }

    return query.orderBy('fb.createdAt', 'DESC').getMany();
  }
}
