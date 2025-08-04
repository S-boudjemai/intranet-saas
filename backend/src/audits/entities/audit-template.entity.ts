// src/audits/entities/audit-template.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AuditTemplateItem } from './audit-template-item.entity';
import { AuditExecution } from './audit-execution.entity';

export enum AuditFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly', 
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ON_DEMAND = 'on_demand'
}

export enum AuditCategory {
  HYGIENE_SECURITY = 'hygiene_security',
  CUSTOMER_SERVICE = 'customer_service', 
  PROCESS_COMPLIANCE = 'process_compliance',
  EQUIPMENT_STANDARDS = 'equipment_standards',
  STAFF_TRAINING = 'staff_training',
  INVENTORY_MANAGEMENT = 'inventory_management',
  OTHER = 'other'
}

@Entity('audit_templates')
export class AuditTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: AuditCategory,
    default: AuditCategory.OTHER
  })
  category: AuditCategory;

  @Column({
    type: 'enum', 
    enum: AuditFrequency,
    default: AuditFrequency.ON_DEMAND
  })
  frequency: AuditFrequency;

  @Column({ type: 'int', nullable: true })
  estimated_duration?: number;

  @Column({ default: false })
  is_mandatory: boolean;

  @Column({ default: true })
  is_active: boolean;

  @Column()
  tenant_id: string;

  @Column()
  created_by: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => AuditTemplateItem, item => item.template, { cascade: true })
  items: AuditTemplateItem[];

  @OneToMany(() => AuditExecution, execution => execution.template)
  executions: AuditExecution[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}