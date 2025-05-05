import { useState, useRef, useEffect } from 'react';

export default function TimelineSlider() {
  const [value, setValue] = useState(2010);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  
  const minYear = 1980;
  const maxYear = 2025;
  
  // Handle mouse/touch interaction
const handleMove = (clientX: number): void => {
    if (trackRef.current) {
        const rect = (trackRef.current as HTMLDivElement).getBoundingClientRect();
        const position = (clientX - rect.left) / rect.width;
        const clampedPosition = Math.max(0, Math.min(position, 1));
        const newYear = Math.round(minYear + clampedPosition * (maxYear - minYear));
        setValue(newYear);
    }
};

const startDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>): void => {
    setIsDragging(true);
    if ('touches' in e) {
        handleMove(e.touches[0].clientX);
    } else {
        handleMove(e.clientX);
    }
    document.body.style.userSelect = 'none';
};

  useEffect(() => {
    const handleDrag = (e: MouseEvent | TouchEvent): void => {
      if (isDragging) {
        handleMove(
          e.type.includes('touch') 
            ? (e as TouchEvent).touches[0].clientX 
            : (e as MouseEvent).clientX
        );
      }
    };
    
    const endDrag = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('mouseup', endDrag);
      window.addEventListener('touchend', endDrag);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchend', endDrag);
    };
  }, [isDragging]);
  
  // Calculate percentage for thumb position
  const percentage = ((value - minYear) / (maxYear - minYear)) * 100;
  
  return (
    <div className="flex items-center justify-between mb-4 p-2 hover:bg-white rounded-lg transition-all">
      <div className="w-full">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-slate-500">{value}</span>
          <span className="text-xs text-slate-500">Year</span>
        </div>
        
        <div className="relative h-7">
          {/* Track */}
          <div 
            ref={trackRef}
            className="absolute top-2 h-1.5 w-full bg-slate-200 rounded-full cursor-pointer"
            onMouseDown={startDrag}
            onTouchStart={startDrag}
          >
            {/* Filled portion */}
            <div 
              className="absolute h-full bg-purple-500 rounded-full"
              style={{ width: `${percentage}%` }}
            />
            
            {/* Tick marks */}
            <div className="absolute top-0" style={{ left: '0%' }}>
              <div className="w-0.5 h-3 bg-slate-400"></div>
              <div className="absolute top-4 left-[-8px] text-[10px] text-slate-500">1980</div>
            </div>
            
            <div className="absolute top-0" style={{ left: '20%' }}>
              <div className="w-0.5 h-3 bg-slate-400"></div>
              <div className="absolute top-4 left-[-8px] text-[10px] text-slate-500">1990</div>
            </div>
            
            <div className="absolute top-0" style={{ left: '40%' }}>
              <div className="w-0.5 h-3 bg-slate-400"></div>
              <div className="absolute top-4 left-[-8px] text-[10px] text-slate-500">2000</div>
            </div>
            
            <div className="absolute top-0" style={{ left: '60%' }}>
              <div className="w-0.5 h-3 bg-slate-400"></div>
              <div className="absolute top-4 left-[-8px] text-[10px] text-slate-500">2010</div>
            </div>
            
            <div className="absolute top-0" style={{ left: '80%' }}>
              <div className="w-0.5 h-3 bg-slate-400"></div>
              <div className="absolute top-4 left-[-8px] text-[10px] text-slate-500">2020</div>
            </div>
            
            <div className="absolute top-0" style={{ left: '100%' }}>
              <div className="w-0.5 h-3 bg-slate-400"></div>
              <div className="absolute top-4 left-[-8px] text-[10px] text-slate-500">2025</div>
            </div>
            
            {/* Draggable thumb */}
            <div 
              className={`absolute top-[-2px] w-3 h-3 bg-white border border-purple-500 rounded-full cursor-grab shadow-sm ${isDragging ? 'cursor-grabbing scale-125 border-2' : ''}`}
              style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
              onMouseDown={startDrag}
              onTouchStart={startDrag}
            />
          </div>
        </div>
      </div>
    </div>
  );
}