
import React from 'react';
import { PanelState } from '../types';

interface F220LCDProps {
  state: PanelState;
}

const F220LCD: React.FC<F220LCDProps> = ({ state }) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  if (state.isResetting) {
    return (
      <div className="bg-black w-full h-full flex flex-col items-center justify-center text-white font-mono border-4 border-neutral-600 shadow-inner">
        <div className="text-2xl font-black mb-4 animate-pulse text-green-500">SYSTEM RESETTING</div>
        <div className="text-neutral-400 text-sm tracking-widest">PLEASE WAIT...</div>
        <div className="w-64 h-2 bg-neutral-900 mt-6 rounded-full overflow-hidden">
          <div className="h-full bg-green-600 animate-[progress_2s_linear_infinite]" style={{ width: '30%' }}></div>
        </div>
      </div>
    );
  }

  // Performance Result Screen
  if (state.alarms.length === 0 && state.training.lastResult && state.inputTarget === 'NONE') {
    const { score, rank, feedback } = state.training.lastResult;
    return (
      <div className="bg-black w-full h-full p-6 text-white font-mono flex flex-col border-4 border-neutral-600 shadow-inner">
        <div className="text-cyan-400 text-center border-b border-neutral-800 pb-2 mb-4 font-black">PERFORMANCE REPORT</div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-neutral-500 text-sm">RANK:</span>
          <span className="text-2xl font-black text-amber-500">{rank}</span>
        </div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-neutral-500 text-sm">SCORE:</span>
          <span className="text-3xl font-black text-emerald-500">{score}</span>
        </div>
        <div className="bg-neutral-900/50 p-4 rounded border border-neutral-800 text-[11px] leading-relaxed text-neutral-300">
          {feedback}
        </div>
        <div className="mt-auto text-center text-[10px] text-neutral-600 animate-pulse uppercase font-bold">
          PRESS BACK/ESC TO DISMISS
        </div>
      </div>
    );
  }

  if (state.alarms.length > 0) {
    const current = state.alarms[state.currentDisplayIndex];
    // For the screenshot look, if we have multiple alarms, we show a secondary bar
    const hasMultiple = state.alarms.length > 1;
    const nextIndex = (state.currentDisplayIndex + 1) % state.alarms.length;
    const nextAlarm = state.alarms[nextIndex];

    return (
      <div className="bg-[#0c0c0c] w-full h-full flex flex-col font-mono text-white select-none">
        {/* Top Header */}
        <div className="bg-[#1a1a1a] text-[11px] px-3 py-1 flex justify-between text-[#d1d1d1] border-b border-neutral-800 font-bold">
          <span>Olympus Village Panel 103</span>
          <span className="uppercase">{dateStr} {timeStr}</span>
        </div>

        {/* First Alarm Bar */}
        <div className="bg-[#e23624] text-black px-2 py-0.5 text-[14px] font-black flex justify-between tracking-tight">
          <span>First Alarm at {current.timestamp}</span>
          <span>{state.currentDisplayIndex + 1}/{state.alarms.length}</span>
        </div>

        {/* Alarm Information */}
        <div className="px-3 py-2 flex flex-col gap-0.5">
          <div className="flex gap-2 text-[15px] font-black">
            <span className="text-neutral-400">Zone:</span>
            <span>{current.zone}-{current.location}</span>
          </div>
          <div className="flex gap-2 text-[15px] font-black">
            <span className="text-neutral-400">Type:</span>
            <span>{current.deviceType} at L0{current.loop}D{String(current.device).padStart(3, '0')}(Optical)</span>
          </div>
          <div className="flex gap-2 text-[15px] font-black">
            <span className="text-neutral-400">Location:</span>
            <span>{current.location}</span>
          </div>
        </div>

        {/* Secondary Alarm Bar (Split Screen View simulation) */}
        {hasMultiple && (
          <>
            <div className="bg-[#e23624] text-black px-2 py-0.5 text-[14px] font-black flex justify-between tracking-tight">
              <span>Device in Alarm</span>
              <span>{nextIndex + 1}/{state.alarms.length}</span>
            </div>
            <div className="px-3 py-2 flex flex-col gap-0.5">
              <div className="flex gap-2 text-[15px] font-black">
                <span className="text-neutral-400">Zone:</span>
                <span>{nextAlarm.zone}-{nextAlarm.location}</span>
              </div>
              <div className="flex gap-2 text-[15px] font-black">
                <span className="text-neutral-400">Type:</span>
                <span>{nextAlarm.deviceType} at L0{nextAlarm.loop}D{String(nextAlarm.device).padStart(3, '0')}(Optical)</span>
              </div>
              <div className="flex gap-2 text-[15px] font-black">
                <span className="text-neutral-400">Location:</span>
                <span>{nextAlarm.location}</span>
              </div>
            </div>
          </>
        )}

        {/* Bottom Red Bar: Total Zones */}
        <div className="mt-auto bg-[#e23624] text-black px-2 py-0.5 text-[11px] font-black flex justify-between">
          <span>Total Zones in alarm</span>
          <span>{Array.from(new Set(state.alarms.map(a => a.zone))).length}</span>
        </div>

        {/* Prompt Bar: Cyan */}
        <div className="bg-[#00d7ff] text-black px-2 py-0.5 text-[11px] font-black tracking-tight">
          To view alarms list, press ALARMS button
        </div>
      </div>
    );
  }

  // System Normal
  return (
    <div className="bg-black w-full h-full flex flex-col font-mono text-white">
      <div className="bg-[#1a1a1a] text-[11px] px-3 py-1 flex justify-between text-[#d1d1d1] border-b border-neutral-800 font-bold">
        <span>Olympus Village Panel 103</span>
        <span>{dateStr} {timeStr}</span>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center space-y-4">
        <div className="text-[#00ff00] text-5xl font-black tracking-tighter italic">PERTRONIC</div>
        <div className="text-white text-2xl font-black tracking-widest uppercase border-y-4 border-white/20 px-8 py-2">
          System Normal
        </div>
      </div>
      <div className="p-4 text-[10px] text-neutral-500 border-t border-neutral-900/50 flex justify-between font-bold">
        <span>F220 ANALOGUE ADDRESSABLE</span>
        <span>230V AC OK</span>
      </div>
    </div>
  );
};

export default F220LCD;
