// src/announcements/entities/announcement-view.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Announcement } from './announcement.entity';
import { User } from '../../users/entities/user.entity';

@Entity('announcement_views')
@Unique(['announcement_id', 'user_id']) // Un utilisateur ne peut voir qu'une fois la même annonce
export class AnnouncementView {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  announcement_id: number;

  @Column()
  user_id: number;

  @Column()
  tenant_id: number; // Sécurité multi-tenant

  @CreateDateColumn()
  viewed_at: Date;

  // Relations
  @ManyToOne(() => Announcement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'announcement_id' })
  announcement: Announcement;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}