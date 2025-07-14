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
import { User } from '../../users/entities/user.entity';
import { AuditItem } from './audit-item.entity';
import { AuditExecution } from './audit-execution.entity';

@Entity('audit_templates')
export class AuditTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  @Column({ length: 255 })
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ length: 100 })
  category: string; // 'hygiene', 'security', 'quality', etc.

  @Column({ default: true })
  is_active: boolean;

  @Column()
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => AuditItem, auditItem => auditItem.template, { cascade: true })
  items: AuditItem[];

  @OneToMany(() => AuditExecution, execution => execution.template)
  executions: AuditExecution[];
}