// src/users/entities/user.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

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
}
