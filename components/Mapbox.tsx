"use client";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Menu, X } from "lucide-react";
import TimelineSlider from "./TimelineSlider";
import RegionSelector from "./RegionSelector";
import ProjectionSelector from "./CustomProjection"; 
import FlowerBudMarker from './FlowerBudMarker';
import CalendarFlower from './CalendarFlower';


import type { FlowerData, LocationData, CountryData as OriginalCountryData } from '@/@types/FlowerData';

// Extend CountryData to include average_severity and event arrays
type CountryData = OriginalCountryData & {
  drought_events?: any[];
  flood_events?: any[];
  combined_events?: any[];
};
  
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

  // Get unique event types from data
  const getUniqueEventTypes = () => {
    console.log('Getting unique event types from eventGeojson:', eventGeojson?.features?.length || 0, 'items');
    if (!eventGeojson || !eventGeojson.features || eventGeojson.features.length === 0) return [];
    
    const eventTypes = [
      ...new Set(
        eventGeojson.features
          .map((feature) => feature.properties?.event_type)
          .filter(Boolean)
      )
    ].sort();
    console.log('Unique event types found:', eventTypes);
    return eventTypes;
  };

  // Get date range from data
  const getDateRange = () => {
    if (!eventGeojson || !eventGeojson.features || eventGeojson.features.length === 0) return { min: '', max: '' };

    let minDate = '';
    let maxDate = '';

    eventGeojson.features.forEach(feature => {
      const props = feature.properties;
      if (props) {
        const dates = [props.dstart, props.dend, props.fstart, props.fend].filter(Boolean);
        dates.forEach(date => {
          if (date && typeof date === 'string') {
            if (!minDate || date < minDate) minDate = date;
            if (!maxDate || date > maxDate) maxDate = date;
          }
        });
      }
    });

    return { min: minDate, max: maxDate };
  };


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

  // Sidebar content
  const sidebarContent = (
    <>
      <h2 className="text-xl md:text-xl font-semibold tracking-tight text-white bg-[#424955] px-4 py-2 rounded-md shadow-sm mb-4 flex items-center gap-2">
        Explore Events
      </h2>

      {/* Events Layer Toggle */}
      <div className="space-y-3 bg-slate-50/70 p-3 rounded-xl mb-4">
        <div className="flex items-center justify-between group p-2 hover:bg-white rounded-lg transition-all cursor-pointer">
          <label className="text-sm font-medium text-slate-700 flex items-center cursor-pointer w-full">
            <div className="relative w-9 h-5 mr-3">
              <input
                type="checkbox"
                checked={eventsVisible}
                onChange={(e) => setEventsVisible(e.target.checked)}
                className="peer sr-only"
              />
              <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
            </div>
            Climate Events Layer
          </label>
        </div>
      </div>

      {/* Event Type Filter */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Event Type</label>
        <div className="space-y-2">
          <select
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={eventTypeFilter || ''}
            onChange={(e) => setEventTypeFilter(e.target.value || null)}
            disabled={isLoadingEvents}
          >
            <option value="">All Types</option>
            {getUniqueEventTypes().map(type => (
              <option key={type} value={type} className="capitalize">
                {type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          {eventTypeFilter && (
            <button
              onClick={resetEventTypeFilter}
              className="w-full text-sm text-red-600 hover:text-red-800 py-1 cursor-pointer"
            >
              Clear Event Type Filter
            </button>
          )}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Filter by Date Range</label>
        <div className="space-y-2">
          <div>
            <label className="text-sm text-slate-600">Start Date</label>
            <input
              type="date"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              min={getDateRange().min}
              max={getDateRange().max}
              value={dateRange?.start || ''}
              onChange={(e) =>
                setDateRange((prev) => ({
                  ...prev,
                  start: e.target.value,
                  end: prev?.end || '',
                }))
              }
              disabled={isLoadingEvents}
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">End Date</label>
            <input
              type="date"
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              min={dateRange?.start || getDateRange().min}
              max={getDateRange().max}
              value={dateRange?.end || ''}
              onChange={(e) =>
                setDateRange((prev) => ({
                  ...prev,
                  start: prev?.start || '',
                  end: e.target.value,
                }))
              }
              disabled={isLoadingEvents}
            />
          </div>
          
          {dateRange && (dateRange.start || dateRange.end) && (
            <button
              onClick={resetDateRangeFilter}
              className="w-full text-sm text-red-600 hover:text-red-800 py-1 cursor-pointer"
            >
              Clear Date Filter
            </button>
          )}
        </div>
      </div>

      {/* Case Studies */}
      <div className="mt-6">
        <label className="block text-sm font-semibold mb-2 text-slate-700">Local Case Studies</label>
        <div className="relative">
          <select className="w-full appearance-none bg-white border border-slate-200 text-slate-700 py-2.5 px-4 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all cursor-pointer">
            <option value="">World View</option>
            <option>Kitui</option>
            <option>Iquitos</option>
            <option>Canada</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Export View & Feedback section */}
      <div className="mt-6 bg-slate-50/70 p-4 rounded-xl">
        <label className="block text-sm font-semibold mb-3 text-slate-700 flex items-center">
          <span className="bg-purple-500/10 p-1 rounded-md mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </span>
          Tools Panel
        </label>
        
        <div className="space-y-3 pt-2">
          <button className="w-full flex items-center justify-center text-sm bg-emerald-500 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            Export View
          </button>
          <button className="w-full flex items-center justify-center text-sm bg-purple-500 text-white px-4 py-2.5 rounded-lg hover:bg-purple-600 transition-colors shadow-sm cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            Send Feedback
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative h-[80vh] md:h-[80vh] flex flex-col md:flex-row bg-slate-50">
      
      {/* Mobile toggle button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden absolute top-4 left-4 z-20 bg-white/90 p-2 rounded-full shadow-lg backdrop-blur-sm border border-slate-100 hover:bg-white transition-all"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {/* Sidebar for desktop */}
      <aside className="hidden md:block md:w-72 md:flex-shrink-0 bg-white/80 backdrop-blur-md rounded-r-2xl shadow-lg p-6 space-y-5 overflow-y-auto border-r border-slate-100 transition-all">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`
          fixed md:hidden top-0 left-0 z-20 h-full w-72 bg-white/90 backdrop-blur-md shadow-xl p-6 space-y-5 overflow-y-auto transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex justify-end mb-2">
          <button onClick={() => setSidebarOpen(false)} className="text-slate-600 hover:text-slate-800 bg-slate-100 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Loading overlay */}
{isLoadingEvents && (
  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm">
    <div className="p-8 rounded-2xl shadow-2xl border border-white/20 flex flex-col items-center space-y-6">
      {/* Enhanced orbital loader with rings */}
      <div className="relative w-20 h-20">
        {/* Outer ring */}
        <div className="absolute inset-0 animate-spin-slow">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2 shadow-lg"></div>
          <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2 shadow-lg"></div>
        </div>

        {/* Middle ring */}
        <div className="absolute inset-2 animate-spin-reverse">
          <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-400 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2 shadow-lg"></div>
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2 shadow-lg"></div>
        </div>

        {/* Core */}
        <div className="w-6 h-6 bg-gradient-to-r from-slate-700 to-slate-800 rounded-full absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg animate-pulse"></div>

        {/* Subtle glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 animate-pulse"></div>
      </div>

      {/* Loading text */}
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-white animate-pulse">
          Fetching climate events around the globe<span className="inline-block animate-bounce">…</span>
        </p>
        <p className="text-sm text-gray-200">
         Analyzing environmental data worldwide. Please wait...
        </p>
      </div>
    </div>
  </div>
)}


      {/* Map container */}
      <div className="flex-1 relative md:ml-0">
        
        <RegionSelector 
          map={mapInstance.current} 
          mapReady={mapReady} 
          isGrayscale={isGrayscale}
          onGrayscaleToggle={() => setIsGrayscale(!isGrayscale)}
          styleChangeCounter={styleChangeCounter}
        />
        
        <ProjectionSelector 
          selectedProjection={selectedProjection}
          onChange={toggleProjection}
          className="absolute bottom-14 left-4 z-10"
        />
        
        {/* Base map selector */}
        <div className="absolute bottom-14 right-4 z-10 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl px-4 py-3 shadow-lg transition-opacity hover:bg-white/90">
          <label className="block text-sm font-medium text-slate-800 mb-2">Base Map</label>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value as keyof typeof baseMaps)}
            className="text-sm w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
          >
            {Object.keys(baseMaps).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
        {/* Add FlowerBudMarker component */}
    {mapReady && countryAggregates.length > 0 && (
      <FlowerBudMarker 
        map={mapInstance.current!}
        data={countryAggregates.map(c => ({
          ...c,
          drought_events: c.drought_events ?? [],
          flood_events: c.flood_events ?? [],
          combined_events: c.combined_events ?? []
        }))}
        onClick={(code, firstYear, lastYear) => setSelectedCountry({ code, firstYear, lastYear })}
        budSize="large"      // Options: 'small' | 'medium' | 'large'
        budStyle="modern"    // Options: 'classic' | 'modern' | 'minimal'
      />
    )}

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
      firstYear={selectedCountry.firstYear}
      lastYear={selectedCountry.lastYear}
      width={500}
      height={500}
      eventTypeFilter={eventTypeFilter}
      dateRange={dateRange}
    />
  </div>
)}
   <div ref={mapContainer} className="w-full h-full rounded-2xl shadow-inner" />
      </div>
      
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed md:hidden inset-0 bg-slate-900/40 backdrop-blur-sm z-10 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
