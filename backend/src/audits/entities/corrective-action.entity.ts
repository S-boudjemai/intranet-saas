import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type CorrectiveActionStatus =
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'verified';

@Entity('corrective_actions')
export class CorrectiveAction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  non_conformity_id: number;

  @Column('text')
  action_description: string;

  @Column()
  assigned_to: number;

  @Column()
  due_date: Date;

  @Column({
    type: 'enum',
    enum: ['assigned', 'in_progress', 'completed', 'verified'],
    default: 'assigned',
  })
  status: CorrectiveActionStatus;

  @Column({ nullable: true })
  completion_date: Date;

  @Column('text', { nullable: true })
  completion_notes: string;

  @Column('text', { nullable: true })
  verification_notes: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ nullable: true })
  verified_by: number;

  @Column({ nullable: true })
  verification_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assigned_user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifier: User;
}
