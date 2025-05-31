import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

@Entity({ name: 'rsvps' })
export class Rsvp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.rsvps, {
    onDelete: 'CASCADE',
  })
  attendee: User;

  @ManyToOne(() => Event, (event) => event.rsvps, {
    onDelete: 'CASCADE',
  })
  event: Event;

  @Column({ type: 'boolean', default: false })
  confirmed: boolean;
  // false = invited but not yet RSVP’d
  // true  = user has accepted (RSVP’d)

  @Column({ type: 'boolean', default: false })
  cancelled: boolean;
  // false = no cancellation
  // true  = user has actively canceled their RSVP

  @CreateDateColumn()
  invitedAt: Date;
  // when the host created this invitation

  @Column({ type: 'timestamptz', nullable: true })
  rsvpDate: Date | null;
  // when the user clicked “Accept & RSVP”; stays null if never confirmed

  @UpdateDateColumn()
  updatedAt: Date;
}
