// utils/exportUtils.ts
import type { CountryData } from '@/@types/FlowerData';

// Define the FlowerData type based on your actual data structure
interface FlowerData {
  year: number;
  month: number;
  event_type: 'Drought' | 'Flood' | 'DtoF' | 'DroughtFlood';
  original_type: string;
  event_count: number;
  severity: number;
  total_events_in_month: number;
  percentage: number;
  centroid?: any; // GeoJSON point for the country/region
}

// Enhanced CSV generation for aggregated data
export const generateCSV = (data: FlowerData[], includeGeometry: boolean = false) => {
  if (!data || data.length === 0) {
    return 'No data available for export';
  }

  // Define headers for aggregated data
  const baseHeaders = [
    'year',
    'month', 
    'event_type',
    'original_type',
    'event_count',
    'severity',
    'total_events_in_month',
    'percentage'
  ];

  const geoHeaders = includeGeometry ? ['longitude', 'latitude'] : [];
  const headers = [...baseHeaders, ...geoHeaders];
  
  // Generate CSV rows
  const rows = data.map(item => {
    const row: string[] = [];
    
    headers.forEach(header => {
      let value = '';
      
      if (header === 'longitude' && item.centroid?.coordinates) {
        value = item.centroid.coordinates[0]?.toString() || '';
      } else if (header === 'latitude' && item.centroid?.coordinates) {
        value = item.centroid.coordinates[1]?.toString() || '';
      } else if (item.hasOwnProperty(header)) {
        value = (item as any)[header];
      }
      
      // Properly escape CSV values
      if (typeof value === 'string') {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
      }
      
      row.push(value.toString());
    });
    
    return row.join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

// Enhanced GeoJSON generation for aggregated data
export const generateGeoJSON = (data: FlowerData[], locationCode?: string) => {
  // Convert aggregated data to GeoJSON features
  const features = data.map((item, index) => ({
    type: 'Feature',
    id: `${locationCode || 'unknown'}_${item.year}_${item.month}_${item.event_type}_${index}`,
    properties: {
      year: item.year,
      month: item.month,
      event_type: item.event_type,
      original_type: item.original_type,
      event_count: item.event_count,
      severity: item.severity,
      total_events_in_month: item.total_events_in_month,
      percentage: item.percentage,
      country_code: locationCode || 'unknown'
    },
    geometry: item.centroid || {
      type: 'Point',
      coordinates: [0, 0] // Fallback coordinates
    }
  }));

  return JSON.stringify({
    type: 'FeatureCollection',
    features: features,
    metadata: {
      exportDate: new Date().toISOString(),
      featureCount: features.length,
      dataType: 'aggregated_monthly_events',
      locationCode: locationCode
    }
  }, null, 2);
};

// File download utility (unchanged)
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Enhanced data filtering for aggregated data
export const filterEventsByType = (
  data: FlowerData[], 
  eventType: 'all' | 'drought' | 'flood' | 'd2f' | 'both'
) => {
  if (eventType === 'all') return data;
  
  return data.filter(item => {
    const itemEventType = item.event_type.toLowerCase();
    
    switch (eventType) {
      case 'drought':
        return itemEventType === 'drought';
      case 'flood':
        return itemEventType === 'flood';
      case 'd2f':
        return itemEventType === 'dtof';
      case 'both':
        return itemEventType === 'drought' || itemEventType === 'flood';
      default:
        return true;
    }
  });
};

export const filterEventsByYear = (
  data: FlowerData[], 
  year: number | 'all'
) => {
  if (year === 'all') return data;
  
  return data.filter(item => item.year === year);
};

export const filterEventsByDateRange = (
  data: FlowerData[], 
  dateRange: { start: string; end: string } | null
) => {
  if (!dateRange || (!dateRange.start && !dateRange.end)) return data;
  
  return data.filter(item => {
    // Create date string from year and month (first day of month)
    const eventDate = `${item.year}-${item.month.toString().padStart(2, '0')}-01`;
    
    let passesFilter = true;
    
    if (dateRange.start) {
      passesFilter = passesFilter && eventDate >= dateRange.start;
    }
    
    if (dateRange.end) {
      // For end date, include the entire month
      const endOfMonth = new Date(item.year, item.month, 0).toISOString().split('T')[0];
      passesFilter = passesFilter && endOfMonth <= dateRange.end;
    }
    
    return passesFilter;
  });
};

// Generate filename based on export options
export const generateFilename = (options: {
  eventType: 'all' | 'drought' | 'flood' | 'd2f' | 'both';
  year: number | 'all';
  format: 'csv' | 'geojson';
  country?: string;
}) => {
  const timestamp = new Date().toISOString().split('T')[0];
  const country = options.country || 'unknown';
  const eventType = options.eventType === 'all' ? 'all-events' : options.eventType;
  const yearStr = options.year === 'all' ? 'all-years' : options.year.toString();
  
  return `dtf-calendar-export_${country}_${yearStr}_${eventType}_${timestamp}.${options.format}`;
};

// Main export processing function for aggregated data
export const processExportData = (
  countryEvents: FlowerData[], // This is your aggregated data
  countryAggregates: CountryData[],
  options: {
    eventType: 'all' | 'drought' | 'flood' | 'd2f' | 'both';
    year: number | 'all';
    projection: 'WGS84' | 'WebMercator';
    format: 'csv' | 'geojson';
    country?: string;
  }
) => {
  if (!countryEvents || countryEvents.length === 0) {
    throw new Error('No event data available for export');
  }

  let filteredData = [...countryEvents];

  // Filter by event type
  filteredData = filterEventsByType(filteredData, options.eventType);

  // Filter by year
  filteredData = filterEventsByYear(filteredData, options.year);

  // Generate export content
  let content: string;
  let mimeType: string;

  if (options.format === 'csv') {
    content = generateCSV(filteredData, true); // Include geometry columns
    mimeType = 'text/csv';
  } else {
    content = generateGeoJSON(filteredData, options.country);
    mimeType = 'application/geo+json';
  }

  // Generate filename
  const filename = generateFilename(options);

  return {
    content,
    filename,
    mimeType,
    featureCount: filteredData.length
  };
};