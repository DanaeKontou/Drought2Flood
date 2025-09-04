// components/FlowerBudMarker.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface CountryData {
  country_code: string;
  year_count: number;
  first_year: number;
  last_year: number;
  centroid: {
    type: 'Point';
    coordinates: [number, number];
  };
  drought_events?: any[];
  flood_events?: any[];
  combined_events?: any[];
}

interface FlowerBudMarkerProps {
  locationCode: string;
  map: mapboxgl.Map | null;
  provinceCode?: string;
  data: CountryData[];
  onClick: (locationCode: string, firstYear: number, lastYear: number) => void;
  budSize?: 'small' | 'medium' | 'large'; // New prop for size control
  budStyle?: 'classic' | 'modern' | 'minimal'; // New prop for style control
}

const getColorByCount = (total: number) => {
  if (total <= 20) return '#4CAF50';     // Green
  if (total <= 40) return '#FFC107';     // Yellow
  if (total <= 60) return '#FF9800';     // Orange
  return '#F44336';                      // Red
};

// Enhanced color scheme with gradients
const getEnhancedColorByCount = (total: number, style: string) => {
  const colors = {
    classic: {
      low: { primary: '#4CAF50', secondary: '#66BB6A', accent: '#81C784' },
      medium: { primary: '#FFC107', secondary: '#FFD54F', accent: '#FFE082' },
      high: { primary: '#FF9800', secondary: '#FFB74D', accent: '#FFCC80' },
      critical: { primary: '#F44336', secondary: '#EF5350', accent: '#E57373' }
    },
    modern: {
      low: { primary: '#00E676', secondary: '#1DE9B6', accent: '#64FFDA' },
      medium: { primary: '#FF6D00', secondary: '#FF8F00', accent: '#FFB300' },
      high: { primary: '#D500F9', secondary: '#E040FB', accent: '#EA80FC' },
      critical: { primary: '#FF1744', secondary: '#FF5722', accent: '#FF7043' }
    },
    minimal: {
      low: { primary: '#2196F3', secondary: '#42A5F5', accent: '#64B5F6' },
      medium: { primary: '#607D8B', secondary: '#78909C', accent: '#90A4AE' },
      high: { primary: '#795548', secondary: '#8D6E63', accent: '#A1887F' },
      critical: { primary: '#424242', secondary: '#616161', accent: '#757575' }
    }
  };

  const styleColors = colors[style as keyof typeof colors] || colors.classic;
  
  if (total <= 20) return styleColors.low;
  if (total <= 40) return styleColors.medium;
  if (total <= 60) return styleColors.high;
  return styleColors.critical;
};

