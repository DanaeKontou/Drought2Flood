import { useEffect, useState, useCallback, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface RegionSelectorProps {
  map: maplibregl.Map | null;
  mapReady: boolean;
  isGrayscale: boolean;
  onGrayscaleToggle: () => void;
  styleChangeCounter?: number; // New prop to detect style changes
}

interface CountryFeature {
  type: 'Feature';
  properties: {
    NAME?: string;
    name?: string;
    id?: string;
    ISO_A3?: string;
    [key: string]: any;
  };
  geometry: any;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({ 
  map, 
  mapReady, 
  isGrayscale, 
  onGrayscaleToggle,
  styleChangeCounter = 0 
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [countriesLoaded, setCountriesLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Keep track of event listeners to avoid duplicates
  const eventListenersAdded = useRef(false);
  const countriesData = useRef<any>(null);

  // Get country identifier from feature
  const getCountryId = (feature: CountryFeature): string | null => {
    const props = feature.properties;
    return props?.NAME || props?.name || props?.id || props?.ISO_A3 || null;
  };

  // Event handlers with better error handling
  const handleCountryClick = useCallback((e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
    try {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0] as CountryFeature;
      const countryId = getCountryId(feature);
      
      if (countryId) {
        setSelectedRegion(prev => prev === countryId ? null : countryId);
        setDebugInfo(`Selected: ${countryId}`);
      }
    } catch (error) {
      console.error('Click handler error:', error);
    }
  }, []);

  const handleCountryMouseEnter = useCallback((e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
    try {
      if (!map || !e.features || e.features.length === 0) return;
      
      map.getCanvas().style.cursor = 'pointer';
      const feature = e.features[0] as CountryFeature;
      const countryId = getCountryId(feature);
      
      if (countryId) {
        setHoveredFeature(countryId);
      }
    } catch (error) {
      console.error('Mouse enter handler error:', error);
    }
  }, [map]);

  const handleCountryMouseLeave = useCallback(() => {
    try {
      if (!map) return;
      
      map.getCanvas().style.cursor = '';
      setHoveredFeature(null);
    } catch (error) {
      console.error('Mouse leave handler error:', error);
    }
  }, [map]);

  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    try {
      if (!map) return;
      
      const features = map.queryRenderedFeatures(e.point, { 
        layers: ['countries-fill'] 
      });
      if (features.length === 0) {
        setSelectedRegion(null);
      }
    } catch (error) {
      console.error('Map click handler error:', error);
    }
  }, [map]);

  // Remove event listeners
  const removeEventListeners = useCallback(() => {
    if (!map || !eventListenersAdded.current) return;
    
    try {
      map.off('click', 'countries-fill', handleCountryClick as any);
      map.off('mouseenter', 'countries-fill', handleCountryMouseEnter as any);
      map.off('mouseleave', 'countries-fill', handleCountryMouseLeave);
      map.off('click', handleMapClick as any);
      eventListenersAdded.current = false;
    } catch (error) {
      console.error('Error removing event listeners:', error);
    }
  }, [map, handleCountryClick, handleCountryMouseEnter, handleCountryMouseLeave, handleMapClick]);

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    if (!map || eventListenersAdded.current) return;
    
    try {
      // Remove any existing listeners first
      removeEventListeners();
      
      // Add new listeners
      map.on('click', 'countries-fill', handleCountryClick as any);
      map.on('mouseenter', 'countries-fill', handleCountryMouseEnter as any);
      map.on('mouseleave', 'countries-fill', handleCountryMouseLeave);
      map.on('click', handleMapClick as any);
      
      eventListenersAdded.current = true;
      setDebugInfo('Event listeners attached');
    } catch (error) {
      console.error('Error setting up event listeners:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [map, handleCountryClick, handleCountryMouseEnter, handleCountryMouseLeave, handleMapClick, removeEventListeners]);

  // Add country layers to the map
  const addRegionLayers = useCallback(async (mapInstance: maplibregl.Map, forceReload = false) => {
    if (!mapInstance) return;

    try {
      setDebugInfo('Loading country boundaries...');
      
      // Load country data if not already loaded
      if (!countriesData.current || forceReload) {
        const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        countriesData.current = await response.json();
        setDebugInfo(`Loaded ${countriesData.current.features?.length} countries`);
      }

      // Remove existing layers and source if they exist
      const layersToRemove = ['countries-highlight', 'countries-border', 'countries-fill'];
      layersToRemove.forEach(layerId => {
        if (mapInstance.getLayer(layerId)) {
          mapInstance.removeLayer(layerId);
        }
      });
      
      if (mapInstance.getSource('countries')) {
        mapInstance.removeSource('countries');
      }

      // Add source
      mapInstance.addSource('countries', {
        type: 'geojson',
        data: countriesData.current
      });

      // Add layers in correct order (bottom to top)
      mapInstance.addLayer({
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': 'rgba(0, 0, 0, 0)',
          'fill-opacity': 1
        }
      });

      mapInstance.addLayer({
        id: 'countries-border',
        type: 'line',
        source: 'countries',
        paint: {
          'line-color': 'rgba(100, 116, 139, 0.3)',
          'line-width': 1,
          'line-opacity': 1
        }
      });

      mapInstance.addLayer({
        id: 'countries-highlight',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': 'rgba(0, 0, 0, 0)',
          'fill-opacity': 1
        }
      });

      // Wait a bit then setup event listeners
      setTimeout(() => {
        setupEventListeners();
        setCountriesLoaded(true);
        updateLayerStyles(mapInstance);
      }, 200);

    } catch (error) {
      console.error('Error loading country data:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [setupEventListeners]);

  // Update layer styles based on current state
  const updateLayerStyles = useCallback((mapInstance: maplibregl.Map) => {
    if (!mapInstance || !countriesLoaded) return;

    try {
      // Update fill colors
      if (mapInstance.getLayer('countries-fill')) {
        mapInstance.setPaintProperty('countries-fill', 'fill-color', [
          'case',
          ['==', ['get', 'NAME'], selectedRegion || ''],
          'rgba(59, 130, 246, 0.1)',
          'rgba(0, 0, 0, 0)'
        ]);
      }

      // Update border styles
      if (mapInstance.getLayer('countries-border')) {
        mapInstance.setPaintProperty('countries-border', 'line-color', [
          'case',
          ['==', ['get', 'NAME'], selectedRegion || ''],
          '#1d4ed8',
          ['==', ['get', 'NAME'], hoveredFeature || ''],
          '#3b82f6',
          'rgba(100, 116, 139, 0.3)'
        ]);

        mapInstance.setPaintProperty('countries-border', 'line-width', [
          'case',
          ['==', ['get', 'NAME'], selectedRegion || ''],
          3,
          ['==', ['get', 'NAME'], hoveredFeature || ''],
          2,
          1
        ]);
      }

      // Update highlight layer
      if (mapInstance.getLayer('countries-highlight')) {
        mapInstance.setPaintProperty('countries-highlight', 'fill-color', [
          'case',
          ['==', ['get', 'NAME'], selectedRegion || ''],
          'rgba(59, 130, 246, 0.2)',
          ['==', ['get', 'NAME'], hoveredFeature || ''],
          'rgba(59, 130, 246, 0.1)',
          'rgba(0, 0, 0, 0)'
        ]);
      }
    } catch (error) {
      console.error('Error updating layer styles:', error);
    }
  }, [selectedRegion, hoveredFeature, countriesLoaded]);

  // Initialize when map is ready
  useEffect(() => {
    if (map && mapReady && !countriesLoaded) {
      addRegionLayers(map);
    }
  }, [map, mapReady, addRegionLayers, countriesLoaded]);

  // Handle style changes - reload layers when base map changes
  useEffect(() => {
    if (map && mapReady && styleChangeCounter > 0) {
      setCountriesLoaded(false);
      eventListenersAdded.current = false;
      
      // Small delay to ensure base map style has loaded
      setTimeout(() => {
        addRegionLayers(map, true);
      }, 300);
    }
  }, [styleChangeCounter, map, mapReady, addRegionLayers]);

  // Update styles when selection/hover changes
  useEffect(() => {
    if (map && countriesLoaded) {
      updateLayerStyles(map);
    }
  }, [selectedRegion, hoveredFeature, map, countriesLoaded, updateLayerStyles]);

  // Cleanup
  useEffect(() => {
    return () => {
      removeEventListeners();
    };
  }, [removeEventListeners]);

  return (
    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-lg space-y-4 max-w-sm">
      <div className="text-xs bg-gray-100 p-2 rounded font-mono whitespace-pre-wrap max-h-20 overflow-y-auto">
        {debugInfo || 'Waiting for interaction...'}
      </div>
      
      <div className="flex items-center space-x-3">
        <label className="text-sm font-medium text-slate-800">Grayscale Mode</label>
        <button
          onClick={onGrayscaleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isGrayscale ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isGrayscale ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {selectedRegion && (
        <div className="text-sm text-slate-600">
          Selected: <span className="font-medium text-blue-600">{selectedRegion}</span>
          <button
            onClick={() => setSelectedRegion(null)}
            className="ml-2 text-red-500 hover:text-red-700 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {hoveredFeature && hoveredFeature !== selectedRegion && (
        <div className="text-xs text-slate-500">
          Hover: <span className="font-medium">{hoveredFeature}</span>
        </div>
      )}

      <div className="text-xs text-slate-500">
        {countriesLoaded 
          ? "Click on countries to select them" 
          : "Loading country data..."
        }
      </div>
    </div>
  );
};

export default RegionSelector;