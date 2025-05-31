// src/events/event.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Rsvp } from '../../rsvps/entities/rsvp.entity';
import { Checkin } from '../../checkins/entities/checkin.entity';
import { Feedback } from '../../feedback/entities/feedback.entity';
import { EventStatus } from '../../common/enums/event-status.enum';

@Entity({ name: 'events' })
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamptz' })
  startDateTime: Date;

  @Column({ type: 'timestamptz' })
  rsvpDeadline: Date;

  @Column({ type: 'int', default: 0 })
  maxAttendees: number;

  @Column({ default: false })
  isVirtual: boolean;

  @Column({ length: 300, nullable: true })
  location: string; // If physical, store address. If virtual, store URL.

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.SCHEDULED,
  })
  status: EventStatus; // Scheduled / Live / Closed

  @ManyToOne(() => User, (user) => user.hostedEvents, { onDelete: 'CASCADE' })
  host: User;

  @OneToMany(() => Rsvp, (rsvp) => rsvp.event, { cascade: true })
  rsvps: Rsvp[];

  @OneToMany(() => Checkin, (checkin) => checkin.event, { cascade: true })
  checkins: Checkin[];

  @OneToMany(() => Feedback, (fb) => fb.event, { cascade: true })
  feedbacks: Feedback[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
