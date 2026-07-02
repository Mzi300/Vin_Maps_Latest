// POI aggregator – merges providers, deduplicates, caches
import { Injectable } from '@nestjs/common';
import NodeCache from 'node-cache';
import { POI } from '../poi/poi.types';
import { TomtomProvider } from './tomtom.provider';
import { FoursquareProvider } from './foursquare.provider';
import { OverpassProvider } from './overpass.provider';

@Injectable()
export class PoiAggregator {
  private cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

  constructor(
    private readonly tomtom: TomtomProvider,
    private readonly foursquare: FoursquareProvider,
    private readonly overpass: OverpassProvider,
  ) {}

  private normalize(p: POI) {
    return {
      ...p,
      name: p.name.trim().toLowerCase(),
      address: p.address?.trim().toLowerCase() ?? '',
    };
  }

  private isDuplicate(a: POI, b: POI) {
    return (
      a.name === b.name &&
      Math.abs(a.lat - b.lat) < 0.00005 && // ~5m
      Math.abs(a.lng - b.lng) < 0.00005 &&
      a.address === b.address &&
      a.category === b.category
    );
  }

  async getMergedPOIs(
    lat: number,
    lng: number,
    radius: number,
    categories: string[],
  ): Promise<POI[]> {
    const cacheKey = `${lat}:${lng}:${radius}:${categories.sort().join(',')}`;
    const cached = this.cache.get<POI[]>(cacheKey);
    if (cached) return cached;

    const [tomtomRes, foursquareRes, overpassRes] = await Promise.allSettled([
      this.tomtom.fetchPOIs(lat, lng, radius, categories),
      this.foursquare.fetchPOIs(lat, lng, radius, categories),
      this.overpass.fetchPOIs(lat, lng, radius, categories),
    ]);

    const tomtom = tomtomRes.status === 'fulfilled' ? tomtomRes.value : [];
    const foursquare = foursquareRes.status === 'fulfilled' ? foursquareRes.value : [];
    const overpass = overpassRes.status === 'fulfilled' ? overpassRes.value : [];

    // Merge with priority: TomTom > Foursquare > Overpass
    const map = new Map<string, POI>();
    const getKey = (p: POI) => `${p.name.trim().toLowerCase()}|${p.lat?.toFixed(5)}|${p.lng?.toFixed(5)}|${(p.address || '').trim().toLowerCase()}|${p.category}`;
    const mergeMetadata = (existing: POI, incoming: POI) => {
      // Prefer existing values; if missing, fill from incoming
      const merged = { ...existing };
      for (const field of ['address', 'phone', 'website', 'rating', 'openingHours', 'photos']) {
        if (!merged[field as keyof POI] && incoming[field as keyof POI]) {
          merged[field as keyof POI] = incoming[field as keyof POI];
        }
      }
      return merged as POI;
    };

    // Helper to add items respecting priority
    const addArray = (arr: POI[]) => {
      for (const p of arr) {
        const key = getKey(p);
        if (!map.has(key)) {
          map.set(key, p);
        } else {
          const existing = map.get(key)!;
          map.set(key, mergeMetadata(existing, p));
        }
      }
    };

    // Insert in priority order
    addArray(tomtom);
    addArray(foursquare);
    addArray(overpass);

    const merged = Array.from(map.values());

    this.cache.set(cacheKey, merged);
    return merged;
  }
}
