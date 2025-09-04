"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Menu, X } from "lucide-react";

// Components
import MapSidebar from "./MapSidebar";
import MapControls from "./MapControls";
import LoadingOverlay from "./LoadingOverlay";
import FlowerBudMarker from './FlowerBudMarker';
import CalendarFlower from './CalendarFlower';
import CanadaFlowerBudMarker from "./LocalCaseStudies/Canada/ProvinceFlowerBudMarker";

// Types
import type { LocationData, CountryData as OriginalCountryData } from '@/@types/FlowerData';

// Extend FlowerData to include optional original_type property
import type { FlowerData as BaseFlowerData } from '@/@types/FlowerData';

type FlowerData = BaseFlowerData & {
  original_type?: string;
  event_count?: number;
  total_events_in_month?: number;
  percentage?: number;
};
// Add this type definition
interface ProvinceData {
  province_code: string;
  country_code: string;
  year_count: number;
  first_year: number;
  last_year: number;
  centroid: {
    type: 'Point';
    coordinates: [number, number];
  };
  total_events: number;
  drought_events: number;
  flood_events: number;
  dtof_events: number;
  drought_flood_events: number;
}
// Extend CountryData to include average_severity and event arrays
type CountryData = OriginalCountryData & {
  drought_events?: any[];
  flood_events?: any[];
  combined_events?: any[];
};
interface CanadaFlowerBudMarkerProps {
  provinceCode: string;
  map: mapboxgl.Map | null;
  data: ProvinceData[];
  onClick: (provinceCode: string, firstYear: number, lastYear: number) => void;
  budSize?: 'small' | 'medium' | 'large';
  budStyle?: 'classic' | 'modern' | 'minimal';
}
  
// Initialize Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// Mapbox style definitions
const baseMaps = {
  Streets: 'mapbox://styles/mapbox/streets-v12',
  Outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  Satellite: 'mapbox://styles/mapbox/satellite-v9',
  Light: 'mapbox://styles/mapbox/light-v11',
  Dark: 'mapbox://styles/mapbox/dark-v11',
  SatelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v12'
};

type ProjectionType = 'mercator' | 'globe' | 'albers' | 'equalEarth' | 'naturalEarth' | 'lambertConformalConic' | 'winkelTripel';

type ProjectionSpecification =
  | 'mercator'
  | 'globe'
  | {
      name: 'globe';
      center?: [number, number];
      parallels?: [number, number];
    }
  | {
      name: 'mercator';
    }
  | {
      name: 'albers';
      center?: [number, number];
      parallels?: [number, number];
    }
  | {
      name: 'equalEarth';
      center?: [number, number];
    }
  | {
      name: 'naturalEarth';
      center?: [number, number];
    }
   | {
      name: 'lambertConformalConic';
      center?: [number, number];
      parallels?: [number, number];
    }
  | {
      name: 'winkelTripel';
      center?: [number, number];
    };  

const getProjectionConfig = (projection: ProjectionType): ProjectionSpecification => {
  switch (projection) {
    case 'globe':
      return {
        name: 'globe',
        center: [0, 20],
      };
    case 'albers':
      return {
        name: 'albers',
        center: [-96, 23],
        parallels: [29.5, 45.5]
      };
    case 'equalEarth':
      return {
        name: 'equalEarth',
        center: [0, 0]
      };
    case 'naturalEarth':
      return {
        name: 'naturalEarth',
        center: [0, 0]
      };
    case 'lambertConformalConic':
      return {
        name: 'lambertConformalConic',
        center: [-96, 23],
        parallels: [29.5, 45.5]
      };
    case 'winkelTripel':
      return {
        name: 'winkelTripel',
        center: [0, 0]
      };  
    default:
      return 'mercator';
  }
};

