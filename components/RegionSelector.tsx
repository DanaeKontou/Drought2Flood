import { useEffect, useState, useCallback, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface RegionSelectorProps {
  map: mapboxgl.Map | null;
  mapReady: boolean;
  isGrayscale: boolean;
  onGrayscaleToggle: () => void;
  styleChangeCounter?: number;
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
  
  // Refs to maintain current state in event handlers
  const selectedRegionRef = useRef<string | null>(null);
  const hoveredFeatureRef = useRef<string | null>(null);
  const countriesData = useRef<any>(null);
  const lastStyleChangeCounter = useRef(0);
  const layerReloadTimer = useRef<NodeJS.Timeout | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    selectedRegionRef.current = selectedRegion;
  }, [selectedRegion]);

  useEffect(() => {
    hoveredFeatureRef.current = hoveredFeature;
  }, [hoveredFeature]);

  // Get country identifier from feature
  const getCountryId = (feature: CountryFeature): string | null => {
    const props = feature.properties;
    return props?.NAME || props?.name || props?.id || props?.ISO_A3 || null;
  };

  // Apply grayscale filter to the map canvas
  const applyGrayscaleFilter = useCallback((mapInstance: mapboxgl.Map) => {
    if (!mapInstance) return;
    
    try {
      const canvas = mapInstance.getCanvas();
      if (isGrayscale) {
        canvas.style.filter = 'grayscale(1)';
      } else {
        canvas.style.filter = 'none';
      }
    } catch (error) {
      console.error('Error applying grayscale filter:', error);
    }
  }, [isGrayscale]);

  // Event handlers that use refs to avoid stale closures
  const handleCountryClick = useCallback((e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
    try {
      if (!e.features || e.features.length === 0) return;
      
      const feature = e.features[0] as CountryFeature;
      const countryId = getCountryId(feature);
      
      if (countryId) {
        const currentSelection = selectedRegionRef.current;
        const newSelection = currentSelection === countryId ? null : countryId;
        
        setSelectedRegion(newSelection);
        setDebugInfo(`Selected: ${newSelection || 'None'}`);
      }
    } catch (error) {
      console.error('Click handler error:', error);
    }
  }, []);

  const handleCountryMouseEnter = useCallback((e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
    try {
      if (!map || !e.features || e.features.length === 0) return;
      
      map.getCanvas().style.cursor = 'pointer';
      const feature = e.features[0] as CountryFeature;
      const countryId = getCountryId(feature);
      
      if (countryId && countryId !== selectedRegionRef.current) {
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

  const handleMapClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    try {
      if (!map) return;
      
      const features = map.queryRenderedFeatures(e.point, { 
        layers: ['countries-fill'] 
      });
      if (features.length === 0) {
        setSelectedRegion(null);
        setDebugInfo('Selection cleared');
      }
    } catch (error) {
      console.error('Map click handler error:', error);
    }
  }, [map]);

  // Setup event listeners
  const setupEventListeners = useCallback((mapInstance: mapboxgl.Map) => {
    if (!mapInstance) return;
    
    try {
      // Remove existing listeners
      mapInstance.off('click', 'countries-fill', handleCountryClick as any);
      mapInstance.off('mouseenter', 'countries-fill', handleCountryMouseEnter as any);
      mapInstance.off('mouseleave', 'countries-fill', handleCountryMouseLeave);
      mapInstance.off('click', handleMapClick as any);
      
      // Add new listeners
      mapInstance.on('click', 'countries-fill', handleCountryClick as any);
      mapInstance.on('mouseenter', 'countries-fill', handleCountryMouseEnter as any);
      mapInstance.on('mouseleave', 'countries-fill', handleCountryMouseLeave);
      mapInstance.on('click', handleMapClick as any);
      
      setDebugInfo('Event listeners attached');
    } catch (error) {
      console.error('Error setting up event listeners:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [handleCountryClick, handleCountryMouseEnter, handleCountryMouseLeave, handleMapClick]);

  // Add region layers to the map
  const addRegionLayers = useCallback(async (mapInstance: mapboxgl.Map, forceReload = false) => {
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
      const layersToRemove = ['countries-highlight', 'countries-border', 'countries-fill', 'countries-color-restore'];
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

      // Add base fill layer for interactions (transparent)
      mapInstance.addLayer({
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': 'rgba(0, 0, 0, 0)',
          'fill-opacity': 1
        }
      });

      // Add border layer
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

      // Add highlight layer
      mapInstance.addLayer({
        id: 'countries-highlight',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': 'rgba(0, 0, 0, 0)',
          'fill-opacity': 1
        }
      });

      // Add color restoration layer for grayscale mode
      mapInstance.addLayer({
        id: 'countries-color-restore',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': 'rgba(0, 0, 0, 0)',
          'fill-opacity': 1
        }
      });

      // Setup event listeners and apply initial styles
      setTimeout(() => {
        setupEventListeners(mapInstance);
        setCountriesLoaded(true);
        applyGrayscaleFilter(mapInstance);
        updateLayerStyles(mapInstance);
        setDebugInfo(`Ready - Click to select countries`);
      }, 200);

    } catch (error) {
      console.error('Error loading country data:', error);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
      }, [setupEventListeners, applyGrayscaleFilter]);

  // Update layer styles based on current state
  const updateLayerStyles = useCallback((mapInstance: mapboxgl.Map) => {
    if (!mapInstance || !countriesLoaded) return;

    try {
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

      // Color restoration layer for grayscale mode
      if (mapInstance.getLayer('countries-color-restore')) {
        if (isGrayscale && (selectedRegion || hoveredFeature)) {
          // Use a vibrant color with screen blend mode to punch through grayscale
          mapInstance.setPaintProperty('countries-color-restore', 'fill-color', [
            'case',
            ['==', ['get', 'NAME'], selectedRegion || ''],
            '#FF6B35', // Vibrant orange for selected (shows well through grayscale)
            ['==', ['get', 'NAME'], hoveredFeature || ''],
            '#4ECDC4', // Vibrant teal for hovered (shows well through grayscale)
            'rgba(0, 0, 0, 0)'
          ]);
          
          mapInstance.setPaintProperty('countries-color-restore', 'fill-opacity', [
            'case',
            ['==', ['get', 'NAME'], selectedRegion || ''],
            0.9,
            ['==', ['get', 'NAME'], hoveredFeature || ''],
            0.7,
            0
          ]);
        } else {
          mapInstance.setPaintProperty('countries-color-restore', 'fill-color', 'rgba(0, 0, 0, 0)');
          mapInstance.setPaintProperty('countries-color-restore', 'fill-opacity', 0);
        }
      }

      // Apply the grayscale filter
      applyGrayscaleFilter(mapInstance);

    } catch (error) {
      console.error('Error updating layer styles:', error);
    }
      }, [selectedRegion, hoveredFeature, countriesLoaded, isGrayscale, applyGrayscaleFilter]);

  // Initialize when map is ready
  useEffect(() => {
    if (map && mapReady && !countriesLoaded) {
      addRegionLayers(map);
    }
  }, [map, mapReady, addRegionLayers, countriesLoaded]);

  // Handle style changes - reload layers when base map changes
  useEffect(() => {
    if (map && mapReady && styleChangeCounter > 0 && styleChangeCounter !== lastStyleChangeCounter.current) {
      lastStyleChangeCounter.current = styleChangeCounter;
      
      // Clear existing timer
      if (layerReloadTimer.current) {
        clearTimeout(layerReloadTimer.current);
      }
      
      // Store current selection to restore after reload
      const currentSelection = selectedRegion;
      
      setCountriesLoaded(false);
      setDebugInfo('Reloading layers after style change...');
      
      // Delay to ensure base map style has fully loaded
      layerReloadTimer.current = setTimeout(() => {
        addRegionLayers(map, true).then(() => {
          // Restore selection after layers are reloaded
          if (currentSelection) {
            setSelectedRegion(currentSelection);
            setDebugInfo(`Restored selection: ${currentSelection}`);
          }
        });
      }, 500);
    }
  }, [styleChangeCounter, map, mapReady, addRegionLayers, selectedRegion]);

  // Update styles when selection/hover/grayscale changes
  useEffect(() => {
    if (map && countriesLoaded) {
      updateLayerStyles(map);
    }
  }, [selectedRegion, hoveredFeature, isGrayscale, map, countriesLoaded, updateLayerStyles]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (layerReloadTimer.current) {
        clearTimeout(layerReloadTimer.current);
      }
      if (map) {
        try {
          map.off('click', 'countries-fill', handleCountryClick as any);
          map.off('mouseenter', 'countries-fill', handleCountryMouseEnter as any);
          map.off('mouseleave', 'countries-fill', handleCountryMouseLeave);
          map.off('click', handleMapClick as any);
          
          // Remove grayscale filter on cleanup
          const canvas = map.getCanvas();
          if (canvas) {
            canvas.style.filter = 'none';
          }
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      }
    };
  }, [map, handleCountryClick, handleCountryMouseEnter, handleCountryMouseLeave, handleMapClick]);

  return (
    <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-lg space-y-4 max-w-sm scale-75 md:scale-100 origin-bottom-left">
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
            onClick={() => {
              setSelectedRegion(null);
              setDebugInfo('Selection cleared');
            }}
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
          ? "Click countries to select/deselect" 
          : "Loading country data..."
        }
        {/* {isGrayscale && (
          <div className="mt-1 text-blue-600 text-xs">
             Grayscale mode: Selected/hovered to highlight a country
          </div>
        )} */}
      </div>
    </div>
  );
};

export default RegionSelector;