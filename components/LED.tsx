
import React from 'react';

interface LEDProps {
  label: string;
  color: 'red' | 'yellow' | 'green';
  isOn: boolean;
  isFlashing?: boolean;
}

const LED: React.FC<LEDProps> = ({ label, color, isOn, isFlashing = false }) => {
  const baseColors = {
    red: 'bg-red-900',
    yellow: 'bg-amber-900',
    green: 'bg-emerald-900',
  };

  const activeColors = {
    red: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
    yellow: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    green: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
  };

  return (
    <div className="flex items-center justify-between w-full px-2 py-0.5 group">
      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-tighter w-24 leading-none">
        {label}
      </span>
      <div 
        className={`w-3 h-3 rounded-full transition-all duration-200 ${
          isOn ? activeColors[color] : baseColors[color]
        } ${isFlashing && isOn ? 'animate-pulse' : ''}`}
      />
    </div>
  );
};

export default LED;
