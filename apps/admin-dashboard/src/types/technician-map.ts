export type TechnicianMapItem = {
  technicianId: number;
  technicianName: string;
  lat: number;
  lng: number;
  status?: string | null;
  orderId?: number | null;
  updatedAt: string;
  isOnline?: boolean;
};

export type MapProvider = 'google' | 'osm';