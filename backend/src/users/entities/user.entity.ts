// src/users/entities/user.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn() id: number;

  @Column({ type: 'int', nullable: true })
  tenant_id: number | null;

  @Column({ unique: true }) email: string;

  @Column() password_hash: string;

  @Column({ default: 'manager' })
  role: 'admin' | 'manager' | 'viewer';

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn() created_at: Date;

  // ----- CORRECTION APPLIQUÉE ICI -----
  // On ajoute la colonne pour correspondre à la structure de la base de données.
  // Elle doit être nullable car les managers/admins n'ont pas de restaurant_id.
  @Column({ type: 'int', nullable: true })
  restaurant_id: number | null;

  // ✅ OneSignal integration
  @Column({ type: 'varchar', nullable: true })
  oneSignalUserId: string | null;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', nullable: true })
  platform: string | null;

  // Relations
  @ManyToOne(() => Tenant, (tenant) => tenant.users)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
