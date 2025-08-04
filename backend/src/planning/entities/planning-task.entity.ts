import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { AuditExecution } from '../../audits/entities/audit-execution.entity';
import { CorrectiveAction } from '../../audits/entities/corrective-action.entity';

export enum PlanningTaskType {
  AUDIT = 'audit',
  CUSTOM = 'custom',
  CORRECTIVE_ACTION = 'corrective_action',
}

export enum PlanningTaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('planning_tasks')
export class PlanningTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamp' })
  scheduled_date: Date;

  @Column({ type: 'int', nullable: true })
  duration: number | null; // en minutes

  @Column({
    type: 'enum',
    enum: PlanningTaskType,
    default: PlanningTaskType.CUSTOM,
  })
  type: PlanningTaskType;

  @Column({
    type: 'enum',
    enum: PlanningTaskStatus,
    default: PlanningTaskStatus.PENDING,
  })
  status: PlanningTaskStatus;

  @Column({ type: 'int' })
  tenant_id: number;

  @Column({ type: 'int', nullable: true })
  restaurant_id: number | null;

  @Column({ type: 'int', nullable: true })
  assigned_to: number | null;

  @Column({ type: 'int' })
  created_by: number;

  @Column({ type: 'uuid', nullable: true })
  audit_execution_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  corrective_action_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedUser: User | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => Restaurant, { nullable: true })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant | null;

  @ManyToOne(() => AuditExecution, { nullable: true })
  @JoinColumn({ name: 'audit_execution_id' })
  auditExecution: AuditExecution | null;

  @ManyToOne(() => CorrectiveAction, { nullable: true })
  @JoinColumn({ name: 'corrective_action_id' })
  correctiveAction: CorrectiveAction | null;
}