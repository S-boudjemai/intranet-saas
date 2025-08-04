// src/audits/entities/audit-template-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { AuditTemplate } from './audit-template.entity';
import { AuditResponse } from './audit-response.entity';

export enum QuestionType {
  SCORE_1_5 = 'score_1_5',
  SELECT = 'select',
  TEXT = 'text',
  PHOTO = 'photo',
  YES_NO = 'yes_no',
  TEMPERATURE = 'temperature'
}

@Entity('audit_template_items')
export class AuditTemplateItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  question: string;

  @Column({
    type: 'enum',
    enum: QuestionType,
    default: QuestionType.TEXT
  })
  type: QuestionType;

  @Column({ type: 'json', nullable: true })
  options?: any; // Pour les selects: ["Option1", "Option2"] ou pour température: {"min": -18, "max": 4}

  @Column({ default: false })
  is_required: boolean;

  @Column({ default: 0 })
  order_index: number;

  @Column({ length: 255, nullable: true })
  help_text?: string;

  @Column('uuid')
  template_id: string;

  @ManyToOne(() => AuditTemplate, template => template.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: AuditTemplate;

  @OneToMany(() => AuditResponse, response => response.template_item)
  responses: AuditResponse[];
}