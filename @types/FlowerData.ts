// @types/FlowerData.ts
export interface FlowerData {
  location_id: string;
  year: number;
  month: number;
  event_type: 'Drought' | 'Flood' | 'DtoF';
  severity: number;
  centroid?: {
    type: "Point";
    coordinates: [number, number];
  };
}

export interface LocationData {
  location_id: string;
  year_count: number;
  first_year: number;
  last_year: number;
  centroid: {
    type: "Point";
    coordinates: [number, number];
  };
  lat?: number;
  lng?: number;
}

export interface FlowerBudMarkerProps {
  map: mapboxgl.Map;
  data: LocationData[];
  onClick: (locationId: string, firstYear: number, lastYear: number) => void;
}

export interface CalendarFlowerProps {
  data: FlowerData[];
  locationId: string;
  firstYear: number;
  lastYear: number;
  width?: number;
  height?: number;
}

export interface CountryData {
  country_code: string;
  year_count: number;
  first_year: number;
  last_year: number;
  centroid: {
    type: "Point";
    coordinates: [number, number];
  };
  country_name?:string;
}