import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService, SearchResponse } from './search.service';

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

    return this.searchService.globalSearch(
      query.trim(),
      req.user.userId,
      req.user.tenant_id,
      req.user.restaurant_id,
      req.user.role,
    );
  }
}