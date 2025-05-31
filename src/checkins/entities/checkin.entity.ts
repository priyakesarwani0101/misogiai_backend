// src/checkins/checkin.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

@Entity({ name: 'checkins' })
export class Checkin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.checkins, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  user: User; // Null if it’s a walk-in (no prior RSVP)

  @ManyToOne(() => Event, (event) => event.checkins, {
    onDelete: 'CASCADE',
  })
  event: Event;

  @Column({ type: 'boolean', default: false })
  isWalkIn: boolean;

  @CreateDateColumn()
  checkinTime: Date;
}
