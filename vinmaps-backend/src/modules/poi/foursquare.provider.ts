import fetch from 'node-fetch';
import { PoiProviderInterface } from './poi.provider.interface';
import { ConfigService } from '../../config/config.service';
import { POI } from '../poi/poi.types';

@Injectable()
export class FoursquareProvider implements PoiProviderInterface {
  readonly providerName = 'foursquare';
  private readonly apiKey: string;
  private readonly endpoint = 'https://api.foursquare.com/v3/places/search';

  constructor(private readonly config: ConfigService) {
    this.apiKey = process.env.FOURSQUARE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('FOURSQUARE_API_KEY not set in environment');
    }
  }

  async fetchPOIs(lat: number, lng: number, radius: number, categories: string[]): Promise<POI[]> {
    const headers = {
      Authorization: this.apiKey,
      Accept: 'application/json',
    };
    const params = new URLSearchParams({
      ll: `${lat},${lng}`,
      radius: radius.toString(),
      categories: categories.join(','),
      limit: '50',
    });
    const resp = await fetch(`${this.endpoint}?${params}`, { headers });
    if (!resp.ok) {
      throw new Error(`Foursquare error ${resp.status}`);
    }
    const data = await resp.json();
    return data.results.map((r: any) => ({
      id: `fs-${r.fsq_id}`,
      name: r.name,
      category: r.categories?.[0]?.name?.toLowerCase() ?? 'unknown',
      address: r.location?.formatted_address,
      lat: r.geocodes?.main?.latitude,
      lng: r.geocodes?.main?.longitude,
      phone: r.tel,
      website: r.website,
      openingHours: r.hours?.display,
      rating: r.rating,
      photos: r.photos?.map((p: any) => `${p.prefix}original${p.suffix}`) ?? [],
    }));
  }
}