const FlowerBudMarker = ({ 
  map, 
  data, 
  onClick, 
  budSize = 'medium',
  budStyle = 'classic'
}: FlowerBudMarkerProps) => {
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const hoveredFeatureId = useRef<string | number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(false);
  const addedImagesRef = useRef<Set<string>>(new Set());
  const eventHandlersRef = useRef<{ [key: string]: (e: any) => void }>({});

  // Size configurations
  const sizeConfig = {
    small: { base: 24, multiplier: 1.5, maxAdd: 12 },
    medium: { base: 30, multiplier: 2, maxAdd: 20 },
    large: { base: 40, multiplier: 2.5, maxAdd: 30 }
  };

  // Enhanced flower bud icon creation
  const createFlowerBudIcon = (size: number, locationCode: string, countryData: CountryData): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const budRadius = size * 0.32;
    const colors = getEnhancedColorByCount(countryData.year_count, budStyle);

    // Create gradients
    const budGradient = ctx.createRadialGradient(
      centerX - budRadius * 0.3, centerY - budRadius * 0.3, 0,
      centerX, centerY, budRadius
    );
    budGradient.addColorStop(0, colors.accent);
    budGradient.addColorStop(0.6, colors.primary);
    budGradient.addColorStop(1, colors.secondary);

    const stemGradient = ctx.createLinearGradient(
      centerX - 2, centerY + budRadius,
      centerX + 2, size - 5
    );
    stemGradient.addColorStop(0, '#4CAF50');
    stemGradient.addColorStop(1, '#2E7D32');

    // Enhanced stem with better proportions
    ctx.strokeStyle = stemGradient;
    ctx.lineWidth = Math.max(2, size * 0.08);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + budRadius * 0.8);
    ctx.lineTo(centerX, size - 8);
    ctx.stroke();

    // Enhanced leaves with better positioning
    const leafSize = Math.max(6, size * 0.15);
    const leafOffset = budRadius + leafSize;
    
    // Left leaf
    ctx.fillStyle = '#4CAF50';
    ctx.save();
    ctx.translate(centerX - leafSize * 0.8, centerY + leafOffset);
    ctx.rotate(-Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(0, 0, leafSize, leafSize * 0.5, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Leaf highlight
    ctx.fillStyle = '#66BB6A';
    ctx.beginPath();
    ctx.ellipse(-leafSize * 0.2, -leafSize * 0.1, leafSize * 0.3, leafSize * 0.2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Right leaf
    ctx.fillStyle = '#4CAF50';
    ctx.save();
    ctx.translate(centerX + leafSize * 0.8, centerY + leafOffset + leafSize * 0.3);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.ellipse(0, 0, leafSize, leafSize * 0.5, 0, 0, 2 * Math.PI);
    ctx.fill();
    // Leaf highlight
    ctx.fillStyle = '#66BB6A';
    ctx.beginPath();
    ctx.ellipse(-leafSize * 0.2, -leafSize * 0.1, leafSize * 0.3, leafSize * 0.2, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();

    // Enhanced flower bud base (calyx) with gradient
    const calyxGradient = ctx.createLinearGradient(
      centerX, centerY + budRadius * 0.5,
      centerX, centerY + budRadius * 1.1
    );
    calyxGradient.addColorStop(0, '#4CAF50');
    calyxGradient.addColorStop(1, '#2E7D32');
    
    ctx.fillStyle = calyxGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + budRadius * 0.9, budRadius * 0.7, budRadius * 0.35, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Main flower bud with enhanced gradient
    ctx.fillStyle = budGradient;
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, budRadius, budRadius * 1.3, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Inner petal detail
    ctx.fillStyle = colors.accent;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - budRadius * 0.15, budRadius * 0.65, budRadius * 0.9, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Multiple highlights for depth
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(centerX - budRadius * 0.25, centerY - budRadius * 0.4, budRadius * 0.2, budRadius * 0.25, 0, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.ellipse(centerX + budRadius * 0.15, centerY - budRadius * 0.6, budRadius * 0.15, budRadius * 0.2, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Enhanced country code background with rounded corners
    const textBgWidth = Math.max(20, locationCode.length * 6);
    const textBgHeight = 14;
    const borderRadius = 4;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(
      centerX - textBgWidth / 2, 
      centerY - textBgHeight / 2, 
      textBgWidth, 
      textBgHeight, 
      borderRadius
    );
    ctx.fill();

    // Enhanced country code text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.max(7, size * 0.2)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 1;
    ctx.fillText(locationCode, centerX, centerY);
    ctx.shadowBlur = 0;

    return canvas.toDataURL();
  };

  // Safely format severity values
  const formatSeverity = (severity: any): string => {
    if (severity === null || severity === undefined) return 'N/A';
    if (typeof severity === 'number' && !isNaN(severity)) {
      return severity.toFixed(1);
    }
    if (typeof severity === 'string') {
      const num = parseFloat(severity);
      if (!isNaN(num)) {
        return num.toFixed(1);
      }
    }
    return String(severity) || 'N/A';
  };

  // Helper function to determine primary event type
  const getPrimaryEventType = (country: CountryData): string => {
    const counts = {
      drought: country.drought_events?.length || 0,
      flood: country.flood_events?.length || 0,
      combined: country.combined_events?.length || 0
    };
    const max = Math.max(counts.drought, counts.flood, counts.combined);
    if (max === 0) return 'None';
    if (counts.drought === max) return 'Drought';
    if (counts.flood === max) return 'Flood';
    return 'Combined';
  };

  // Safe layer and source checking functions
  const safeGetLayer = (map: mapboxgl.Map, layerId: string) => {
    try {
      return map.getStyle() && map.getLayer && map.getLayer(layerId);
    } catch (error) {
      return null;
    }
  };

  const safeGetSource = (map: mapboxgl.Map, sourceId: string) => {
    try {
      return map.getStyle() && map.getSource && map.getSource(sourceId);
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (!map || !data.length) return;

    // Wait for map to be fully loaded
    if (!map.isStyleLoaded()) {
      const onStyleLoad = () => {
        map.off('styledata', onStyleLoad);
        // Re-trigger effect after style is loaded
        if (mountedRef.current) {
          setIsLoading(true);
        }
      };
      map.on('styledata', onStyleLoad);
      return;
    }

    mountedRef.current = true;
    setIsLoading(true);

    const sourceId = 'flower-buds-source';
    const layerId = 'flower-buds-layer';

    const cleanup = () => {
      try {
        // Remove popup
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }

        // Remove event handlers
        if (eventHandlersRef.current && safeGetLayer(map, layerId)) {
          Object.entries(eventHandlersRef.current).forEach(([event, handler]) => {
            try {
              map.off(event as any, layerId, handler);
            } catch (e) {
              console.log(`Could not remove ${event} handler`);
            }
          });
          eventHandlersRef.current = {};
        }

        // Reset hover state before removing layer
        if (hoveredFeatureId.current !== null && safeGetSource(map, sourceId)) {
          try {
            map.setFeatureState(
              { source: sourceId, id: hoveredFeatureId.current },
              { hover: false }
            );
          } catch (e) {
            console.log('Could not reset feature state during cleanup');
          }
          hoveredFeatureId.current = null;
        }

        // Remove layer if exists
        if (safeGetLayer(map, layerId)) {
          try {
            map.removeLayer(layerId);
          } catch (e) {
            console.log('Could not remove layer');
          }
        }

        // Remove source if exists
        if (safeGetSource(map, sourceId)) {
          try {
            map.removeSource(sourceId);
          } catch (e) {
            console.log('Could not remove source');
          }
        }
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    };

    cleanup();

    // Create features with enhanced sizing
    const config = sizeConfig[budSize];
    const features = data.map((country, index) => {
      // Get severity from first available event
      let severity = null;
      if (country.drought_events?.length) {
        severity = country.drought_events[0]?.severity;
      } else if (country.flood_events?.length) {
        severity = country.flood_events[0]?.severity;
      } else if (country.combined_events?.length) {
        severity = country.combined_events[0]?.severity;
      }

      return {
        type: 'Feature' as const,
        geometry: country.centroid,
        properties: {
          country_code: country.country_code,
          year_count: country.year_count,
          first_year: country.first_year,
          last_year: country.last_year,
          size: config.base + Math.min(country.year_count * config.multiplier, config.maxAdd),
          total_events: (country.drought_events?.length || 0) + 
                       (country.flood_events?.length || 0) + 
                       (country.combined_events?.length || 0),
          primary_event_type: getPrimaryEventType(country),
          severity: formatSeverity(severity)
        },
        id: `${country.country_code}-${index}-${Date.now()}`
      };
    });

    const geojsonData = {
      type: 'FeatureCollection' as const,
      features
    };

    // Add source
    try {
      if (!safeGetSource(map, sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojsonData
        });
      }
    } catch (error) {
      console.error('Error adding source:', error);
      return;
    }

    const loadIcons = async () => {
      try {
        for (const feature of features) {
          const iconName = `flower-bud-${feature.properties.country_code}-${budSize}-${budStyle}`;
          
          if (addedImagesRef.current.has(iconName)) continue;
          
          const countryData = data.find(c => c.country_code === feature.properties.country_code);
          if (!countryData) continue;
          
          const img = new Image();
          img.src = createFlowerBudIcon(
            feature.properties.size,
            feature.properties.country_code,
            countryData
          );
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Failed to load image'));
          });
          
          if (mountedRef.current && !map.hasImage(iconName)) {
            map.addImage(iconName, img);
            addedImagesRef.current.add(iconName);
          }
        }
      } catch (error) {
        console.error('Error loading icons:', error);
      }
    };

    const addLayer = () => {
      if (!mountedRef.current || safeGetLayer(map, layerId)) return;

      try {
        map.addLayer({
          id: layerId,
          type: 'symbol',
          source: sourceId,
          layout: {
            'icon-image': ['concat', 'flower-bud-', ['get', 'country_code'], `-${budSize}-${budStyle}`],
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              1, 0.4,
              3, 0.6,
              5, 0.8,
              8, 1,
              12, 1.2,
              15, 1.4
            ],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          },
          paint: {
            'icon-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              1,
              0.85
            ]
          }
        });

        // Enhanced event handlers
        const handleMouseEnter = (e: mapboxgl.MapMouseEvent) => {
          if (!e.features?.length || !e.features[0].id) return;
          
          const feature = e.features[0];
          map.getCanvas().style.cursor = 'pointer';
          
          // Reset previous hover state
          if (hoveredFeatureId.current !== null) {
            try {
              map.setFeatureState(
                { source: sourceId, id: hoveredFeatureId.current },
                { hover: false }
              );
            } catch (e) {
              console.log('Could not reset previous hover state');
            }
          }
          
          hoveredFeatureId.current = feature.id as string | number;
          
          // Set new hover state
          try {
            if (feature.id !== undefined && feature.id !== null) {
              map.setFeatureState(
                { source: sourceId, id: feature.id },
                { hover: true }
              );
            }
          } catch (e) {
            console.log('Could not set hover state');
          }

          // Create enhanced popup
          if (feature.geometry && 'coordinates' in feature.geometry) {
            const coordinates = [...feature.geometry.coordinates] as [number, number];
            
            // Remove existing popup
            if (popupRef.current) {
              popupRef.current.remove();
            }
            
            // Create new popup with better styling and positioning
            popupRef.current = new mapboxgl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: [0, -40], // Increased offset to clear the flower bud
              maxWidth: '300px',
              className: 'flower-bud-popup'
            })
              .setLngLat(coordinates)
              .setHTML(`
                <div style="
                  padding: 12px; 
                  font-size: 13px; 
                  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); 
                  border-radius: 8px; 
                  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                  border: 1px solid #e9ecef;
                  min-width: 200px;
                  position: relative;
                  z-index: 1000;
                ">
                  <div style="
                    font-weight: bold; 
                    margin-bottom: 8px; 
                    color: #2c3e50;
                    font-size: 16px;
                    text-align: center;
                    padding-bottom: 6px;
                    border-bottom: 2px solid #3498db;
                  ">
                    ${feature.properties?.country_code || 'N/A'}
                  </div>
                  <div style="color: #34495e; line-height: 1.6; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="font-weight: 500;">Period:</span>
                      <span>${feature.properties?.first_year || 'N/A'}-${feature.properties?.last_year || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="font-weight: 500;">Years with events:</span>
                      <span style="color: #e74c3c; font-weight: bold;">${feature.properties?.year_count || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="font-weight: 500;">Total events:</span>
                      <span style="color: #8e44ad; font-weight: bold;">${feature.properties?.total_events || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="font-weight: 500;">Dominant type:</span>
                      <span style="color: #2980b9; font-weight: bold;">${feature.properties?.primary_event_type || 'N/A'}</span>
                    </div>
                    ${(feature.properties && feature.properties.severity !== 'N/A') ? `
                      <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: 500;">Severity:</span>
                        <span style="color: #d35400; font-weight: bold;">${feature.properties.severity}</span>
                      </div>
                    ` : ''}
                  </div>
                  <div style="
                    position: absolute;
                    bottom: -6px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 6px solid #ffffff;
                  "></div>
                </div>
              `)
              .addTo(map);
          }
        };

        const handleMouseLeave = () => {
          map.getCanvas().style.cursor = '';
          
          // Reset hover state
          if (hoveredFeatureId.current !== null) {
            try {
              map.setFeatureState(
                { source: sourceId, id: hoveredFeatureId.current },
                { hover: false }
              );
            } catch (e) {
              console.log('Could not reset hover state on leave');
            }
            hoveredFeatureId.current = null;
          }
          
          // Remove popup
          if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
          }
        };

        const handleClick = (e: mapboxgl.MapMouseEvent) => {
          if (!e.features?.length) return;
          const props = e.features[0].properties || {};
          onClick(props.country_code, props.first_year, props.last_year);
        };

        // Store handlers for cleanup
        eventHandlersRef.current = {
          mouseenter: handleMouseEnter,
          mouseleave: handleMouseLeave,
          click: handleClick
        };

        // Add event listeners
        map.on('mouseenter', layerId, handleMouseEnter);
        map.on('mouseleave', layerId, handleMouseLeave);
        map.on('click', layerId, handleClick);

      } catch (error) {
        console.error('Error adding layer:', error);
      }
    };

    const initialize = async () => {
      try {
        await loadIcons();
        if (mountedRef.current) {
          addLayer();
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [map, data, onClick, budSize, budStyle]);

  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return null;
};

export default FlowerBudMarker;