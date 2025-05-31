// src/feedback/feedback.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { FeedbackType } from '../../common/enums/feedback-type.enum';

@Entity({ name: 'feedbacks' })
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.feedbacks, {
    onDelete: 'SET NULL',
  })
  user: User; // Null if anonymous feedback is allowed (optional)

  @ManyToOne(() => Event, (event) => event.feedbacks, {
    onDelete: 'CASCADE',
  })
  event: Event;

  @Column({
    type: 'enum',
    enum: FeedbackType,
    default: FeedbackType.TEXT,
  })
  type: FeedbackType; // TEXT or EMOJI

  @Column({ type: 'text' })
  content: string; // For emoji: store “👍” or “❤️”, etc. For text: store the comment.

  @Column({ default: false })
  pinned: boolean;

  @Column({ default: false })
  flagged: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
