// src/tags/tag.entity.ts
import { Document } from 'src/documents/entities/document.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @ManyToMany(() => Document, (document) => document.tags)
  @Exclude({ toPlainOnly: true })
  documents: Document[];
}
