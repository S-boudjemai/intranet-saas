import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';
import { Comment } from './comment.entity';

@Entity('ticket_attachments')
export class TicketAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string; // Nom original du fichier

  @Column()
  url: string; // URL S3 de l'image

  @Column()
  mime_type: string; // Type MIME (image/jpeg, image/png, etc.)

  @Column()
  file_size: number; // Taille en bytes

  @Column({ nullable: true })
  ticket_id: string | null; // Si attaché au ticket principal

  @Column({ nullable: true })
  comment_id: string | null; // Si attaché à un commentaire

  @Column()
  uploaded_by: number; // ID de l'utilisateur qui a uploadé

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => Ticket, { nullable: true })
  @JoinColumn({ name: 'ticket_id' })
  ticket?: Ticket;

  @ManyToOne(() => Comment, { nullable: true })
  @JoinColumn({ name: 'comment_id' })
  comment?: Comment;
}