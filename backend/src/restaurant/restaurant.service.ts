// src/restaurants/restaurants.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant) private repo: Repository<Restaurant>,
  ) {}

  // Créer un nouveau restaurant
  async create(createData: {
    name: string;
    city: string;
    tenant_id: number;
  }): Promise<Restaurant> {
    const restaurant = this.repo.create(createData);
    return this.repo.save(restaurant);
  }

  // Renvoie les restaurants pour le tenant de l'utilisateur connecté
  findAllForTenant(user: JwtUser): Promise<Restaurant[]> {
    // Vérifier que l'utilisateur a un tenant_id valide (non null)
    if (user.tenant_id === null) {
      return Promise.resolve([]);
    }

    // Les admins et managers peuvent voir tous les restaurants de leur tenant
    // Les viewers voient seulement leur restaurant s'ils en ont un assigné
    if (user.role === 'viewer' && user.restaurant_id) {
      return this.repo.find({ 
        where: { 
          id: user.restaurant_id,
          tenant_id: user.tenant_id 
        } 
      });
    }

    // Admins et managers voient tous les restaurants du tenant
    return this.repo.find({ where: { tenant_id: user.tenant_id } });
  }

  // Récupérer un restaurant par ID
  async findOne(id: number, user: JwtUser): Promise<Restaurant | null> {
    // Vérifier que l'utilisateur a un tenant_id
    if (user.tenant_id === null) {
      return null;
    }

    // Récupérer le restaurant avec la relation tenant
    return this.repo.findOne({ 
      where: { 
        id,
        tenant_id: user.tenant_id 
      },
      relations: ['tenant'] // Inclure les infos du tenant
    });
  }
}
