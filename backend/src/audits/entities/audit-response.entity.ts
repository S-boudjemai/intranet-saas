// src/audits/entities/audit-response.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditTemplateItem } from './audit-template-item.entity';
import { AuditExecution } from './audit-execution.entity';

@Entity('audit_responses')
export class AuditResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  value?: string; // Réponse textuelle, score, ou chemin photo

  @Column({ type: 'int', nullable: true })
  numeric_value?: number; // Pour scores, températures

  @Column({ type: 'json', nullable: true })
  metadata?: any; // Photos, coordonnées GPS, timestamp, etc.

  @Column({ type: 'text', nullable: true }) 
  comment?: string; // Commentaire additionnel

  @Column('uuid')
  template_item_id: string;

  @Column('uuid')
  execution_id: string;

  @ManyToOne(() => AuditTemplateItem, item => item.responses)
  @JoinColumn({ name: 'template_item_id' })
  template_item: AuditTemplateItem;

  @ManyToOne(() => AuditExecution, execution => execution.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'execution_id' })
  execution: AuditExecution;

  @CreateDateColumn()
  created_at: Date;
}