"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Menu, X } from "lucide-react"; // Icons for toggle
import TimelineSlider from "./TimelineSlider";
import RegionSelector from "./RegionSelector";
import ProjectionSelector from "./ProjectionSelector";


const baseMaps = {
  Streets: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
  Topographic: `https://api.maptiler.com/maps/topo/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
  Satellite: `https://api.maptiler.com/maps/hybrid/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
  Outdoor: `https://api.maptiler.com/maps/outdoor/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
  
};

// Define our layer data with proper structure
const mapLayers = {
  droughtIndex: {
    id: "droughtIndex",
    name: "Drought Index",
    source: "drought-source",
    visible: true,
  },
  floodIndex: {
    id: "floodIndex",
    name: "Flood Index",
    source: "flood-source",
    visible: true,
  },
  historicalExtremes: {
    id: "historicalExtremes",
    name: "Historical Extremes",
    source: "historical-source",
    visible: true,
  },
  futureScenarios: {
    id: "futureScenarios",
    name: "Future Scenarios",
    source: "future-source",
    visible: true,
  }
};
type ProjectionType = 'mercator' | 'globe';

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
    };

const getProjectionConfig = (projection: ProjectionType): ProjectionSpecification => {
  if (projection === 'globe') {
    return {
      name: 'globe',
      center: [0, 0],
      parallels: [30, 30],
    };
  }

  // Return string for 'mercator'
  return 'mercator';
};

export default function MapComponent() {
  const mapContainer = useRef(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<keyof typeof baseMaps>("Streets");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedProjection, setSelectedProjection] = useState<ProjectionType>('mercator');
  const [isRecreating, setIsRecreating] = useState(false);
  const [isGrayscale, setIsGrayscale] = useState(true);
  const [styleChangeCounter, setStyleChangeCounter] = useState(0);
  
  
  // Track layer visibility with initial values
  const [visibleLayers, setVisibleLayers] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    Object.keys(mapLayers).forEach((key) => {
      const layerKey = key as keyof typeof mapLayers;
      initialState[layerKey] = mapLayers[layerKey].visible;
    });
    return initialState;
  });
  
  // Add a master toggle for all layers
  const [allLayersVisible, setAllLayersVisible] = useState(true);
  
const toggleProjection = async (projection: ProjectionType) => {
  if (!mapInstance.current) return;

  try {
    const targetProjection: ProjectionType = projection === 'globe' ? 'globe' : 'mercator';
    const projectionConfig = getProjectionConfig(targetProjection);

    if (targetProjection === 'globe') {
      if (!mapInstance.current.getSource('terrain')) {
        mapInstance.current.addSource('terrain', {
          type: 'raster-dem',
          url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
          tileSize: 256
        });
      }

      // Properly typed projection setting
      mapInstance.current.setProjection(projectionConfig as maplibregl.ProjectionSpecification);
      mapInstance.current.setTerrain({
        source: 'terrain',
        exaggeration: 1.5
      });

      mapInstance.current.easeTo({
        pitch: 60,
        zoom: Math.max(mapInstance.current.getZoom(), 2.5),
        duration: 1000
      });
    } else {
      // Properly typed projection setting
      mapInstance.current.setProjection('mercator' as maplibregl.ProjectionSpecification);
      mapInstance.current.setTerrain(null);
      mapInstance.current.easeTo({
        pitch: 0,
        duration: 1000
      });
    }

    setSelectedProjection(targetProjection);
  } catch (error) {
    console.error("Error changing projection:", error);
    // Proper fallback
    mapInstance.current.setProjection('mercator' as maplibregl.ProjectionSpecification);
    mapInstance.current.setTerrain(null);
    setSelectedProjection('mercator');
  }
};

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: baseMaps[selectedStyle],
      center: [0, 0],
      zoom: 2,
      //@ts-ignore
      projection: getProjectionConfig(selectedProjection)
    });

    map.addControl(new maplibregl.NavigationControl({ showZoom: true }), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right"
    );

    mapInstance.current = map;

   
    
    // Wait for map to load before adding layers
    map.on('load', () => {
        map.addSource('terrain', {
      type: 'raster-dem',
      url: 'https://demotiles.maplibre.org/terrain-tiles/tiles.json',
      tileSize: 256
    });
    
    // Set terrain if starting with globe
    if (selectedProjection === 'globe') {
      map.setTerrain({ source: 'terrain', exaggeration: 1.5 });
      map.easeTo({ pitch: 60, zoom: 2.5 });
    }
    
      // Add example layers to the map
      addMapLayers(map);

      setMapReady(true);
    });

    return () => map.remove();
  }, []);

  // effect to reapply grayscale when style changes
useEffect(() => {
  if (!mapInstance.current || !mapReady) return;
  
  const map = mapInstance.current;
  
  try {
    // Store the current layer visibility before changing style
    const currentVisibility = { ...visibleLayers };
    
    // Set up style change handling
    const handleStyleLoad = () => {
      // Re-add your map layers
      addMapLayers(map);
      
      // Restore visibility settings
      Object.keys(currentVisibility).forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(
            layerId, 
            'visibility', 
            currentVisibility[layerId] ? 'visible' : 'none'
          );
        }
      });
      
      // Increment counter to notify RegionSelector
      setStyleChangeCounter(prev => prev + 1);
      
      // Apply grayscale filter after a short delay
      setTimeout(() => {
        applyGrayscaleFilter(map, isGrayscale);
      }, 200);
    };
    
    // Single event listener for style changes
    map.once('styledata', handleStyleLoad);
    
    // Change the style
    map.setStyle(baseMaps[selectedStyle]);
    
  } catch (error) {
    console.error("Error changing map style:", error);
  }
}, [selectedStyle, mapReady]);

  // Function to add the map layers
  interface GeoJSONFeature {
    type: "Feature";
    geometry: {
      type: "Polygon";
      coordinates: number[][][];
    };
    properties: {
      intensity: number;
    };
  }

  interface GeoJSONSource {
    type: "geojson";
    data: {
      type: "FeatureCollection";
      features: GeoJSONFeature[];
    };
  }

  interface MapLayer {
    id: string;
    type: "fill";
    source: string;
    paint: {
      "fill-color": string;
      "fill-outline-color": string;
    };
    layout: {
      visibility: "visible" | "none";
    };
  }

  const addMapLayers = (map: maplibregl.Map) => {
    try {
      // Drought layer-dummy data
      if (!map.getSource("drought-source")) {
        const droughtSource: GeoJSONSource = {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [-10, -10],
                      [10, -10],
                      [10, 10],
                      [-10, 10],
                      [-10, -10],
                    ],
                  ],
                },
                properties: {
                  intensity: 0.8,
                },
              },
            ],
          },
        };
        map.addSource("drought-source", droughtSource);
      }

      if (!map.getLayer("droughtIndex")) {
        const droughtLayer: MapLayer = {
          id: "droughtIndex",
          type: "fill",
          source: "drought-source",
          paint: {
            "fill-color": "rgba(255, 0, 0, 0.5)",
            "fill-outline-color": "red",
          },
          layout: {
            visibility: visibleLayers["droughtIndex"] ? "visible" : "none",
          },
        };
        map.addLayer(droughtLayer);
      }

      // Flood layer-dummy-data
      if (!map.getSource("flood-source")) {
        const floodSource: GeoJSONSource = {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [-30, 10],
                      [-10, 10],
                      [-10, 30],
                      [-30, 30],
                      [-30, 10],
                    ],
                  ],
                },
                properties: {
                  intensity: 0.7,
                },
              },
            ],
          },
        };
        map.addSource("flood-source", floodSource);
      }

      if (!map.getLayer("floodIndex")) {
        const floodLayer: MapLayer = {
          id: "floodIndex",
          type: "fill",
          source: "flood-source",
          paint: {
            "fill-color": "rgba(0, 0, 255, 0.5)",
            "fill-outline-color": "blue",
          },
          layout: {
            visibility: visibleLayers["floodIndex"] ? "visible" : "none",
          },
        };
        map.addLayer(floodLayer);
      }

      // Historical extremes layer- dummy-data
      if (!map.getSource("historical-source")) {
        const historicalSource: GeoJSONSource = {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [10, 10],
                      [30, 10],
                      [30, 30],
                      [10, 30],
                      [10, 10],
                    ],
                  ],
                },
                properties: {
                  intensity: 0.5,
                },
              },
            ],
          },
        };
        map.addSource("historical-source", historicalSource);
      }

      if (!map.getLayer("historicalExtremes")) {
        const historicalLayer: MapLayer = {
          id: "historicalExtremes",
          type: "fill",
          source: "historical-source",
          paint: {
            "fill-color": "rgba(255, 255, 0, 0.5)",
            "fill-outline-color": "yellow",
          },
          layout: {
            visibility: visibleLayers["historicalExtremes"] ? "visible" : "none",
          },
        };
        map.addLayer(historicalLayer);
      }

      // Future scenarios layer- dummy-data
      if (!map.getSource("future-source")) {
        const futureSource: GeoJSONSource = {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [
                    [
                      [10, -30],
                      [30, -30],
                      [30, -10],
                      [10, -10],
                      [10, -30],
                    ],
                  ],
                },
                properties: {
                  intensity: 0.6,
                },
              },
            ],
          },
        };
        map.addSource("future-source", futureSource);
      }

      if (!map.getLayer("futureScenarios")) {
        const futureLayer: MapLayer = {
          id: "futureScenarios",
          type: "fill",
          source: "future-source",
          paint: {
            "fill-color": "rgba(0, 255, 0, 0.5)",
            "fill-outline-color": "green",
          },
          layout: {
            visibility: visibleLayers["futureScenarios"] ? "visible" : "none",
          },
        };
        map.addLayer(futureLayer);
      }
    } catch (error) {
      console.error("Error adding map layers:", error);
    }
  };

  // Handle style changes
  useEffect(() => {
    if (!mapInstance.current || !mapReady) return;
    
    const map = mapInstance.current;
    
    try {
      // Check if the current style is different from the selected style
      const sprite = map.getStyle().sprite;
      const currentStyleUrl = typeof sprite === "string" ? sprite.split('maps/')[1]?.split('/')[0] : null;
      const newStyleKey = selectedStyle.toLowerCase();
      
      // Skip if we can't determine the current style or it's the same as selected
      if (!currentStyleUrl || currentStyleUrl.includes(newStyleKey)) {
        return;
      }
      
      // Store the current layer visibility before changing style
      const currentVisibility = { ...visibleLayers };
      
      // Use a boolean flag to track when style has loaded
      let styleLoaded = false;
      
      map.once('styledata', () => {
        styleLoaded = true;
        
        // Re-add layers after style change
        addMapLayers(map);
        
        // Restore visibility settings
        Object.keys(currentVisibility).forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(
              layerId, 
              'visibility', 
              currentVisibility[layerId] ? 'visible' : 'none'
            );
          }
        });
      });
      
      map.setStyle(baseMaps[selectedStyle]);
      
      // Ensure layers are added even if styledata event doesn't fire
      const checkStyleLoaded = setTimeout(() => {
        if (!styleLoaded && mapInstance.current) {
          addMapLayers(mapInstance.current);
          
          // Restore visibility settings
          Object.keys(currentVisibility).forEach(layerId => {
            if (mapInstance.current && mapInstance.current.getLayer(layerId)) {
              mapInstance.current.setLayoutProperty(
                layerId, 
                'visibility', 
                currentVisibility[layerId] ? 'visible' : 'none'
              );
            }
          });
        }
      }, 1000);
      
      return () => clearTimeout(checkStyleLoaded);
    } catch (error) {
      console.error("Error changing map style:", error);
    }
  }, [selectedStyle, mapReady]);

  // Handle individual layer toggle
  interface LayerToggleEvent extends React.ChangeEvent<HTMLInputElement> {
    stopPropagation: () => void;
  }

  const handleLayerToggle = (layerId: string, e: LayerToggleEvent) => {
    // Stop event propagation to prevent parent click handlers from triggering
    if (e) {
      e.stopPropagation();
    }
    
    if (!mapInstance.current || !mapReady) {
      // Just update state if map isn't ready
      setVisibleLayers((prev: Record<string, boolean>) => {
        const newValue = !prev[layerId];
        return { ...prev, [layerId]: newValue };
      });
      return;
    }
    
    const map = mapInstance.current;
    
    setVisibleLayers((prev: Record<string, boolean>) => {
      const newValue = !prev[layerId];
      
      // Immediately update this specific layer's visibility
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(
          layerId,
          'visibility',
          newValue ? 'visible' : 'none'
        );
      }
      
      const updatedLayers = { ...prev, [layerId]: newValue };
      
      // Check if all layers are now visible or invisible
      const areAllVisible = Object.values(updatedLayers).every(value => value === true);
      const areAllHidden = Object.values(updatedLayers).every(value => value === false);
      
      if (areAllVisible && !allLayersVisible) {
        setAllLayersVisible(true);
      } else if (areAllHidden && allLayersVisible) {
        setAllLayersVisible(false);
      } else if (!areAllVisible && !areAllHidden && (areAllVisible !== allLayersVisible)) {
        setAllLayersVisible(areAllVisible);
      }
      
      return updatedLayers;
    });
  };

  // Handle the "all layers" toggle
  interface AllLayersToggleEvent extends React.ChangeEvent<HTMLInputElement> {
    stopPropagation: () => void;
  }

  const handleAllLayersToggle = (e: AllLayersToggleEvent) => {
    // Stop event propagation
    if (e) {
      e.stopPropagation();
    }
    
    const newValue = !allLayersVisible;
    setAllLayersVisible(newValue);
    
    // Update all individual layer toggles
    const updatedLayers: Record<string, boolean> = { ...visibleLayers };
    Object.keys(updatedLayers).forEach(key => {
      updatedLayers[key] = newValue;
    });
    setVisibleLayers(updatedLayers);
    
    // If the map is ready, update all layers' visibility
    if (mapInstance.current && mapReady) {
      const map = mapInstance.current;
      Object.keys(updatedLayers).forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(
            layerId,
            'visibility',
            newValue ? 'visible' : 'none'
          );
        }
      });
    }
  };

  const sidebarContent = (
    <>
      <h2 className="text-xl md:text-xl font-semibold tracking-tight text-white bg-[#424955] px-4 py-2 rounded-md shadow-sm mb-4 flex items-center gap-2">
        Explore Layers
      </h2>

      <div className="space-y-3 bg-slate-50/70 p-3 rounded-xl" id="map-section">
        {Object.keys(mapLayers).map((key) => (
          <div key={key} className="flex items-center justify-between group p-2 hover:bg-white rounded-lg transition-all cursor-pointer">
            <label className="text-sm font-medium text-slate-700 flex items-center cursor-pointer w-full">
              <div className="relative w-9 h-5 mr-3">
                <input
                  type="checkbox"
                  checked={visibleLayers[key] || false}
                  onChange={(e) => handleLayerToggle(key, e)}
                  className="peer sr-only"
                />
                <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
              </div>
              {mapLayers[key as keyof typeof mapLayers].name}
            </label>
          </div>
        ))}
      </div>

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

      <div className="mt-6 bg-slate-50/70 p-4 rounded-xl">
        <label className="block text-sm font-semibold mb-3 text-slate-700 flex items-center">
          <span className="bg-purple-500/10 p-1 rounded-md mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </span>
          Tools & Controls
        </label>
        
        <div className="flex items-center justify-between mb-4 hover:bg-white rounded-lg transition-all cursor-pointer">
      <label htmlFor="all-layers-visibility" className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
        <span>Layer Visibility</span>
        <div className="relative w-9 h-5">
          <input
            id="all-layers-visibility"
            type="checkbox"
            checked={allLayersVisible}
            onChange={(e) => handleAllLayersToggle(e)}
            className="peer sr-only"
          />
          
          <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500 cursor-pointer block"></div>
        </div>
      </label>
    </div>
        
        <div className="mb-5">
          <label className="text-sm text-slate-700 block mb-2">Time Range</label>
          <TimelineSlider/>
        </div>
        
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
  useEffect(() => {
  if (mapInstance.current && mapReady) {
    const timer = setTimeout(() => {
      applyGrayscaleFilter(mapInstance.current!, isGrayscale);
    }, 100);
    
    return () => clearTimeout(timer);
  }
}, [isGrayscale, mapReady, styleChangeCounter]);

const applyGrayscaleFilter = (map: maplibregl.Map, enable: boolean) => {
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



  return (
    <div className="relative h-[80vh] md:h-[80vh] flex flex-col md:flex-row bg-slate-50">
      {/* Mobile toggle button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden absolute top-4 left-4 z-20 bg-white/90 p-2 rounded-full shadow-lg backdrop-blur-sm border border-slate-100 hover:bg-white transition-all"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {/* Sidebar for desktop - always visible */}
      <aside className="hidden md:block md:w-72 md:flex-shrink-0 bg-white/80 backdrop-blur-md rounded-r-2xl shadow-lg p-6 space-y-5 overflow-y-auto border-r border-slate-100 transition-all">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar - conditionally visible */}
      <aside
        className={`
          fixed md:hidden top-0 left-0 z-20 h-full w-72 bg-white/90 backdrop-blur-md shadow-xl p-6 space-y-5 overflow-y-auto transition-all duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close button for mobile */}
        <div className="flex justify-end mb-2">
          <button onClick={() => setSidebarOpen(false)} className="text-slate-600 hover:text-slate-800 bg-slate-100 p-1.5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Map container */}
      <div className="flex-1 relative md:ml-0">
        
         {/* Region Selector */}
       <RegionSelector 
  map={mapInstance.current} 
  mapReady={mapReady} 
  isGrayscale={isGrayscale}
  onGrayscaleToggle={() => setIsGrayscale(!isGrayscale)}
  styleChangeCounter={styleChangeCounter} // Add this new prop
/>
        
      {/* Projection selector to the bottom left */}
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

