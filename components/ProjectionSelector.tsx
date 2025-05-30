"use client";
import React, { useState } from "react";

type ProjectionType = 'mercator' | 'globe';

interface ProjectionSelectorProps {
  selectedProjection: ProjectionType;
  onChange: (projection: ProjectionType) => Promise<void>;
  className?: string;
}

const projectionOptions = {
  "Mercator (Default)": "mercator",
  "Globe (3D)": "globe"
};

export default function ProjectionSelector({ 
  selectedProjection, 
  onChange,
  className = ""
}: ProjectionSelectorProps) {
  const [isChanging, setIsChanging] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjection = e.target.value;
    
    if (newProjection === selectedProjection) return;
    
    setIsChanging(true);
    try {
      await onChange(newProjection as ProjectionType);
    } catch (error) {
      console.error('Failed to change projection:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className={`bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl px-4 py-3 shadow-lg transition-opacity ${isChanging ? 'opacity-75' : ''} ${className}`}>
      <label className="block text-sm font-medium text-slate-800 mb-2">
        Projection 
        {isChanging && (
          <span className="ml-2 text-xs text-blue-600 flex items-center">
            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Switching...
          </span>
        )}
      </label>
      <select
        value={selectedProjection}
        onChange={handleChange}
        disabled={isChanging}
        className="text-sm w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-wait"
      >
        {Object.entries(projectionOptions).map(([label, value]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}