// src/users/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Event } from '../../events/entities/event.entity';
import { Rsvp } from '../../rsvps/entities/rsvp.entity';
import { Feedback } from '../../feedback/entities/feedback.entity';
import { Checkin } from '../../checkins/entities/checkin.entity';
import { UserRole } from '../../common/enums/user-role.enum';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ATTENDEE,
  })
  role: UserRole;

  @Column({ nullable: true })
  timezone: string;

  @OneToMany(() => Event, (event) => event.host)
  hostedEvents: Event[];

  @OneToMany(() => Rsvp, (rsvp) => rsvp.attendee)
  rsvps: Rsvp[];

  @OneToMany(() => Checkin, (checkin) => checkin.user)
  checkins: Checkin[];

  @OneToMany(() => Feedback, (fb) => fb.user)
  feedbacks: Feedback[];

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    const saltRounds = 10;
    // bcrypt.hash returns Promise<string>
    const hashed: string = await bcrypt.hash(this.password, saltRounds);
    this.password = hashed;
  }
}
