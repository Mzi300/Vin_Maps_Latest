import { Controller, Get, Query } from '@nestjs/common';
import { PoiAggregator } from './poi.aggregator';
import { POI } from './poi.types';

@Controller('api/pois')
export class PoiController {
  constructor(private readonly aggregator: PoiAggregator) {}

  @Get()
  async getPOIs(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius: string,
    @Query('categories') categories: string,
  ): Promise<{ pois: POI[] }> {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = radius ? parseInt(radius, 10) : 5000;
    const cats = categories ? categories.split(',') : [];
    const pois = await this.aggregator.getMergedPOIs(latNum, lngNum, radiusNum, cats);
    return { pois };
  }
}
