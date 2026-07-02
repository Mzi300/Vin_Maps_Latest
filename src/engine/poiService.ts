export interface POI {
  lat: number;
  lng: number;
  name: string;
  category: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  openingHours?: string;
}

/**
 * Fetch POIs from the backend aggregated endpoint.
 * @param lat Latitude of the centre point.
 * @param lng Longitude of the centre point.
 * @param radius Search radius in metres.
 * @param categories List of category IDs to include.
 */
export async function fetchPOIs(
  lat: number,
  lng: number,
  radius: number,
  categories: string[] = []
): Promise<POI[]> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius: radius.toString()
  });
  if (categories.length) {
    params.append('categories', categories.join(','));
  }
  const response = await fetch(`/api/pois?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch POIs: ${response.status}`);
  }
  const data = await response.json();
  return data.pois as POI[];
}
