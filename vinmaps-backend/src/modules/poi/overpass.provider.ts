import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import { PoiProviderInterface } from './poi.provider.interface';

import { POI } from '../poi/poi.types';

/**
 * Mapping from internal category IDs to OSM tag filters. This object can be extended
 * without changing the provider logic – new categories can be added here.
 */
const CATEGORY_MAPPING: Record<string, string[]> = {
  school: ['amenity=school'],
  hospital: ['amenity=hospital'],
  clinic: ['amenity=clinic'],
  pharmacy: ['amenity=pharmacy'],
  bank: ['amenity=bank'],
  post_office: ['amenity=post_office'],
  fire_station: ['amenity=fire_station'],
  courthouse: ['amenity=courthouse'],
  townhall: ['amenity=townhall'],
  library: ['amenity=library'],
  university: ['amenity=university'],
  college: ['amenity=college'],
  kindergarten: ['amenity=kindergarten'],
  place_of_worship: ['amenity=place_of_worship'],
  police_station: ['amenity=police'],
  government_office: ['office=government'],
  park: ['leisure=park'],
  bus_stop: ['highway=bus_stop'],
  petrol_station: ['amenity=fuel'],
  restaurant: ['amenity=restaurant'],
  atm: ['amenity=atm'],
  shop: ['shop'],
  supermarket: ['shop=supermarket'],
  mall: ['shop=mall'],
  clothes: ['shop=clothes'],
  electronics: ['shop=electronics'],
  convenience: ['shop=convenience'],
  hotel: ['tourism=hotel'],
  guest_house: ['tourism=guest_house'],
  museum: ['tourism=museum'],
  attraction: ['tourism=attraction'],
};

/**
 * Provider that queries the public OpenStreetMap Overpass API.
 * The endpoint can be overridden via the OVERPASS_URL environment variable.
 */
@Injectable()
export class OverpassProvider implements PoiProviderInterface {
  readonly providerName = 'overpass';
  private readonly endpoint: string;

  constructor() {
    this.endpoint = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
  }

  /** Build Overpass QL query for a bounding box and selected categories */
  private buildQuery(lat: number, lng: number, radius: number, categories: string[]): string {
    // Approximate a square bounding box around the point (radius in metres)
    const earthRadius = 6378137; // metres
    const dLat = (radius / earthRadius) * (180 / Math.PI);
    const dLng = (radius / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    const south = lat - dLat;
    const north = lat + dLat;
    const west = lng - dLng;
    const east = lng + dLng;
    const bbox = `${south},${west},${north},${east}`;

    // Build list of OSM element filters
    const tagFilters = categories
      .map((cat) => CATEGORY_MAPPING[cat])
      .filter(Boolean)
      .flat()
      .map((tag) => `node[${tag}](${bbox}); way[${tag}](${bbox}); relation[${tag}](${bbox});`)
      .join(' ');

    // If no categories matched, request nothing to avoid huge payload
    if (!tagFilters) return '[out:json][timeout:25];out;';

    return `[out:json][timeout:25];(${tagFilters});out center;`;
  }

  /** Convert Overpass element to our POI shape */
  private elementToPOI(el: any): POI {
    const tags = el.tags || {};
    const name = tags.name || 'Unnamed';
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    // Infer a category ID based on known tag keys
    const inferCategory = (): string => {
      for (const key of Object.keys(tags)) {
        const value = tags[key];
        // Direct match for known OSM keys
        for (const [cat, filters] of Object.entries(CATEGORY_MAPPING)) {
          if (filters.some((f) => f === `${key}=${value}`)) return cat;
        }
      }
      return 'unknown';
    };
    return {
      id: `osm-${el.id}`,
      name,
      category: inferCategory(),
      address: tags['addr:full'] ?? '',
      lat,
      lng,
      phone: tags.phone ?? undefined,
      website: tags.website ?? undefined,
    } as POI;
  }

  async fetchPOIs(lat: number, lng: number, radius: number, categories: string[]): Promise<POI[]> {
    const query = this.buildQuery(lat, lng, radius, categories);
    const resp = await fetch(this.endpoint, {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' },
    });
    if (!resp.ok) {
      throw new Error(`Overpass request failed: ${resp.status}`);
    }
    const data = await resp.json();
    if (!data.elements) return [];
    return data.elements.map(this.elementToPOI.bind(this)).filter((p) => p.lat && p.lng);
  }
}
