import React from 'react';
import RegionSelector from './RegionSelector';
import ProjectionSelector from './CustomProjection';

interface MapControlsProps {
  map: mapboxgl.Map | null;
  mapReady: boolean;
  isGrayscale: boolean;
  onGrayscaleToggle: () => void;
  styleChangeCounter: number;
  selectedProjection: "mercator" | "globe" | "albers" | "equalEarth" | "naturalEarth" | "lambertConformalConic" | "winkelTripel";
  onProjectionChange: (projection: "mercator" | "globe" | "albers" | "equalEarth" | "naturalEarth" | "lambertConformalConic" | "winkelTripel") => void;
  selectedStyle: string;
  onStyleChange: (style: string) => void;
  baseMaps: Record<string, string>;
}

const MapControls: React.FC<MapControlsProps> = ({
  map,
  mapReady,
  isGrayscale,
  onGrayscaleToggle,
  styleChangeCounter,
  selectedProjection,
  onProjectionChange,
  selectedStyle,
  onStyleChange,
  baseMaps
}) => {
  return (
    <>
      <RegionSelector 
        map={map} 
        mapReady={mapReady} 
        isGrayscale={isGrayscale}
        onGrayscaleToggle={onGrayscaleToggle}
        styleChangeCounter={styleChangeCounter}
      />
      
      <ProjectionSelector 
        selectedProjection={selectedProjection}
        onChange={onProjectionChange}
        className="absolute bottom-4 md:bottom-14 left-4 z-10"
      />
      
      {/* Base map selector */}
      <div className="absolute bottom-4 md:bottom-14 right-4 z-10 bg-white/80 backdrop-blur-md border border-slate-100 rounded-lg md:rounded-2xl px-2 py-2 md:px-4 md:py-3 shadow-lg transition-opacity hover:bg-white/90 scale-75 md:scale-100 origin-bottom-right">
        <label className="hidden md:block text-sm font-medium text-slate-800 mb-2">Base Map</label>
        <select
          value={selectedStyle}
          onChange={(e) => onStyleChange(e.target.value)}
          className="text-xs md:text-sm w-full px-2 py-1 md:px-3 md:py-2 bg-white border border-slate-200 rounded-md md:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all min-w-[80px] md:min-w-auto"
        >
          {Object.keys(baseMaps).map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
      </div>
    </>
  );
};

export default MapControls;