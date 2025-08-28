import React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
}


const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="p-8 rounded-2xl shadow-2xl border border-white/20 flex flex-col items-center space-y-6">
        {/* Enhanced orbital loader with rings */}
        <div className="relative w-20 h-20">
          {/* Outer ring */}
          <div className="absolute inset-0 animate-spin-slow">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2 shadow-lg"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-400 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2 shadow-lg"></div>
          </div>

          {/* Middle ring */}
          <div className="absolute inset-2 animate-spin-reverse">
            <div className="w-3 h-3 bg-gradient-to-r from-orange-500 to-red-400 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2 shadow-lg"></div>
            <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-400 rounded-full absolute bottom-0 left-1/2 transform -translate-x-1/2 shadow-lg"></div>
          </div>

          {/* Core */}
          <div className="w-6 h-6 bg-gradient-to-r from-slate-700 to-slate-800 rounded-full absolute inset-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg animate-pulse"></div>

          {/* Subtle glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 animate-pulse"></div>
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-white animate-pulse">
            Fetching climate events around the globe<span className="inline-block animate-bounce">…</span>
          </p>
          <p className="text-sm text-gray-200">
            Analyzing environmental data worldwide. Please wait...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;