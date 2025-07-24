import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Ticket } from './ticket.entity';
import { TicketAttachment } from './ticket-attachment.entity';
import { Exclude } from 'class-transformer';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticket_id: string;

  @Column()
  author_id: number;

  @Column('text')
  message: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Ticket, (ticket) => ticket.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  @Exclude({ toPlainOnly: true })
  ticket: Ticket;

  @OneToMany(() => TicketAttachment, (attachment) => attachment.comment)
  attachments: TicketAttachment[];
}
