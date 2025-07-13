// src/announcements/announcements.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Announcement } from './entities/announcement.entity';
import { Repository, In, Brackets } from 'typeorm';
import { Role } from 'src/auth/roles/roles.enum';
import { Restaurant } from 'src/restaurant/entites/restaurant.entity';

export interface JwtUser {
  userId: number;
  tenant_id: number | null;
  role: Role;
  restaurant_id?: number;
}

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private readonly repo: Repository<Announcement>,

    @InjectRepository(Restaurant)
    private readonly restaurantRepo: Repository<Restaurant>,
  ) {}

  async findAll(user: JwtUser): Promise<Announcement[]> {
    // ... (la logique de findAll reste la même pour l'instant)
    const qb = this.repo
      .createQueryBuilder('announcement')
      .where('announcement.is_deleted = false');

    if (user.role === Role.Admin) {
      return this.repo.find({
        where: { is_deleted: false },
        relations: ['restaurants'],
        order: { created_at: 'DESC' },
      });
    }

    if (!user.tenant_id) {
      throw new ForbiddenException('Tenant non défini pour cet utilisateur');
    }

    if (user.role === Role.Manager) {
      return this.repo.find({
        where: { tenant_id: user.tenant_id, is_deleted: false },
        relations: ['restaurants'],
        order: { created_at: 'DESC' },
      });
    }

    if (user.role === Role.Viewer) {
      if (!user.restaurant_id) {
        throw new ForbiddenException('Restaurant non défini pour le viewer');
      }

      const qb = this.repo
        .createQueryBuilder('announcement')
        .leftJoin('announcement.restaurants', 'restaurant')
        .where('announcement.tenant_id = :tenantId', {
          tenantId: user.tenant_id,
        })
        .andWhere('announcement.is_deleted = false')
        .andWhere(
          new Brackets((sqb) => {
            sqb
              .where('restaurant.id = :restaurantId', {
                restaurantId: user.restaurant_id,
              })
              .orWhere(
                'NOT EXISTS (SELECT 1 FROM announcement_restaurants ar WHERE ar.announcement_id = announcement.id)',
              );
          }),
        )
        .orderBy('announcement.created_at', 'DESC');

      return qb.getMany();
    }

    return [];
  }

  async create(
    data: {
      title: string;
      content: string;
      restaurant_ids?: number[];
      tenant_id: number;
    },
    user: JwtUser,
  ): Promise<Announcement> {
    // ================== LOGS DE CRÉATION ==================
    console.log(`[create] Received data: title=${data.title}`);
    console.log(
      `[create] Received restaurant_ids: [${data.restaurant_ids?.join(', ')}]`,
    );
    // ====================================================

    const newAnnouncement = this.repo.create({
      title: data.title,
      content: data.content,
      tenant_id: data.tenant_id,
      created_by: user.userId,
    });

    if (data.restaurant_ids && data.restaurant_ids.length > 0) {
      const restaurants = await this.restaurantRepo.findBy({
        id: In(data.restaurant_ids),
      });
      newAnnouncement.restaurants = restaurants;
      // ================== LOGS D'ASSOCIATION ==================
      console.log(
        `[create] Associating with ${restaurants.length} restaurants with IDs: [${restaurants.map((r) => r.id).join(', ')}]`,
      );
      // ========================================================
    } else {
      console.log(
        `[create] No restaurant_ids received. Creating a global announcement.`,
      );
    }

    return this.repo.save(newAnnouncement);
  }

  async softDelete(id: string, user: JwtUser): Promise<void> {
    if (user.role === Role.Viewer) {
      throw new ForbiddenException('Les viewers ne peuvent pas supprimer');
    }
    const numericId = parseInt(id, 10);
    const ann = await this.repo.findOneBy({ id: numericId });
    if (!ann) {
      throw new NotFoundException('Annonce introuvable');
    }
    await this.repo.update(numericId, { is_deleted: true });
  }
}
