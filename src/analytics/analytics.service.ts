import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { Rsvp } from '../rsvps/entities/rsvp.entity';
import { Checkin } from '../checkins/entities/checkin.entity';
import { Feedback } from '../feedback/entities/feedback.entity';
import { FeedbackType } from 'src/common/enums/feedback-type.enum';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(Rsvp)
    private readonly rsvpRepo: Repository<Rsvp>,
    @InjectRepository(Checkin)
    private readonly checkinRepo: Repository<Checkin>,
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
  ) {}

  async getSummary(eventId: string) {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    // 1. Total RSVPs (confirmed)
    const totalRsvps = await this.rsvpRepo.count({
      where: { event: { id: eventId }, confirmed: true },
    });

    // 2. Total Check-Ins
    const totalCheckIns = await this.checkinRepo.count({
      where: { event: { id: eventId } },
    });

    // 3. Feedback volume over time (aggregate by minute)
    //   Query Feedback createdAt counts grouped by minute offset from event start
    const feedbackVolume = await this.feedbackRepo
      .createQueryBuilder('fb')
      .select("date_trunc('minute', fb.createdAt) as minute", 'minute')
      .addSelect('COUNT(*)', 'count')
      .where('fb.eventId = :eid', { eid: eventId })
      .groupBy('minute')
      .orderBy('minute', 'ASC')
      .getRawMany();

    // 4. Top 3 Emoji Reactions
    const topEmojisRaw = await this.feedbackRepo
      .createQueryBuilder('fb')
      .select('fb.content', 'emoji')
      .addSelect('COUNT(*)', 'count')
      .where("fb.type = 'EMOJI' AND fb.eventId = :eid", { eid: eventId })
      .groupBy('fb.content')
      .orderBy('count', 'DESC')
      .limit(3)
      .getRawMany();

    // 5. Common feedback keywords (simple approach: split text, count frequencies)
    // Note: PostgreSQL full‐text or simple splitting in JS after fetch
    const allTextFeedbacks = await this.feedbackRepo.find({
      where: { event: { id: eventId }, type: FeedbackType.TEXT },
      select: ['content'],
    });
    const keywordCounts = this.extractTopKeywords(
      allTextFeedbacks.map((f) => f.content),
      10,
    );

    return {
      totalRsvps,
      totalCheckIns,
      feedbackVolume, // [ { minute: '2025-05-30 14:22:00', count: '5' }, … ]
      topEmojis: topEmojisRaw, // [ { emoji: '👍', count: '12' }, … ]
      topKeywords: keywordCounts, // e.g. [ { word: 'great', count: 5 }, … ]
    };
  }

  private extractTopKeywords(
    contents: string[],
    topN: number,
  ): { word: string; count: number }[] {
    const frequency: Record<string, number> = {};
    contents.forEach((text) => {
      text
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .forEach((word) => {
          if (word.length <= 2) return;
          frequency[word] = (frequency[word] || 0) + 1;
        });
    });
    const sorted = Object.entries(frequency)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topN);
    return sorted;
  }
}
