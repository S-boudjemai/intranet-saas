import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { AuditExecution } from './audit-execution.entity';
import { AuditItem } from './audit-item.entity';
import { User } from '../../users/entities/user.entity';
import { CorrectiveAction } from './corrective-action.entity';

export type NonConformitySeverity = 'low' | 'medium' | 'high' | 'critical';
export type NonConformityStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

@Entity('non_conformities')
export class NonConformity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  execution_id: number;

  @Column()
  item_id: number;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  severity: NonConformitySeverity;

  @Column('text')
  description: string;

  @Column('text', { nullable: true })
  corrective_action: string; // Action corrective recommandée

  @Column({ nullable: true })
  responsible_user_id: number;

  @Column({ nullable: true })
  due_date: Date;

  @Column({
    type: 'enum',
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  })
  status: NonConformityStatus;

  @Column({ nullable: true })
  resolution_date: Date;

  @Column('text', { nullable: true })
  resolution_notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => AuditExecution, execution => execution.non_conformities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'execution_id' })
  execution: AuditExecution;

  @ManyToOne(() => AuditItem, item => item.responses)
  @JoinColumn({ name: 'item_id' })
  item: AuditItem;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'responsible_user_id' })
  responsible_user: User;

  @OneToMany(() => CorrectiveAction, action => action.non_conformity, { cascade: true })
  actions: CorrectiveAction[];
}