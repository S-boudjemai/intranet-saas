import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum NotificationType {
  DOCUMENT_UPLOADED = 'document_uploaded',
  ANNOUNCEMENT_POSTED = 'announcement_posted',
  TICKET_CREATED = 'ticket_created',
  TICKET_COMMENTED = 'ticket_commented',
  TICKET_STATUS_UPDATED = 'ticket_status_updated',
  RESTAURANT_JOINED = 'restaurant_joined',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  tenant_id: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  target_id: string;

  @Column()
  message: string;

  @Column({ default: false })
  is_read: boolean;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
