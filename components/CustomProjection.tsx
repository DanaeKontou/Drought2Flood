import React from 'react';

// Update the type to match your main component
type ProjectionSelectorProps = {
  selectedProjection: 'mercator' | 'globe' | 'albers' | 'equalEarth' | 'naturalEarth' | 'lambertConformalConic' | 'winkelTripel';
  onChange: (projection: 'mercator' | 'globe' | 'albers' | 'equalEarth' | 'naturalEarth' | 'lambertConformalConic' | 'winkelTripel') => void;
  className?: string;
};
// Update the projection options to only include supported projections
const projectionOptions = {
  "Mercator (Default)": "mercator",
  "Globe (3D)": "globe",
  "Albers Equal Area": "albers",
  "Equal Earth": "equalEarth",
  "Natural Earth": "naturalEarth",
  "Lambert Conformal Conic": "lambertConformalConic",
  "Winkel Tripel": "winkelTripel"
};

const ProjectionSelector: React.FC<ProjectionSelectorProps> = ({ 
  selectedProjection, 
  onChange,
  className = ''
}) => {
  return (
    <div className={`bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl px-4 py-3 shadow-lg transition-opacity hover:bg-white/90 scale-75 md:scale-100 origin-bottom-left ${className}`}>
      <label className="block text-sm font-medium text-slate-800 mb-2">Map Projection</label>
      <select
        value={selectedProjection}
        onChange={(e) => onChange(e.target.value as typeof selectedProjection)}
        className="text-sm w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
      >
        {Object.entries(projectionOptions).map(([label, value]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ProjectionSelector;