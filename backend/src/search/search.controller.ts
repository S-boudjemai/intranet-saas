import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService, SearchResponse } from './search.service';
import { IsString, IsNotEmpty, MaxLength, validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

class SearchQueryDto {
  @IsString({ message: 'La requête doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La requête ne peut pas être vide' })
  @MaxLength(100, { message: 'La requête ne peut pas dépasser 100 caractères' })
  q: string;
}

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async globalSearch(
    @Query('q') query: string,
    @Req() req: any,
  ): Promise<SearchResponse> {
    if (!query || query.trim().length < 2) {
      return {
        documents: [],
        tickets: [],
        announcements: [],
        total: 0,
      };
    }

    // Validation et sanitization de la requête
    const queryDto = plainToClass(SearchQueryDto, { q: query });
    const errors = await validate(queryDto);

    if (errors.length > 0) {
      throw new Error('Requête de recherche invalide');
    }

    // Nettoyer la requête : supprimer les caractères potentiellement dangereux
    const sanitizedQuery = query
      .trim()
      .replace(/[<>'"&]/g, '') // Supprimer les caractères HTML dangereux
      .replace(/script/gi, '') // Supprimer le mot "script" (insensible à la casse)
      .replace(/javascript/gi, '') // Supprimer "javascript"
      .replace(/on\w+=/gi, '') // Supprimer les gestionnaires d'événements HTML
      .substring(0, 100); // Limiter la longueur

    return this.searchService.globalSearch(
      sanitizedQuery,
      req.user.userId,
      req.user.tenant_id,
      req.user.restaurant_id,
      req.user.role,
    );
  }
}
