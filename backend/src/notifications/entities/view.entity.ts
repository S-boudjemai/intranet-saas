import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ViewTargetType {
  DOCUMENT = 'document',
  ANNOUNCEMENT = 'announcement',
  TICKET = 'ticket',
}

@Entity('views')
export class View {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({
    type: 'enum',
    enum: ViewTargetType,
  })
  target_type: ViewTargetType;

  @Column()
  target_id: number;

  @CreateDateColumn()
  viewed_at: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
