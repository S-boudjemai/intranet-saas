import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('push_subscriptions')
@Index(['userId', 'endpoint'], { unique: true })
export class PushSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column('text')
  endpoint: string;

  @Column('text', { nullable: true })
  expirationTime: string;

  @Column('text')
  p256dh: string;

  @Column('text')
  auth: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  platform: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}