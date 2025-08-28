import React, {useState} from 'react';
import { X } from 'lucide-react';
import type { CountryData } from '@/@types/FlowerData';
import ExportViewModal from './ExportViewModal';
import { processExportData, downloadFile } from '@/utils/exportUtils';

// Define FlowerData type if not already imported
type FlowerData = any; // Replace 'any' with the actual structure if known

interface MapSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedCountry: { code: string; firstYear: number; lastYear: number } | null;
  setSelectedCountry: React.Dispatch<React.SetStateAction<{ code: string; firstYear: number; lastYear: number } | null>>;
  countryEvents: FlowerData[];
  countryAggregates: CountryData[];
  error: string | null;
  eventsVisible: boolean;
  setEventsVisible: (visible: boolean) => void;
  eventTypeFilter: string | null;
  setEventTypeFilter: (filter: string | null) => void;
  dateRange: { start: string; end: string } | null;
  setDateRange: (range: { start: string; end: string } | null) => void;
  isLoadingEvents: boolean;
  eventGeojson: GeoJSON.FeatureCollection | null;
  resetEventTypeFilter: () => void;
  resetDateRangeFilter: () => void;
  // Add these new props for export functionality
  mapBounds?: { north: number; south: number; east: number; west: number };
  getMapBounds?: () => { north: number; south: number; east: number; west: number };
}

const MapSidebar: React.FC<MapSidebarProps> = ({
   sidebarOpen,
  setSidebarOpen,
  selectedCountry,
  setSelectedCountry,
  countryEvents,
  countryAggregates,
  error,
  eventsVisible,
  setEventsVisible,
  eventTypeFilter,
  setEventTypeFilter,
  dateRange,
  setDateRange,
  isLoadingEvents,
  eventGeojson,
  mapBounds,
  getMapBounds,
}) => {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Updated handleExport function that actually performs the export
 const handleExport = (options: {
  eventType: 'all' | 'drought' | 'flood' | 'd2f' | 'both';
  year: number | 'all';
  projection: 'WGS84' | 'WebMercator';
  format: 'csv' | 'geojson';
  country?: string;
}) => {
  try {
    console.log('Exporting with options:', options);

    // For calendar flower data, we use countryEvents (aggregated data)
    if (!countryEvents || countryEvents.length === 0) {
      alert('No event data available for export. Please ensure a country is selected and data is loaded.');
      return;
    }

    // Validate country selection
    if (!selectedCountry) {
      alert('Please select a country for export.');
      return;
    }

    // Apply any active UI filters to the data before export
    let filteredData = [...countryEvents];

    // Apply event type filter from UI (if one is set)
    if (eventTypeFilter) {
      filteredData = filteredData.filter(d => d.event_type === eventTypeFilter);
    }

    // Apply date range filter from UI (if one is set)
    if (dateRange && (dateRange.start || dateRange.end)) {
      filteredData = filteredData.filter(d => {
        const eventDate = `${d.year}-${d.month.toString().padStart(2,'0')}-01`;
        let passesFilter = true;
        
        if (dateRange.start) {
          passesFilter = passesFilter && eventDate >= dateRange.start;
        }
        
        if (dateRange.end) {
          const endOfMonth = new Date(d.year, d.month, 0).toISOString().split('T')[0];
          passesFilter = passesFilter && endOfMonth <= dateRange.end;
        }
        
        return passesFilter;
      });
    }

    // Process the export data using the updated function
    const exportResult = processExportData(
      filteredData, // Use filtered aggregated data
      countryAggregates,
      {
        eventType: options.eventType,
        year: options.year,
        projection: options.projection,
        format: options.format,
        country: selectedCountry.code // Use the selected country code
      }
    );

    // Check if any data was found
    if (exportResult.featureCount === 0) {
      const yearText = options.year === 'all' ? 'all years' : `year ${options.year}`;
      const eventText = options.eventType === 'all' ? 'events' : `${options.eventType} events`;
      
      alert(`No ${eventText} found for ${selectedCountry.code} in ${yearText}. Please adjust your filters.`);
      return;
    }

    // Download the file
    downloadFile(exportResult.content, exportResult.filename, exportResult.mimeType);

    // Show success message
    const yearText = options.year === 'all' ? 'all years' : `year ${options.year}`;
    console.log(`Successfully exported ${exportResult.featureCount} records for ${selectedCountry.code} (${yearText})`);
    
    // Show success notification
    setTimeout(() => {
      alert(`Export completed! Downloaded ${exportResult.featureCount} monthly event records as ${options.format.toUpperCase()}.`);
    }, 100);

  } catch (error) {
    console.error('Export failed:', error);
    alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
  }
};
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

  // Reset event type filter function
  const resetEventTypeFilter = () => {
    setEventTypeFilter(null);
  };

  // Reset date range filter function
  const resetDateRangeFilter = () => {
    setDateRange(null);
  };
  // helper function to get available years from countryEvents
  const getAvailableYears = (): number[] => {
  if (!countryEvents || countryEvents.length === 0) return [];
  
  const years = [...new Set(countryEvents.map(event => event.year))];
  return years.sort((a, b) => b - a); // Sort descending (newest first)
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
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>
              ) =>
                setDateRange({
                  start: e.target.value,
                  end: dateRange?.end || '',
                })
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
              onChange={(
                e: React.ChangeEvent<HTMLInputElement>
              ) =>
                setDateRange({
                  start: dateRange?.start || '',
                  end: e.target.value,
                })
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
          <button 
           onClick={() => setIsExportModalOpen(true)}
          className="w-full flex items-center justify-center text-sm bg-emerald-500 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm cursor-pointer">
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
    <>
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

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed md:hidden inset-0 bg-slate-900/40 backdrop-blur-sm z-10 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
   <ExportViewModal
  isOpen={isExportModalOpen}
  onClose={() => setIsExportModalOpen(false)}
  onExport={handleExport}
  availableCountries={countryAggregates.map(c => ({
    code: c.country_code,
    name: c.country_code, 
  }))}
  availableYears={getAvailableYears()}
  selectedCountry={selectedCountry}
/>
    </>
    
  );
  
};

export default MapSidebar;