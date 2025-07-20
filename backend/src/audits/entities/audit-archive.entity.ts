import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditTemplate } from './audit-template.entity';
import { Restaurant } from '../../restaurant/entites/restaurant.entity';
import { User } from '../../users/entities/user.entity';

export enum ArchiveStatus {
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

@Entity('audit_archives')
export class AuditArchive {
  @PrimaryGeneratedColumn()
  id: number;

  // Données originales de l'AuditExecution archivé
  @Column()
  original_execution_id: number;

  @Column()
  template_id: number;

  @Column()
  restaurant_id: number;

  @Column()
  inspector_id: number;

  @Column()
  tenant_id: number;

  // Données de l'audit terminé
  @Column()
  scheduled_date: Date;

  @Column()
  completed_date: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  total_score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  max_possible_score: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Métadonnées de l'archive
  @Column({
    type: 'enum',
    enum: ArchiveStatus,
    default: ArchiveStatus.ARCHIVED,
  })
  status: ArchiveStatus;

  @Column()
  archived_by: number;

  @CreateDateColumn()
  archived_at: Date;

  // Données dénormalisées pour faciliter les filtres sans joins
  @Column()
  template_name: string;

  @Column()
  template_category: string;

  @Column()
  restaurant_name: string;

  @Column()
  inspector_name: string;

  // Données JSON pour stocker les réponses et non-conformités
  @Column({ type: 'jsonb', nullable: true })
  responses_data: any;

  @Column({ type: 'jsonb', nullable: true })
  non_conformities_data: any;

  @Column({ type: 'jsonb', nullable: true })
  corrective_actions_data: any;

  // Relations (pour les requêtes avancées si nécessaire)
  @ManyToOne(() => AuditTemplate)
  @JoinColumn({ name: 'template_id' })
  template: AuditTemplate;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'archived_by' })
  archiver: User;
}
