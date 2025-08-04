import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { RestaurantType } from '../../common/enums/restaurant-type.enum';
import { Restaurant } from '../../restaurant/entities/restaurant.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({
    type: 'enum',
    enum: RestaurantType,
    default: RestaurantType.TRADITIONNEL,
  })
  restaurant_type: RestaurantType;

  // Palette de couleurs dynamiques pour le thème
  @Column({ type: 'varchar', length: 7, default: '#4F46E5' })
  primaryColor: string; // couleur principale

  @Column({ type: 'varchar', length: 7, default: '#10B981' })
  secondaryColor: string; // couleur secondaire

  @Column({ type: 'varchar', length: 7, default: '#FFFFFF' })
  backgroundColor: string; // couleur de fond

  @Column({ type: 'varchar', length: 7, default: '#1F2937' })
  textColor: string; // couleur du texte

  @Column({ type: 'text', nullable: true })
  logo_url: string | null; // URL du logo du tenant

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  // Relations
  @OneToMany(() => Restaurant, (restaurant) => restaurant.tenant)
  restaurants: Restaurant[];

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];
}
