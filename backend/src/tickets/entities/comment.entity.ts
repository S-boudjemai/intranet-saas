import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';

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

  @ManyToOne(() => Ticket, (ticket) => ticket.comments)
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;
}
