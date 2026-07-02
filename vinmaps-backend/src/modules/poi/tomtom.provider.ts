import { Injectable } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import { POI } from '../poi/poi.types';

@Injectable()
export class TomtomProvider implements PoiProviderInterface {
  readonly providerName = 'tomtom';
  // Placeholder implementation – returns empty array or could call real TomTom POI API later.
  async fetchPOIs(_lat: number, _lng: number, _radius: number, _categories: string[]): Promise<POI[]> {
    // TODO: integrate real TomTom POI request when needed.
    return [];
  }
}