export default function MapComponent() {
  const mapContainer = useRef(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<keyof typeof baseMaps>("Streets");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedProjection, setSelectedProjection] = useState<ProjectionType>('mercator');
  const [isGrayscale, setIsGrayscale] = useState(true);
  const [styleChangeCounter, setStyleChangeCounter] = useState(0);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventGeojson, setEventGeojson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [canadaMode, setCanadaMode] = useState(false);
  const [provinceAggregates, setProvinceAggregates] = useState<ProvinceData[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<{
  code: string;
  firstYear: number;
  lastYear: number;
} | null>(null);
const [provinceEvents, setProvinceEvents] = useState<FlowerData[]>([]);
  const [eventsVisible, setEventsVisible] = useState(true);
  
  // State for FlowerBudMarker and CalendarFlower components
  const [selectedCountry, setSelectedCountry] = useState<{
    code: string;
    firstYear: number;
    lastYear: number;
  } | null>(null);
  const [countryEvents, setCountryEvents] = useState<FlowerData[]>([]);
  const [countryAggregates, setCountryAggregates] = useState<CountryData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Apply filters to the event layer
  const applyFilters = () => {
    if (!mapInstance.current || !mapReady || !mapInstance.current.getLayer('dtfEvents-layer')) return;

    const map = mapInstance.current;
    let filters: (any[] | string)[] = ['all'];

    // Event type filter
    if (eventTypeFilter) {
      filters.push(['==', ['get', 'event_type'], eventTypeFilter]);
    }

    // Date range filter
    if (dateRange?.start && dateRange?.end) {
      const dateFilters: any[] = ['any'];

      // Drought overlaps
      dateFilters.push([
        'all',
        ['<=', ['get', 'dstart'], dateRange.end],  // starts before end
        ['>=', ['get', 'dend'], dateRange.start]   // ends after start
      ]);

      // Flood overlaps
      dateFilters.push([
        'all',
        ['<=', ['get', 'fstart'], dateRange.end],
        ['>=', ['get', 'fend'], dateRange.start]
      ]);

      filters.push(dateFilters);
    }

    const finalFilter = filters.length > 1 ? filters : ['all'];
    map.setFilter('dtfEvents-layer', finalFilter as any);
  };

  // Update the toggleProjection function
  const toggleProjection = async (projection: ProjectionType) => {
    if (!mapInstance.current) return;

    try {
      // First disable any interactivity
      mapInstance.current.getCanvas().style.pointerEvents = 'none';

      // Clean up existing sources/layers that might conflict
      if (mapInstance.current.getTerrain()) {
        mapInstance.current.setTerrain(null);
      }

      // Set the new projection
      const projectionConfig = getProjectionConfig(projection);
      mapInstance.current.setProjection(projectionConfig as mapboxgl.ProjectionSpecification);

      // Handle globe-specific setup
      if (projection === 'globe') {
        // Wait for the projection to be fully set
        await new Promise(resolve => {
          mapInstance.current?.once('idle', resolve);
        });

        // Add terrain source if not exists
        if (!mapInstance.current.getSource('mapbox-dem')) {
          mapInstance.current.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          });
        }

        // Wait for terrain source to load
        await new Promise(resolve => {
          const checkSource = () => {
            if (mapInstance.current?.getSource('mapbox-dem')) {
              resolve(true);
            } else {
              setTimeout(checkSource, 100);
            }
          };
          checkSource();
        });

        mapInstance.current.setTerrain({
          source: 'mapbox-dem',
          exaggeration: 1.5
        });

      } else {
        // For non-globe projections
        if (mapInstance.current) {
          mapInstance.current.setTerrain(null);
          mapInstance.current.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 1000
          });
        }
      }

      setSelectedProjection(projection);
    } catch (error) {
      console.error("Error changing projection:", error);
      // Fallback to mercator
      mapInstance.current?.setProjection('mercator');
      mapInstance.current?.setTerrain(null);
      setSelectedProjection('mercator');
    } finally {
            // Re-enable interactivity
      if (mapInstance.current) {
        mapInstance.current.getCanvas().style.pointerEvents = 'auto';
      }
    }
  };

  // Fetch country aggregates when map is ready
  useEffect(() => {
    if (!mapReady) return;

    const fetchCountryAggregates = async () => {
      setIsLoadingEvents(true);
      try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setCountryAggregates(data);
      } catch (error) {
        console.error('Error fetching country aggregates:', error);
        setError('Failed to fetch country data');
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchCountryAggregates();
  }, [mapReady]);

  // useEffect to fetch Canadian data when in Canada mode
useEffect(() => {
  if (!mapReady || !canadaMode) return;

  const fetchProvinceAggregates = async () => {
    setIsLoadingEvents(true);
    try {
      const response = await fetch('/api/canada/events');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setProvinceAggregates(data);
    } catch (error) {
      console.error('Error fetching province aggregates:', error);
      setError('Failed to fetch province data');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  fetchProvinceAggregates();
}, [mapReady, canadaMode]);

// Add toggle function for Canada mode
const toggleCanadaMode = () => {
  setCanadaMode(!canadaMode);
  setSelectedCountry(null);
  setSelectedProvince(null);
  // Reset other relevant states
};


  // Fetch detailed events when country is selected
  useEffect(() => {
    if (!selectedCountry) return;

    const fetchCountryEvents = async () => {
      setIsLoadingEvents(true);
      try {
        const response = await fetch(`/api/events?country=${selectedCountry.code}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setCountryEvents(data);
      } catch (error) {
        console.error('Error fetching country events:', error);
        setError('Failed to fetch country events');
      } finally {
        setIsLoadingEvents(false);
      }
    };

    fetchCountryEvents();
  }, [selectedCountry]);

  // Apply filters when they change
  useEffect(() => {
    if (mapReady && eventGeojson) {
      applyFilters();
    }
  }, [eventTypeFilter, dateRange, mapReady, eventGeojson]);

  // Handle events layer visibility
  useEffect(() => {
    if (mapInstance.current && mapReady && mapInstance.current.getLayer('dtfEvents-layer')) {
      mapInstance.current.setLayoutProperty(
        'dtfEvents-layer',
        'visibility',
        eventsVisible ? 'visible' : 'none'
      );
    }
  }, [eventsVisible, mapReady]);

  // Update the map initialization in the useEffect
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: baseMaps[selectedStyle],
      center: [0, 0],
      zoom: 2,
      projection: getProjectionConfig(selectedProjection)
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right"
    );

    mapInstance.current = map;

    map.on('load', () => {
      // Only add DEM source if we're using globe projection
      if (selectedProjection === 'globe') {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });

        map.once('sourcedata', () => {
          if (map.getSource('mapbox-dem')) {
            map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
          }
        });
      }
      
      setMapReady(true);
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

 
  // Apply grayscale filter
  const applyGrayscaleFilter = (map: mapboxgl.Map, enable: boolean) => {
    try {
      const canvas = map.getCanvas();
      if (canvas) {
        canvas.style.filter = enable ? 'grayscale(100%) contrast(1.1) brightness(0.9)' : 'none';
        canvas.style.pointerEvents = 'auto';
        map.triggerRepaint();
      }
    } catch (error) {
      console.error('Error applying grayscale filter:', error);
    }
  };

  // Effect for grayscale filter
  useEffect(() => {
    if (mapInstance.current && mapReady) {
      const timer = setTimeout(() => {
        applyGrayscaleFilter(mapInstance.current!, isGrayscale);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isGrayscale, mapReady, styleChangeCounter]);

  // Reset event type filter function
  const resetEventTypeFilter = () => {
    setEventTypeFilter(null);
  };

  // Reset date range filter function
  const resetDateRangeFilter = () => {
    setDateRange(null);
  };
//  reset loading state when map is ready and events are fetched
    useEffect(() => {
        if (mapReady && countryEvents.length > 0) {
        setIsLoadingEvents(false);
        }
    }, [mapReady, countryEvents]);

 return (
  <div className="relative h-[80vh] md:h-[80vh] flex flex-col md:flex-row bg-slate-50 overflow-hidden">
    
    {/* Mobile toggle button */}
    <button
      onClick={() => setSidebarOpen(true)}
      className="md:hidden absolute top-4 left-4 z-20 bg-white/90 p-2 rounded-full shadow-lg backdrop-blur-sm border border-slate-100 hover:bg-white transition-all"
    >
      <Menu className="w-5 h-5 text-slate-700" />
    </button>

    {/* Desktop sidebar */}
    <aside className="hidden md:flex md:w-72 md:flex-shrink-0 bg-white/80 backdrop-blur-md rounded-r-2xl shadow-lg border-r border-slate-100 transition-all flex-col h-full">
      <div className="flex-1 p-4 overflow-hidden">
        <MapSidebar
          sidebarOpen={true}
          setSidebarOpen={setSidebarOpen}
          selectedCountry={selectedCountry}
          selectedProvince={selectedProvince}
          setSelectedCountry={setSelectedCountry}
          setSelectedProvince={setSelectedProvince}
          countryEvents={countryEvents}
          provinceEvents={provinceEvents}
          countryAggregates={countryAggregates}
          provinceAggregates={provinceAggregates}
          error={error}
          isLoadingEvents={isLoadingEvents}
          eventTypeFilter={eventTypeFilter}
          setEventTypeFilter={setEventTypeFilter}
          dateRange={dateRange}
          setDateRange={setDateRange}
          resetEventTypeFilter={resetEventTypeFilter}
          resetDateRangeFilter={resetDateRangeFilter}
          eventsVisible={eventsVisible}
          setEventsVisible={setEventsVisible}
          eventGeojson={eventGeojson}
          canadaMode={canadaMode}
          toggleCanadaMode={toggleCanadaMode}
        />
      </div>
    </aside>

    {/* Mobile sidebar - similar updates needed here */}

    {/* Main map container */}
    <div className="flex-1 relative overflow-hidden">
      <div ref={mapContainer} className="h-full w-full" />
      
      {/* Canada mode toggle button - positioned appropriately */}
      <button
        onClick={toggleCanadaMode}
        className="absolute top-16 left-4 z-10 bg-white p-2 rounded-md shadow-lg hover:bg-gray-50 transition-colors"
      >
        {canadaMode ? 'World View' : 'Canada View'}
      </button>
      
      <LoadingOverlay isVisible={!mapReady || isLoadingEvents} />
      
      <MapControls
        map={mapInstance.current}
        mapReady={mapReady}
        isGrayscale={isGrayscale}
        onGrayscaleToggle={() => setIsGrayscale(!isGrayscale)}
        styleChangeCounter={styleChangeCounter}
        selectedProjection={selectedProjection}
        onProjectionChange={toggleProjection}
        selectedStyle={selectedStyle}
        onStyleChange={(style) => {
          setSelectedStyle(style as keyof typeof baseMaps);
          setStyleChangeCounter((prev) => prev + 1);
        }}
        baseMaps={baseMaps}
      />
      
      {/* Conditionally render either country OR province markers */}
      {mapReady && !canadaMode && countryAggregates.length > 0 && (
        <FlowerBudMarker 
          map={mapInstance.current!}
          data={countryAggregates.map(c => ({
            ...c,
            drought_events: c.drought_events ?? [],
            flood_events: c.flood_events ?? [],
            combined_events: c.combined_events ?? []
          }))}
          onClick={(code, firstYear, lastYear) => setSelectedCountry({ code, firstYear, lastYear })}
          budSize="large"
          budStyle="classic"
          locationCode={selectedCountry?.code ?? ""}
        />
      )}
      
      {mapReady && canadaMode && provinceAggregates.length > 0 && (
        <CanadaFlowerBudMarker 
          map={mapInstance.current!}
          data={provinceAggregates}
          onClick={(code, firstYear, lastYear) => setSelectedProvince({ code, firstYear, lastYear })}
          budSize="large"
          budStyle="classic"
          provinceCode={selectedProvince?.code ?? ""}
        />
      )}
      
      {/* Show either country or province calendar flower */}
      {selectedCountry && countryEvents.length > 0 && (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white p-4 rounded-lg shadow-xl">
        <button 
          onClick={() => setSelectedCountry(null)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <CalendarFlower 
          data={countryEvents.map(ev => ({
            ...ev,
            original_type: (ev as any).original_type ?? (ev as any).event_type ?? '',
            event_count: (ev as any).event_count ?? 0,
            total_events_in_month: (ev as any).total_events_in_month ?? 0,
            percentage: (ev as any).percentage ?? 0
          }))}
          locationCode={selectedCountry.code}
          locationType="country"
          firstYear={selectedCountry.firstYear}
          lastYear={selectedCountry.lastYear}
          width={500}
          height={500}
          eventTypeFilter={eventTypeFilter}
          dateRange={dateRange}
        />
      </div>
    )}
     {/* Province CalendarFlower */}
    {selectedProvince && provinceEvents.length > 0 && (
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white p-4 rounded-lg shadow-xl">
        <button 
          onClick={() => setSelectedProvince(null)}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <CalendarFlower 
          data={provinceEvents.map(ev => ({
            ...ev,
            original_type: (ev as any).original_type ?? (ev as any).event_type ?? '',
            event_count: (ev as any).event_count ?? 0,
            total_events_in_month: (ev as any).total_events_in_month ?? 0,
            percentage: (ev as any).percentage ?? 0
          }))}
          locationCode={selectedProvince.code}
          locationType="province"
          firstYear={selectedProvince.firstYear}
          lastYear={selectedProvince.lastYear}
          width={500}
          height={500}
          eventTypeFilter={eventTypeFilter}
          dateRange={dateRange}
        />
      </div>
    )}
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed md:hidden inset-0 bg-slate-900/40 backdrop-blur-sm z-10 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  </div>
);
}