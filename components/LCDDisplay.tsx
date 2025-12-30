
import React, { useState, useEffect } from 'react';
import { PanelState } from '../types';

interface LCDDisplayProps {
  state: PanelState;
}

const LCDDisplay: React.FC<LCDDisplayProps> = ({ state }) => {
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 500);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    const footer = (
      <div className="mt-auto flex justify-between text-[11px] font-bold bg-black/5 px-1 py-0.5 border-t border-black/10">
        <span>AC:2Z</span>
        <span>ALM:{state.alarms.length}</span>
        <span>PALM:0</span>
        <span>FLT:0</span>
        <span>DIS:{state.isolatedZones.length}</span>
      </div>
    );

    const header = (
      <div className="flex justify-between border-b border-black/20 mb-1 text-[11px]">
        <span>FIREFINDER</span>
        <span>{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
    );

    // Resetting State
    if (state.isResetting) {
      return (
        <div className="lcd-text h-full flex flex-col items-center justify-center p-4">
          <div className="text-2xl font-black mb-2 animate-pulse">RESETTING...</div>
          <div className="text-sm">PLEASE WAIT</div>
          <div className="w-full h-2 bg-black/20 mt-4 overflow-hidden rounded-full">
            <div className="h-full bg-black/60 animate-[progress_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
          </div>
        </div>
      );
    }

    // Performance Result Screen (Gamification)
    if (state.alarms.length === 0 && state.training.lastResult && !state.inputTarget.includes('NONE' as any)) {
      const { score, rank, feedback } = state.training.lastResult;
      return (
        <div className="lcd-text h-full flex flex-col p-2 text-sm">
          <div className="text-center font-black border-b border-black/20 pb-1 mb-2">SCENARIO COMPLETE</div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold uppercase">Rank:</span>
            <span className="text-lg font-black bg-black text-[#94b43b] px-2">{rank}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold uppercase">Session Score:</span>
            <span className="text-xl font-black">{score}</span>
          </div>
          <div className="text-[10px] leading-tight italic bg-black/5 p-1 border border-black/10">
            {feedback}
          </div>
          <div className="mt-auto text-[9px] text-center opacity-60">PRESS CANCEL TO RETURN TO NORMAL</div>
        </div>
      );
    }

    // Isolation Selection Sub-menu
    if (state.inputTarget === 'DISABLE_SELECT') {
      return (
        <div className="lcd-text h-full flex flex-col p-2 text-sm leading-tight">
          {header}
          <div className="text-lg font-bold mt-2">ZONE:{state.selectedZoneForDisable}</div>
          <div className="grid grid-cols-2 mt-4 gap-4">
            <div>0:FULL ENABLE</div>
            <div>1:FULL DISABLE</div>
          </div>
          {footer}
        </div>
      );
    }

    // Input Mode (Zone Selection)
    if (state.inputTarget === 'ZONE') {
      return (
        <div className="lcd-text h-full flex flex-col p-2">
          {header}
          <div className="text-lg font-bold mt-2 flex items-center gap-2">
            ZONE:
            <span className="border-b-2 border-black min-w-[60px] inline-block text-xl">
              {state.numericInput}<span className={blink ? 'opacity-100' : 'opacity-0'}>_</span>
            </span>
          </div>
          <div className="mt-4 text-[10px] leading-tight font-bold uppercase">
            SELECT ZONE NO. THEN TO OR DISPLAY OR<br/>
            ZONE/DEVICE DISABLE/ENABLE KEY
          </div>
          {footer}
        </div>
      );
    }

    // Alarm Display
    if (state.alarms.length > 0) {
      const currentAlarm = state.alarms[state.currentDisplayIndex];
      return (
        <div className="lcd-text h-full flex flex-col p-2 font-mono leading-tight">
          <div className="text-xl font-bold flex justify-between">
            <span>L{currentAlarm.loop} D{currentAlarm.device} Z{currentAlarm.zone}</span>
            <span className="text-xs">{state.currentDisplayIndex + 1} OF {state.alarms.length}</span>
          </div>
          <div className="text-lg font-black mt-1 uppercase truncate">
            {currentAlarm.location}
          </div>
          <div className={`text-lg font-black px-1 inline-block mt-1 ${currentAlarm.status === 'FIRE' ? 'bg-black text-[#94b43b]' : 'bg-amber-600 text-black'}`}>
            STATUS:{currentAlarm.status}
          </div>
          <div className="text-xs mt-1">
            {currentAlarm.timestamp}
          </div>
          
          <div className="mt-auto">
            <div className="text-sm font-bold border-t border-black/10 pt-1">DEVICE ALARM</div>
            {footer}
          </div>
        </div>
      );
    }

    // System Normal
    return (
      <div className="lcd-text h-full flex flex-col p-4">
        <div className="text-2xl font-black mb-1">FIREFINDER</div>
        <div className="text-xl font-bold">SYSTEM NORMAL</div>
        {state.isolatedZones.length > 0 && (
          <div className="text-sm font-bold mt-2 bg-yellow-400/30 px-2 py-1 rounded">
            {state.isolatedZones.length} ZONE(S) DISABLED
          </div>
        )}
        <div className="mt-auto flex flex-col gap-1">
          <div className="flex justify-between text-xs font-bold">
            <span>{new Date().toLocaleDateString()}</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
          {footer}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative w-full h-full rounded-sm overflow-hidden border-2 border-gray-600 lcd-screen transition-all duration-300 ${state.alarms.length > 0 && !state.buzzerSilenced ? 'ring-8 ring-red-600 ring-inset' : ''}`}>
      {renderContent()}
    </div>
  );
};

export default LCDDisplay;
