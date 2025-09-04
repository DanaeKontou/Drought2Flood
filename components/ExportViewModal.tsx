// components/ExportViewModal.tsx - Updated for Calendar Flower Data
import React, { useState } from 'react';
import { X, Download, Globe, Calendar, ChevronDown } from 'lucide-react';

interface ExportViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: {
    eventType: 'all' | 'drought' | 'flood' | 'd2f' | 'both';
    year: number | 'all';
    projection: 'WGS84' | 'WebMercator';
    format: 'csv' | 'geojson';
    country?: string;
  }) => void;
  availableCountries: { code: string; name: string }[];
  availableYears: number[]; // Add this prop for year filtering
  selectedCountry?: { code: string; firstYear: number; lastYear: number } | null;
}

const ExportViewModal: React.FC<ExportViewModalProps> = ({
  isOpen,
  onClose,
  onExport,
  availableCountries,
  availableYears,
  selectedCountry,
}) => {
  const [eventType, setEventType] = useState<'all' | 'drought' | 'flood' | 'd2f' | 'both'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [projection, setProjection] = useState<'WGS84' | 'WebMercator'>('WGS84');
  const [format, setFormat] = useState<'csv' | 'geojson'>('csv');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCountry) {
      alert('Please select a country first.');
      return;
    }

    onExport({
      eventType,
      year: selectedYear,
      projection,
      format,
      country: selectedCountry.code,
    });
    onClose();
  };

  return (
    <>
      <style>{`
        .modal-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .modal-scrollbar::-webkit-scrollbar-track {
          background: #f8fafc;
          border-radius: 4px;
        }
        .modal-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .modal-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f8fafc;
        }
      `}</style>
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto modal-scrollbar">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex justify-between items-center border-b border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Export Calendar Data</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-5 space-y-6">
            {/* Selected Country Display */}
            {selectedCountry && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Selected Country</h3>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium text-blue-900">{selectedCountry.code}</p>
                  <p className="text-sm text-blue-700">
                    Data available: {selectedCountry.firstYear} - {selectedCountry.lastYear}
                  </p>
                </div>
              </div>
            )}

            {/* Year Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-700">
                <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <h3 className="text-sm font-medium">Filter by Year</h3>
              </div>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="all">All Years</option>
                  {availableYears.sort((a, b) => b - a).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Event Type Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Event Types</h3>
              <div className="relative">
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full pl-3 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="all">All DTF Events</option>
                  <option value="drought">Drought Events Only</option>
                  <option value="flood">Flood Events Only</option>
                  <option value="d2f">Drought-to-Flood Events</option>
                  <option value="both">Drought & Flood Events (Both)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Projection Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-700">
                <Globe className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <h3 className="text-sm font-medium">Coordinate System</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3.5 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer min-w-0">
                  <input
                    type="radio"
                    name="projection"
                    checked={projection === 'WGS84'}
                    onChange={() => setProjection('WGS84')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className="text-sm font-medium truncate">WGS84</span>
                </label>
                <label className="flex items-center gap-3 p-3.5 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer min-w-0">
                  <input
                    type="radio"
                    name="projection"
                    checked={projection === 'WebMercator'}
                    onChange={() => setProjection('WebMercator')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className="text-sm font-medium truncate">Web Mercator</span>
                </label>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Export Format</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3.5 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer min-w-0">
                  <input
                    type="radio"
                    name="format"
                    checked={format === 'csv'}
                    onChange={() => setFormat('csv')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className="text-sm font-medium truncate">CSV</span>
                </label>
                <label className="flex items-center gap-3 p-3.5 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-colors cursor-pointer min-w-0">
                  <input
                    type="radio"
                    name="format"
                    checked={format === 'geojson'}
                    onChange={() => setFormat('geojson')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className="text-sm font-medium truncate">GeoJSON</span>
                </label>
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> This exports aggregated monthly event data from your calendar flower visualization, 
                not individual event points.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedCountry}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg cursor-pointer hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export Data
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default ExportViewModal;