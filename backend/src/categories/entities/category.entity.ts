// src/categories/entities/category.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('category') // ← passe de 'categories' à 'category'
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Category, (cat) => cat.children, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  @Exclude({ toPlainOnly: true })
  parent: Category | null;

  @OneToMany(() => Category, (cat) => cat.parent)
  children: Category[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
