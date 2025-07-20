import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { AuditTemplate } from './audit-template.entity';
import { AuditResponse } from './audit-response.entity';

export type AuditItemType = 'yes_no' | 'score' | 'text' | 'photo';

@Entity('audit_items')
export class AuditItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  template_id: number;

  @Column('text')
  question: string;

  @Column({
    type: 'enum',
    enum: ['yes_no', 'score', 'text', 'photo'],
  })
  type: AuditItemType;

  @Column({ default: true })
  is_required: boolean;

  @Column()
  order: number;

  @Column({ nullable: true })
  max_score: number; // Pour type 'score'

  @Column('text', { nullable: true })
  help_text: string; // Texte d'aide pour la question

  @Column({ default: false })
  critical: boolean; // Question critique pour la conformité

  // Relations
  @ManyToOne(() => AuditTemplate, (template) => template.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_id' })
  template: AuditTemplate;

  @OneToMany(() => AuditResponse, (response) => response.item)
  responses: AuditResponse[];
}
