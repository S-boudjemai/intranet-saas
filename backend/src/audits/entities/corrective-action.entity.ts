// src/audits/entities/corrective-action.entity.ts
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
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { AuditExecution } from './audit-execution.entity';

export enum ActionCategory {
  EQUIPMENT_REPAIR = 'equipment_repair',
  STAFF_TRAINING = 'staff_training',
  CLEANING_DISINFECTION = 'cleaning_disinfection',
  PROCESS_IMPROVEMENT = 'process_improvement',
  COMPLIANCE_ISSUE = 'compliance_issue',
  OTHER = 'other'
}

export enum ActionStatus {
  CREATED = 'created',
  VALIDATED = 'validated',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  VERIFIED = 'verified',
  ARCHIVED = 'archived'
}

export enum ActionPriority {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('corrective_actions')
export class CorrectiveAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ActionCategory,
    default: ActionCategory.OTHER
  })
  category: ActionCategory;

  @Column({
    type: 'enum',
    enum: ActionStatus,
    default: ActionStatus.CREATED
  })
  status: ActionStatus;

  @Column({
    type: 'enum',
    enum: ActionPriority,
    default: ActionPriority.MEDIUM
  })
  priority: ActionPriority;

  @Column({ type: 'timestamp' })
  due_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Column({ type: 'text', nullable: true })
  completion_notes?: string;

  @Column({ type: 'text', nullable: true })
  validation_notes?: string;

  @Column({ default: false })
  email_sent: boolean; // Email auto-généré envoyé ?

  @Column({ type: 'json', nullable: true })
  email_content?: any; // Contenu email généré par LLM

  @Column()
  tenant_id: string;

  @Column({ type: 'int' })
  restaurant_id: number;

  @Column({ type: 'int' })
  assigned_to: number;

  @Column({ type: 'int' })
  created_by: number;

  @Column('uuid', { nullable: true })
  audit_execution_id?: string; // Lié à un audit ou créé indépendamment

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assigned_user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @ManyToOne(() => AuditExecution, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'audit_execution_id' })
  audit_execution?: AuditExecution;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at?: Date;
}