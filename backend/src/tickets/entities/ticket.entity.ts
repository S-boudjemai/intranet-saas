// src/tickets/entities/ticket.entity.ts
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
import { Comment } from './comment.entity';
import { TicketAttachment } from './ticket-attachment.entity';
import { User } from 'src/users/entities/user.entity';
import { Restaurant } from 'src/restaurant/entites/restaurant.entity';
import { Exclude } from 'class-transformer';

export enum TicketStatus {
  NonTraitee = 'non_traitee',
  EnCours = 'en_cours',
  Traitee = 'traitee',
  Supprime = 'supprime',
}

@Entity('tickets') // Le nom de la table est 'tickets'
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.NonTraitee,
  })
  status: TicketStatus;

  @Column()
  tenant_id: string;

  @Column({ default: false })
  is_deleted: boolean;

  @Column()
  created_by: number;

  // ----- AJOUTS IMPORTANTS -----
  @Column({ type: 'int', nullable: true }) // Le restaurant peut être null si créé par un manager pour tous
  restaurant_id: number | null;

  @ManyToOne(() => Restaurant)
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant; // Pour récupérer le nom du restaurant
  // -----------------------------

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => Comment, (c) => c.ticket, { cascade: true })
  @Exclude({ toPlainOnly: true })
  comments: Comment[];

  @OneToMany(() => TicketAttachment, (attachment) => attachment.ticket)
  attachments: TicketAttachment[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
