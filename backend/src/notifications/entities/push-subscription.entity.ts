import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('push_subscriptions')
@Index(['userId', 'endpoint'], { unique: true })
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('integer')
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column('text')
  endpoint: string;

  @Column('text', { nullable: true })
  expirationTime: string | null;

  @Column('text')
  p256dh: string;

  @Column('text')
  auth: string;

  @Column('text', { nullable: true })
  userAgent: string | null;

  @Column('text', { nullable: true })
  platform: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
