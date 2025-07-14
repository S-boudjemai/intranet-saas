// src/announcements/entities/announcement.entity.ts
import { Restaurant } from 'src/restaurant/entites/restaurant.entity';
import { Document } from 'src/documents/entities/document.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToMany, // <-- AJOUT
  JoinTable, // <-- AJOUT
} from 'typeorm';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenant_id: number;

  // ❌ On supprime la colonne restaurant_id qui ne peut contenir qu'un seul ID.
  // @Column()
  // restaurant_id: number;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column({ default: false })
  is_deleted: boolean;

  @Column()
  created_by: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  // ✅ On ajoute une relation "plusieurs-à-plusieurs" (ManyToMany).
  // TypeORM va créer automatiquement une table de liaison (ex: announcement_restaurants)
  // pour stocker les paires (announcement_id, restaurant_id).
  @ManyToMany(() => Restaurant)
  @JoinTable({
    name: 'announcement_restaurants', // Vous pouvez nommer la table de liaison comme vous le souhaitez
    joinColumn: { name: 'announcement_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'restaurant_id', referencedColumnName: 'id' },
  })
  restaurants: Restaurant[];

  // ✅ Relation avec les documents attachés
  @ManyToMany(() => Document)
  @JoinTable({
    name: 'announcement_documents',
    joinColumn: { name: 'announcement_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'document_id', referencedColumnName: 'id' },
  })
  documents: Document[];
}
