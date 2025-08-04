// src/audits/entities/audit-execution.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { AuditTemplate } from './audit-template.entity';
import { AuditResponse } from './audit-response.entity';
import { CorrectiveAction } from './corrective-action.entity';

export enum AuditStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  ARCHIVED = 'archived'
}

@Entity('audit_executions')
export class AuditExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    type: 'enum',
    enum: AuditStatus,
    default: AuditStatus.SCHEDULED
  })
  status: AuditStatus;

  @Column({ type: 'timestamp' })
  scheduled_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  started_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Column({ type: 'json', nullable: true })
  summary?: any; // Score global, points critiques, etc.

  @Column()
  tenant_id: string;

  @Column('uuid')
  template_id: string;

  @Column({ type: 'int' })
  restaurant_id: number;

  @Column({ type: 'int' })
  auditor_id: number;

  @Column({ type: 'int', nullable: true })
  assigned_by?: number; // Qui a planifié l'audit

  @ManyToOne(() => AuditTemplate, template => template.executions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: AuditTemplate;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'auditor_id' })
  auditor: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_by' })
  assigner?: User;

  @OneToMany(() => AuditResponse, response => response.execution, { cascade: true })
  responses: AuditResponse[];

  @OneToMany(() => CorrectiveAction, action => action.audit_execution)
  corrective_actions: CorrectiveAction[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}