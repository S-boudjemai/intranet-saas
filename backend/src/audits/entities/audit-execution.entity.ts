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
import { AuditTemplate } from './audit-template.entity';
import { Restaurant } from '../../restaurant/entites/restaurant.entity';
import { User } from '../../users/entities/user.entity';
import { AuditResponse } from './audit-response.entity';

export type AuditExecutionStatus =
  | 'todo'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'reviewed';

@Entity('audit_executions')
export class AuditExecution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  template_id: number;

  @Column()
  restaurant_id: number;

  @Column()
  inspector_id: number;

  @Column({
    type: 'enum',
    enum: ['todo', 'scheduled', 'in_progress', 'completed', 'reviewed'],
    default: 'todo',
  })
  status: AuditExecutionStatus;

  @Column()
  scheduled_date: Date;

  @Column({ nullable: true })
  completed_date: Date;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  total_score: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  max_possible_score: number;

  @Column('text', { nullable: true })
  notes: string; // Notes générales de l'auditeur

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => AuditTemplate, (template) => template.executions)
  @JoinColumn({ name: 'template_id' })
  template: AuditTemplate;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  @OneToMany(() => AuditResponse, (response) => response.execution, {
    cascade: true,
  })
  responses: AuditResponse[];
}
