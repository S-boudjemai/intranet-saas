import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditExecution } from './audit-execution.entity';
import { AuditItem } from './audit-item.entity';

@Entity('audit_responses')
export class AuditResponse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  execution_id: number;

  @Column()
  item_id: number;

  @Column('text', { nullable: true })
  value: string; // Stockage flexible : 'true', '15', 'Bon état', etc.

  @Column({ nullable: true })
  score: number; // Score numérique pour type 'score'

  @Column({ nullable: true })
  photo_url: string; // URL de la photo S3

  @Column('text', { nullable: true })
  notes: string; // Notes spécifiques à cette réponse

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => AuditExecution, execution => execution.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'execution_id' })
  execution: AuditExecution;

  @ManyToOne(() => AuditItem, item => item.responses)
  @JoinColumn({ name: 'item_id' })
  item: AuditItem;
}