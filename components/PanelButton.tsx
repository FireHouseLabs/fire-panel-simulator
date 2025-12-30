
import React from 'react';

interface PanelButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'red' | 'green' | 'yellow' | 'keypad';
  subLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

const PanelButton: React.FC<PanelButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'default', 
  subLabel,
  icon,
  className = ''
}) => {
  const styles = {
    default: 'border-neutral-400 bg-neutral-200 hover:bg-neutral-100 text-neutral-800',
    red: 'border-red-700 bg-red-100 hover:bg-red-50 text-red-900 border-2',
    green: 'border-green-700 bg-green-100 hover:bg-green-50 text-green-900 border-2',
    yellow: 'border-amber-600 bg-amber-50 hover:bg-amber-100 text-amber-900 border-2',
    keypad: 'border-neutral-500 bg-neutral-300 hover:bg-neutral-200 text-neutral-800 text-sm font-bold shadow-sm',
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center rounded-xl p-1 transition-all active:scale-95
        border shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]
        ${styles[variant]}
        ${className}
      `}
    >
      {icon && <div className="mb-0.5">{icon}</div>}
      <span className={`text-[10px] font-black uppercase text-center leading-[1.1] break-words w-full whitespace-pre-line`}>
        {label}
      </span>
      {subLabel && <span className="text-[8px] font-medium opacity-70 leading-none mt-0.5">{subLabel}</span>}
    </button>
  );
};

export default PanelButton;
