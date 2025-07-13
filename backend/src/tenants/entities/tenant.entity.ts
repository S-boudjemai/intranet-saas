import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  // Palette de couleurs dynamiques pour le thème
  @Column({ type: 'varchar', length: 7, default: '#4F46E5' })
  primaryColor: string; // couleur principale

  @Column({ type: 'varchar', length: 7, default: '#10B981' })
  secondaryColor: string; // couleur secondaire

  @Column({ type: 'varchar', length: 7, default: '#FFFFFF' })
  backgroundColor: string; // couleur de fond

  @Column({ type: 'varchar', length: 7, default: '#1F2937' })
  textColor: string; // couleur du texte

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
