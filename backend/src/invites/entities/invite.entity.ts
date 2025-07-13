import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('invites')
export class Invite {
  @PrimaryGeneratedColumn() id: number;

  @Column() tenant_id: number;
  @Column() invite_email: string;
  @Column({ unique: true }) token: string;
  @Column({ type: 'timestamp' }) expires_at: Date;
  @Column({ type: 'timestamp', nullable: true }) used_at: Date;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
