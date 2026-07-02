export interface PoiProviderInterface {
  /** Human readable name of the provider, used for priority and logging */
  readonly providerName: string;
  /** Fetch POIs for a given location and categories */
  fetchPOIs(lat: number, lng: number, radius: number, categories: string[]): Promise<POI[]>;
}
