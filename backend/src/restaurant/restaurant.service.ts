// src/restaurants/restaurants.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtUser } from '../common/interfaces/jwt-user.interface';
import { Restaurant } from './entites/restaurant.entity';

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

  // Renvoie les restaurants pour le tenant du manager connecté
  findAllForTenant(user: JwtUser): Promise<Restaurant[]> {
    // ----- CORRECTION APPLIQUÉE ICI -----
    // On vérifie que l'utilisateur est bien un manager ET qu'il a un tenant_id valide (non null).
    if (user.role !== 'manager' || user.tenant_id === null) {
      // Si ce n'est pas le cas, on renvoie une liste vide en toute sécurité.
      return Promise.resolve([]);
    }

    // À ce stade, TypeScript est certain que user.tenant_id est un nombre.
    // La requête est donc valide et sécurisée.
    return this.repo.find({ where: { tenant_id: user.tenant_id } });
  }
}
