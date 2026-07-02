export interface POI {
  id: string;
  name: string;
  category: string;
  address?: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  openingHours?: string;
  rating?: number;
  photos?: string[];
}
