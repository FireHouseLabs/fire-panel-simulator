
import React from 'react';
import { PanelState } from '../types';
import LED from './LED';

interface ZoneSensePanelProps {
  state: PanelState;
  onAction: (type: string) => void;
}

const ZoneSensePanel: React.FC<ZoneSensePanelProps> = ({ state, onAction }) => {
  const isFire = state.alarms.some(a => a.status === 'FIRE');
  const isFault = state.alarms.some(a => a.status === 'FAULT');
  const isIsolated = state.isolatedZones.length > 0;

  // Helper for pill-shaped containers
  const PillContainer = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-[#bcbcbc] rounded-full px-4 py-1 flex items-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="relative w-full max-w-7xl bg-[#cdcdcd] p-12 rounded-sm border-[2px] border-[#999999] shadow-2xl font-sans select-none overflow-hidden text-neutral-800">
      
      {/* Top Terminal Strip Labels */}
      <div className="absolute top-0 left-0 w-full h-10 flex items-center px-4 gap-1 text-[9px] font-bold border-b border-neutral-400 bg-[#e0e0e0]/50">
        <div className="flex-1 flex gap-4">
          <div className="border-r border-neutral-400 pr-2">EARTH<br/>DISABLE</div>
          <div className="border-r border-neutral-400 pr-2">+ . - SHD<br/>RS485</div>
          <div className="border-r border-neutral-400 pr-2 flex items-center">COM DS MCP FLT<br/>INPUTS</div>
          <div className="border-r border-neutral-400 pr-2 flex items-center">| + Z1 - + Z2 - + Z3 - + Z4 - + Z5 - + Z6 - + Z7 - + Z8 - |<br/>DETECTOR ZONES</div>
          <div className="border-r border-neutral-400 pr-2">+ . -<br/>EXT BELL</div>
          <div className="border-r border-neutral-400 pr-2">+ . -<br/>WARN SYS</div>
          <div className="border-r border-neutral-400 pr-2">+ . -<br/>ACF</div>
          <div className="border-r border-neutral-400 pr-2">+ . -<br/>ASE</div>
        </div>
        <div className="flex gap-4">
          <div className="border-r border-neutral-400 pr-2">+ . -<br/>ALARM</div>
          <div className="border-r border-neutral-400 pr-2">+ . -<br/>FAULT</div>
          <div className="border-r border-neutral-400 pr-2">N/O C N/C<br/>ALARM</div>
          <div className="border-r border-neutral-400 pr-2">N/O C N/C<br/>FAULT</div>
          <div className="pr-2">+ . - RST<br/>AUX 24VDC /BZ</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 mt-6">
        
        {/* Left: System Status LEDs */}
        <div className="col-span-3 flex flex-col items-center">
          <div className="bg-[#bcbcbc] px-6 py-1 rounded-full mb-4 shadow-sm">
            <span className="text-sm font-black tracking-[0.2em]">SYSTEM STATUS</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full">
            <PillContainer className="justify-between">
              <span className="text-[9px] font-bold uppercase mr-2">POWER</span>
              <div className={`w-3.5 h-3.5 rounded-full ${state.powerStatus === 'OK' ? 'bg-[#39ff14] shadow-[0_0_8px_#39ff14]' : 'bg-neutral-800'}`}></div>
            </PillContainer>
            <PillContainer className="justify-between">
              <span className="text-[9px] font-bold uppercase leading-tight">EXTERNAL<br/>ALARM FAULT</span>
              <div className="w-3.5 h-3.5 rounded-full bg-neutral-800"></div>
            </PillContainer>
            <PillContainer className="justify-between">
              <span className="text-[9px] font-bold uppercase">POWER FAULT</span>
              <div className={`w-3.5 h-3.5 rounded-full ${state.powerStatus === 'FAULT' ? 'bg-amber-400 shadow-[0_0_8px_amber]' : 'bg-neutral-800'}`}></div>
            </PillContainer>
            <PillContainer className="justify-between">
              <span className="text-[9px] font-bold uppercase leading-tight">WARNING SYSTEM<br/>FAULT</span>
              <div className="w-3.5 h-3.5 rounded-full bg-neutral-800"></div>
            </PillContainer>
            <PillContainer className="justify-between">
              <span className="text-[9px] font-bold uppercase">SYSTEM FAULT</span>
              <div className={`w-3.5 h-3.5 rounded-full ${state.systemStatus === 'FAULT' ? 'bg-amber-400 shadow-[0_0_8px_amber]' : 'bg-neutral-800'}`}></div>
            </PillContainer>
            <PillContainer className="justify-between">
              <span className="text-[9px] font-bold uppercase">ACF STATUS</span>
              <div className="w-3.5 h-3.5 rounded-full bg-neutral-800"></div>
            </PillContainer>
            <PillContainer className="justify-between">
              <span className="text-[9px] font-bold uppercase">EARTH FAULT</span>
              <div className="w-3.5 h-3.5 rounded-full bg-neutral-800"></div>
            </PillContainer>
            <PillContainer className="justify-between">
              <span className="text-[9px] font-bold uppercase">ASE STATUS</span>
              <div className="w-3.5 h-3.5 rounded-full bg-neutral-800"></div>
            </PillContainer>
          </div>
        </div>

        {/* Center: Zones LEDs */}
        <div className="col-span-6 flex flex-col">
          <div className="flex justify-center mb-1">
            <div className="border-2 border-red-600 rounded-lg px-20 py-1 bg-[#cdcdcd] shadow-sm">
               <span className="text-sm font-black tracking-widest uppercase">ALARM</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(z => {
              if (z % 2 === 0) return null;
              const z1 = z;
              const z2 = z + 1;
              const z1Alarm = state.alarms.some(a => a.zone === z1 && a.status === 'FIRE');
              const z1Isol = state.isolatedZones.includes(z1);
              const z2Alarm = state.alarms.some(a => a.zone === z2 && a.status === 'FIRE');
              const z2Isol = state.isolatedZones.includes(z2);

              return (
                <div key={z} className="flex items-center gap-2">
                   <PillContainer className="flex-1 justify-between gap-4">
                      <span className="text-[11px] font-bold uppercase min-w-[60px]">ZONE {z1}</span>
                      <div className="flex gap-4">
                        <div className={`w-4 h-4 rounded-full border border-black/20 ${z1Isol ? 'bg-amber-400 shadow-[0_0_8px_amber]' : 'bg-neutral-800'}`}></div>
                        <div className={`w-4 h-4 rounded-full border border-black/20 ${z1Alarm ? 'bg-red-600 shadow-[0_0_8px_red]' : 'bg-neutral-800'}`}></div>
                      </div>
                   </PillContainer>
                   <PillContainer className="flex-1 justify-between gap-4">
                      <div className="flex gap-4">
                        <div className={`w-4 h-4 rounded-full border border-black/20 ${z2Alarm ? 'bg-red-600 shadow-[0_0_8px_red]' : 'bg-neutral-800'}`}></div>
                        <div className={`w-4 h-4 rounded-full border border-black/20 ${z2Isol ? 'bg-amber-400 shadow-[0_0_8px_amber]' : 'bg-neutral-800'}`}></div>
                      </div>
                      <span className="text-[11px] font-bold uppercase min-w-[60px] text-right">ZONE {z2}</span>
                   </PillContainer>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-center mt-1">
            <div className="border-2 border-neutral-500 rounded-lg px-12 py-1 bg-[#bcbcbc] shadow-inner">
               <span className="text-xs font-black tracking-widest uppercase">FAULT / ISOLATE</span>
            </div>
          </div>
        </div>

        {/* Right: Screen & Navigation */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="bg-[#b3b3b3] p-4 rounded-3xl shadow-inner relative flex flex-col items-center gap-4">
            <div className="bg-white w-full h-32 rounded-lg border-2 border-neutral-500 flex flex-col items-center justify-center font-mono p-4 text-neutral-800 shadow-inner">
               {state.isResetting ? (
                 <div className="flex flex-col items-center">
                    <span className="text-sm font-black tracking-widest text-red-600 animate-pulse">RESETTING SYSTEM</span>
                    <span className="text-[10px] mt-2">PLEASE WAIT...</span>
                 </div>
               ) : (
                 <div className="flex flex-col items-center">
                    <span className="text-lg font-black tracking-tighter">AMPAC</span>
                    <span className="text-sm mt-1">MON 07:45</span>
                 </div>
               )}
            </div>

            {/* Navigation Cluster */}
            <div className="relative w-full flex justify-center items-center py-4">
               <div className="grid grid-cols-3 gap-1 scale-110">
                 <button className="col-start-2 w-10 h-10 bg-neutral-200 border border-neutral-400 rounded-t-lg flex items-center justify-center hover:bg-white active:scale-95 transition-all">&uarr;</button>
                 <button className="w-10 h-10 bg-neutral-200 border border-neutral-400 rounded-l-lg flex items-center justify-center hover:bg-white active:scale-95 transition-all">&larr;</button>
                 <div className="bg-neutral-700 text-white text-[8px] w-10 h-10 flex flex-col items-center justify-center text-center font-black leading-tight uppercase shadow-lg">MENU<br/>ENTER</div>
                 <button className="w-10 h-10 bg-neutral-200 border border-neutral-400 rounded-r-lg flex items-center justify-center hover:bg-white active:scale-95 transition-all">&rarr;</button>
                 <button className="col-start-2 w-10 h-10 bg-neutral-200 border border-neutral-400 rounded-b-lg flex items-center justify-center hover:bg-white active:scale-95 transition-all">&darr;</button>
               </div>
               
               <div className="absolute top-0 right-0 flex flex-col gap-3">
                 <button className="w-14 h-14 bg-neutral-200 border-2 border-neutral-700 rounded-full flex items-center justify-center text-[9px] font-black uppercase hover:bg-white active:scale-95 transition-all shadow-md">CANCEL</button>
                 <button className="w-14 h-14 bg-neutral-200 border-2 border-neutral-700 rounded-full flex flex-col items-center justify-center text-[8px] font-black uppercase hover:bg-white active:scale-95 transition-all shadow-md leading-none">ACF<br/>ISOLATE</button>
               </div>
            </div>
          </div>

          <div className="flex justify-between items-center p-4">
             <div className="text-center font-black">
                <div className="text-[10px] uppercase text-neutral-500 mb-1">NORMAL</div>
                <div className="w-1.5 h-6 bg-neutral-300 mx-auto rounded-full shadow-inner"></div>
             </div>
             <div className="relative w-20 h-20 bg-neutral-300 rounded-2xl border-2 border-neutral-500 flex items-center justify-center shadow-inner overflow-hidden">
                <div className="absolute inset-2 border-2 border-neutral-400 rounded-full"></div>
                <div className="w-1.5 h-12 bg-neutral-800 rounded-full transform rotate-45 shadow-lg"></div>
                <div className="absolute bottom-1 text-[8px] font-black text-neutral-500">CONTROLS</div>
             </div>
             <div className="text-center font-black">
                <div className="text-[10px] uppercase text-neutral-500 mb-1">ENABLED</div>
                <div className="w-1.5 h-6 bg-neutral-300 mx-auto rounded-full shadow-inner"></div>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom: Firefighter Facility Controls - RED OUTLINE BOX */}
      <div className="mt-12 relative border-[3px] border-red-600 rounded-[50px] p-1 shadow-xl">
        <div className="border-[3px] border-red-600 rounded-[45px] p-8 flex justify-center gap-6 relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-8 bg-[#cdcdcd] text-red-600 text-xl font-black tracking-[0.3em] uppercase">
            FIREFIGHTER FACILITY
          </div>
          
          {/* EXTERNAL ALARM GROUP */}
          <div className="bg-[#bcbcbc] rounded-3xl p-4 flex flex-col items-center gap-4 w-32 border border-neutral-400">
             <div className={`w-4 h-4 rounded-full ${false ? 'bg-amber-400 shadow-[0_0_8px_amber]' : 'bg-neutral-800'}`}></div>
             <div className="text-[10px] font-black uppercase text-center h-8 flex items-center">EXTERNAL<br/>ALARM</div>
             <button onClick={() => onAction('SILENCE_EXT')} className="w-24 h-12 bg-neutral-100 border-2 border-black rounded-full text-[11px] font-black uppercase hover:bg-white active:scale-95 transition-all shadow-md">ISOLATE</button>
          </div>

          {/* WARNING SYSTEM GROUP */}
          <div className="bg-[#bcbcbc] rounded-3xl p-4 flex flex-col items-center gap-4 w-32 border border-neutral-400">
             <div className={`w-4 h-4 rounded-full ${false ? 'bg-amber-400 shadow-[0_0_8px_amber]' : 'bg-neutral-800'}`}></div>
             <div className="text-[10px] font-black uppercase text-center h-8 flex items-center">WARNING<br/>SYSTEM</div>
             <button onClick={() => {}} className="w-24 h-12 bg-neutral-100 border-2 border-red-600 rounded-full text-[11px] font-black uppercase hover:bg-white active:scale-95 transition-all shadow-md">ISOLATE</button>
          </div>

          {/* ALARM ACK GROUP */}
          <div className="bg-[#bcbcbc] rounded-3xl p-4 flex flex-col items-center gap-4 w-32 border border-neutral-400">
             <div className={`w-4 h-4 rounded-full ${isFire ? 'bg-red-600 shadow-[0_0_12px_red]' : 'bg-neutral-800'}`}></div>
             <div className="text-sm font-black uppercase text-center h-8 flex items-center text-red-600">ALARM</div>
             <button onClick={() => onAction('ACK')} className="w-24 h-12 bg-neutral-100 border-2 border-black rounded-full text-[11px] font-black uppercase hover:bg-white active:scale-95 transition-all shadow-md">ACK</button>
          </div>

          {/* FAULT RESET GROUP */}
          <div className="bg-[#bcbcbc] rounded-3xl p-4 flex flex-col items-center gap-4 w-32 border border-neutral-400">
             <div className={`w-4 h-4 rounded-full ${isFault ? 'bg-amber-400 shadow-[0_0_12px_amber]' : 'bg-neutral-800'}`}></div>
             <div className="text-[11px] font-black uppercase text-center h-8 flex items-center">FAULT</div>
             <button onClick={() => onAction('RESET')} className="w-24 h-12 bg-neutral-100 border-2 border-emerald-500 rounded-full text-[11px] font-black uppercase text-red-600 hover:bg-white active:scale-95 transition-all shadow-md">RESET</button>
          </div>

          {/* ISOLATED GROUP */}
          <div className="bg-[#bcbcbc] rounded-3xl p-4 flex flex-col items-center gap-4 w-32 border border-neutral-400">
             <div className={`w-4 h-4 rounded-full ${isIsolated ? 'bg-amber-400 shadow-[0_0_12px_amber]' : 'bg-neutral-800'}`}></div>
             <div className="text-[11px] font-black uppercase text-center h-8 flex items-center">ISOLATED</div>
             <button onClick={() => {}} className="w-24 h-12 bg-neutral-100 border-2 border-amber-500 rounded-full text-[11px] font-black uppercase hover:bg-white active:scale-95 transition-all shadow-md">ISOLATE</button>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-12 flex flex-col items-end opacity-20 pointer-events-none">
        <span className="text-4xl font-black italic text-neutral-800 tracking-tighter">AMPAC</span>
        <span className="text-[10px] font-black uppercase tracking-widest mt-1">Advanced Fire Detection</span>
      </div>
    </div>
  );
};

export default ZoneSensePanel;
