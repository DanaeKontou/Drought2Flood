
  // Normalize date strings to YYYY-MM-DD format
  // const normalizeDate = (input: string | Date): string => {
  //   const date = new Date(input);
  //   if (isNaN(date.getTime())) return ''; // Skip invalid
  //   return date.toISOString().split('T')[0]; // Keep YYYY-MM-DD only
  // };

  // Normalize all event features once when loading them
  // interface EventProperties {
  //   event_type?: string;
  //   dstart?: string | Date;
  //   dend?: string | Date;
  //   fstart?: string | Date;
  //   fend?: string | Date;
  //   severity_count?: number;
  //   [key: string]: any;
  // }

  // interface EventFeature extends GeoJSON.Feature {
  //   properties: EventProperties;
  // }

  // interface EventGeoJSON extends GeoJSON.FeatureCollection {
  //   features: EventFeature[];
  // }

  // const normalizeEventGeojson = (geojson?: EventGeoJSON): EventGeoJSON | null => {
  //   if (!geojson?.features) return null;
    
  //   return {
  //     ...geojson,
  //     features: geojson.features.map((feature: EventFeature) => {
  //       const props = feature.properties || {};
  //       return {
  //         ...feature,
  //         id: feature.id || `${props.event_type}-${Math.random().toString(36).substr(2, 9)}`,
  //         properties: {
  //           ...props,
  //           dstart: props.dstart ? normalizeDate(props.dstart) : '',
  //           dend: props.dend ? normalizeDate(props.dend) : '',
  //           fstart: props.fstart ? normalizeDate(props.fstart) : '',
  //           fend: props.fend ? normalizeDate(props.fend) : '',
  //         },
  //       };
  //     }),
  //   };
  // };

    // Add event layer to map
    // const addEventLayer = (map: mapboxgl.Map, data: GeoJSON.FeatureCollection) => {
    //   try {
    //     // Remove existing layer if it exists
    //     if (map.getLayer('dtfEvents-layer')) {
    //       map.removeLayer('dtfEvents-layer');
    //     }
    //     if (map.getSource('dtfEvents')) {
    //       map.removeSource('dtfEvents');
    //     }
  
    //     // Add source
    //     map.addSource('dtfEvents', {
    //       type: 'geojson',
    //       data,
    //     });
  
    //     // Add layer
    //     map.addLayer({
    //       id: 'dtfEvents-layer',
    //       type: 'circle',
    //       source: 'dtfEvents',
    //       paint: {
    //         'circle-radius': [
    //           'case',
    //           ['has', 'severity_count'],
    //           ['max', 4, ['min', 12, ['*', ['get', 'severity_count'], 2]]],
    //           4
    //         ],
    //         'circle-color': [
    //           'case',
    //           ['==', ['get', 'event_type'], 'drought'], '#e63946',
    //           ['==', ['get', 'event_type'], 'flood'], '#2596be',
    //           ['==', ['get', 'event_type'], 'extreme'], '#f1c40f',
    //           ['==', ['get', 'event_type'], 'drought_to_flood'], '#db4d25',
    //           '#9c27b0'
    //         ],
    //         'circle-stroke-width': 2,
    //         'circle-stroke-color': [
    //           'case',
    //           ['==', ['get', 'event_type'], 'extreme'], '#333333',
    //           '#ffffff'
    //         ],
    //         'circle-opacity': [
    //           'interpolate',
    //           ['linear'],
    //           ['get', 'severity_count'],
    //           1, 0.4,
    //           10, 1
    //         ]
    //       },
    //       layout: {
    //         visibility: eventsVisible ? 'visible' : 'none'
    //       }
    //     });
  
    //     // Add click handler
    //     map.on('click', 'dtfEvents-layer', (e) => {
    //       if (e.features && e.features[0]) {
    //         const props = e.features[0].properties;
    //         const popup = new mapboxgl.Popup({ offset: 15 })
    //           .setLngLat(e.lngLat)
    //           .setHTML(`
    //             <div class="p-3">
    //               <h3 class="font-semibold text-lg mb-2 capitalize">${props?.event_type || 'Unknown'} Event</h3>
    //               <div class="space-y-1 text-sm">
    //                 ${props?.dstart ? `<p><strong>Drought Start:</strong> ${props.dstart}</p>` : ''}
    //                 ${props?.dend ? `<p><strong>Drought End:</strong> ${props.dend}</p>` : ''}
    //                 ${props?.fstart ? `<p><strong>Flood Start:</strong> ${props.fstart}</p>` : ''}
    //                 ${props?.fend ? `<p><strong>Flood End:</strong> ${props.fend}</p>` : ''}
    //                 ${props?.severity_count ? `<p><strong>Severity:</strong> ${props.severity_count}</p>` : ''}
    //               </div>
    //             </div>
    //           `)
    //           .addTo(map);
    //       }
    //     });
  
    //     // Add hover effects
    //     map.on('mouseenter', 'dtfEvents-layer', () => {
    //       map.getCanvas().style.cursor = 'pointer';
    //     });
  
    //     map.on('mouseleave', 'dtfEvents-layer', () => {
    //       map.getCanvas().style.cursor = '';
    //     });
  
    //   } catch (error) {
    //     console.error('Error adding event layer:', error);
    //   }
    // };
    // Fetch events data for map visualization
    // useEffect(() => {
    //   if (!mapReady || !mapInstance.current) return;
  
    //   const fetchEvents = async () => {
    //     setIsLoadingEvents(true);
    //     try {
    //       const response = await fetch('/api/events');
    //       if (!response.ok) {
    //         throw new Error(`HTTP error! status: ${response.status}`);
    //       }
    //       const rawData = await response.json();
  
    //       // Normalize dates before using anywhere else
    //       const normalizedData = normalizeEventGeojson(rawData);
  
    //       // Set normalized data
    //       setEventGeojson(normalizedData);
  
    //       // Add normalized data to the map
    //       if (normalizedData) {
    //         addEventLayer(mapInstance.current!, normalizedData);
    //       }
    //     } catch (error) {
    //       console.error('Error fetching events:', error);
    //       setEventGeojson(null);
    //       setError('Failed to fetch event data');
    //     } finally {
    //       setIsLoadingEvents(false);
    //     }
    //   };
  
    //   fetchEvents();
    // }, [mapReady]);

     // Handle style changes
      // useEffect(() => {
      //   if (!mapInstance.current || !mapReady) return;
        
      //   const map = mapInstance.current;
        
      //   try {
      //     const handleStyleLoad = () => {
      //       if (eventGeojson) {
      //         addEventLayer(map, eventGeojson);
      //       }
      //       setStyleChangeCounter(prev => prev + 1);
      //       setTimeout(() => {
      //         applyGrayscaleFilter(map, isGrayscale);
      //       }, 200);
      //     };
          
      //     map.once('styledata', handleStyleLoad);
      //     map.setStyle(baseMaps[selectedStyle]);
          
      //   } catch (error) {
      //     console.error("Error changing map style:", error);
      //   }
      // }, [selectedStyle, mapReady]);
