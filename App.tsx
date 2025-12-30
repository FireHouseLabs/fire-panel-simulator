
import React, { useState, useEffect, useCallback, useRef } from 'react';
import LCDDisplay from './components/LCDDisplay';
import F220LCD from './components/F220LCD';
import ZoneSensePanel from './components/ZoneSensePanel';
import LED from './components/LED';
import PanelButton from './components/PanelButton';
import Home from './components/Home';
import { PanelState, AlarmEvent, InputMode, TrainingStats, AppView } from './types';
import { generateFireScenario } from './services/geminiService';

const INITIAL_TRAINING: TrainingStats = {
  score: 0,
  startTime: null,
  actions: [],
  lastResult: null
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('HOME');
  const [state, setState] = useState<PanelState>({
    alarms: [],
    isolatedZones: [],
    buzzerSilenced: false,
    alarmsSilenced: false,
    currentDisplayIndex: 0,
    isTesting: false,
    isResetting: false,
    powerStatus: 'OK',
    systemStatus: 'OK',
    numericInput: '',
    inputTarget: 'NONE',
    menuVisible: false,
    selectedZoneForDisable: undefined,
    training: INITIAL_TRAINING
  });

  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const buzzerRef = useRef<OscillatorNode | null>(null);
  const sirenRef = useRef<{ oscillator: OscillatorNode; gain: GainNode } | null>(null);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playBuzzer = useCallback(() => {
    initAudio();
    if (buzzerRef.current) return;
    const ctx = audioContextRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    buzzerRef.current = osc;
  }, []);

  const stopBuzzer = useCallback(() => {
    if (buzzerRef.current) {
      try { buzzerRef.current.stop(); } catch(e) {}
      buzzerRef.current = null;
    }
  }, []);

  const playSiren = useCallback(() => {
    initAudio();
    if (sirenRef.current) return;
    const ctx = audioContextRef.current!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    
    // Woop woop sweep: 400Hz to 1200Hz every 1 second
    const sweep = () => {
      if (!audioContextRef.current) return;
      const now = audioContextRef.current.currentTime;
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.8);
    };

    sweep();
    const interval = setInterval(() => {
      if (sirenRef.current) sweep();
      else clearInterval(interval);
    }, 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    sirenRef.current = { oscillator: osc, gain };
  }, []);

  const stopSiren = useCallback(() => {
    if (sirenRef.current) {
      try { sirenRef.current.oscillator.stop(); } catch(e) {}
      sirenRef.current = null;
    }
  }, []);

  // Audio Logic Controller
  useEffect(() => {
    if (view !== 'HOME' && state.alarms.length > 0 && !state.isResetting) {
      if (!state.buzzerSilenced) {
        playBuzzer();
        stopSiren();
      } else if (!state.alarmsSilenced) {
        stopBuzzer();
        playSiren();
      } else {
        stopBuzzer();
        stopSiren();
      }
    } else {
      stopBuzzer();
      stopSiren();
    }
  }, [state.alarms, state.buzzerSilenced, state.alarmsSilenced, state.isResetting, playBuzzer, stopBuzzer, playSiren, stopSiren, view]);

  const recordAction = (action: string, scoreDelta: number = 0) => {
    setState(prev => ({
      ...prev,
      training: {
        ...prev.training,
        score: prev.training.score + scoreDelta,
        actions: [...prev.training.actions, action]
      }
    }));
  };

  const handleTriggerScenario = async () => {
    setIsLoadingScenario(true);
    try {
      const scenario = await generateFireScenario();
      const enrichedEvents = scenario.events.map(e => ({
        ...e,
        loop: Math.floor(Math.random() * 4) + 1,
        device: Math.floor(Math.random() * 128) + 1,
      }));
      setState(prev => ({
        ...prev,
        alarms: [...prev.alarms, ...enrichedEvents],
        buzzerSilenced: false,
        alarmsSilenced: false,
        training: {
          ...INITIAL_TRAINING,
          score: 0,
          startTime: Date.now(),
        }
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingScenario(false);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (state.inputTarget === 'DISABLE_SELECT') {
      const zone = state.selectedZoneForDisable;
      if (zone === undefined) return;

      if (val === '1') {
        recordAction(`Isolated Zone ${zone}`, 20);
        setState(prev => ({
          ...prev,
          isolatedZones: Array.from(new Set([...prev.isolatedZones, zone])),
          inputTarget: 'NONE',
          selectedZoneForDisable: undefined,
          numericInput: ''
        }));
      } else if (val === '0') {
        recordAction(`Enabled Zone ${zone}`, 10);
        setState(prev => ({
          ...prev,
          isolatedZones: prev.isolatedZones.filter(z => z !== zone),
          inputTarget: 'NONE',
          selectedZoneForDisable: undefined,
          numericInput: ''
        }));
      }
      return;
    }
    setState(prev => ({
      ...prev,
      numericInput: prev.numericInput.length < 5 ? prev.numericInput + val : prev.numericInput
    }));
  };

  const handleDisableEnableButton = () => {
    const isF220 = view === 'PERTRONIC_F220';
    
    // In F220 mode, if alarms are present, disable acts as an immediate isolate for active alarm zones
    if (isF220 && state.alarms.length > 0) {
      const activeZones = Array.from(new Set(state.alarms.map(a => a.zone)));
      recordAction(`Bulk Isolate Active Zones`, 40);
      setState(prev => ({
        ...prev,
        isolatedZones: Array.from(new Set([...prev.isolatedZones, ...activeZones]))
      }));
      return;
    }

    if (state.inputTarget === 'ZONE' && state.numericInput) {
      setState(prev => ({
        ...prev,
        inputTarget: 'DISABLE_SELECT',
        selectedZoneForDisable: parseInt(prev.numericInput),
        numericInput: '',
      }));
    } else if (state.inputTarget !== 'ZONE') {
      setState(prev => ({ ...prev, inputTarget: 'ZONE', numericInput: '' }));
    }
  };

  const calculateRank = (score: number) => {
    if (score >= 200) return "STATION OFFICER";
    if (score >= 150) return "SENIOR FIREFIGHTER";
    if (score >= 100) return "FIREFIGHTER";
    if (score >= 50) return "RECRUIT";
    return "TRAINEE";
  };

  const handleReset = () => {
    if (state.alarms.length === 0) return;
    const isF220 = view === 'PERTRONIC_F220';
    const isZoneSense = view === 'ZONESENSE_PLUS';

    // Pertronic specific check: both must be silenced
    if (isF220) {
      if (!state.buzzerSilenced || !state.alarmsSilenced) {
        recordAction("Protocol Violation: Unsilenced Reset", -60);
        alert("PERTRONIC PROTOCOL ERROR: Silence Buzzer AND Silence Alarms before Resetting.");
        return;
      }
    } else if (isZoneSense) {
      // ZoneSense specific: Silence Ext Alarms then Alarm Ack
      if (!state.alarmsSilenced || !state.buzzerSilenced) {
        recordAction("Protocol Violation: Unsilenced Reset", -60);
        alert("ZONESENSE PROTOCOL ERROR: Isolate Ext Alarms AND Ack Alarms before Resetting.");
        return;
      }
    } else {
      // Ampac FireFinder check: alarms silenced
      if (!state.alarmsSilenced) {
        recordAction("Cowboy Reset", -50);
        alert("WARNING: Silence Alarms before Resetting panel.");
        return;
      }
    }

    setState(prev => ({ ...prev, isResetting: true }));

    setTimeout(() => {
      setState(prev => {
        const unisolatedAlarms = prev.alarms.filter(a => {
           return a.isPersistent && !prev.isolatedZones.includes(a.zone);
        });

        const reAlarmed = unisolatedAlarms.length > 0;
        let finalScore = prev.training.score;
        let lastResult = prev.training.lastResult;

        if (reAlarmed) {
          finalScore -= 30;
        } else {
          const timeTaken = (Date.now() - (prev.training.startTime || Date.now())) / 1000;
          const timeBonus = Math.max(0, 100 - Math.floor(timeTaken));
          finalScore += 100 + timeBonus;
          
          lastResult = {
            score: finalScore,
            rank: calculateRank(finalScore),
            feedback: prev.isolatedZones.length > 0
              ? "Correct Procedure: Fault identified and isolated before system reset."
              : "Successful Response: Alarm cleared and system restored to normal."
          };
        }

        return {
          ...prev,
          isResetting: false,
          alarms: unisolatedAlarms,
          buzzerSilenced: !reAlarmed,
          alarmsSilenced: !reAlarmed,
          currentDisplayIndex: 0,
          training: {
            ...prev.training,
            score: finalScore,
            lastResult
          }
        };
      });
    }, 2000);
  };

  const handleCancel = () => {
    setState(prev => ({
      ...prev,
      numericInput: '',
      inputTarget: 'NONE',
      selectedZoneForDisable: undefined,
      training: { ...prev.training, lastResult: null }
    }));
  };

  const handleExitToHome = () => {
    stopBuzzer();
    stopSiren();
    setView('HOME');
    setState(prev => ({ ...prev, alarms: [], training: INITIAL_TRAINING, isolatedZones: [] }));
  };

  if (view === 'HOME') {
    return <Home onSelectPanel={(v) => setView(v)} />;
  }

  const isF220 = view === 'PERTRONIC_F220';
  const isZoneSense = view === 'ZONESENSE_PLUS';

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-4">
      {/* Simulation HUD */}
      <div className="mb-6 flex w-full max-w-6xl justify-between items-center">
        <button onClick={handleExitToHome} className="text-white bg-neutral-800 px-4 py-2 rounded-lg font-bold text-xs uppercase hover:bg-neutral-700 transition-colors">
          &larr; Exit to Selection
        </button>
        <button onClick={handleTriggerScenario} disabled={isLoadingScenario} className="bg-red-600 text-white px-6 py-2 rounded-lg font-black text-xs uppercase shadow-lg active:scale-95 disabled:opacity-50">
          {isLoadingScenario ? 'Generating...' : 'Trigger Scenario'}
        </button>
        <div className="bg-neutral-800 px-6 py-2 rounded-lg border border-neutral-700 flex gap-6 text-[10px] font-bold text-white uppercase tracking-widest">
           <div>Score: <span className="text-green-500">{state.training.score}</span></div>
           <div>Rank: <span className="text-amber-500">{calculateRank(state.training.score)}</span></div>
        </div>
      </div>

      {isZoneSense ? (
        <ZoneSensePanel 
          state={state} 
          onAction={(action) => {
            if (action === 'SILENCE_EXT') {
              if (state.alarms.length > 0 && !state.alarmsSilenced) recordAction("Silenced Ext Alarms", 20);
              setState(s => ({...s, alarmsSilenced: true}));
            } else if (action === 'ACK') {
              if (state.alarms.length > 0 && !state.buzzerSilenced) recordAction("Ack Alarms", 10);
              setState(s => ({...s, buzzerSilenced: true}));
            } else if (action === 'RESET') {
              handleReset();
            }
          }}
        />
      ) : isF220 ? (
        /* PERTRONIC F220 SPECIFIC UI */
        <div className="relative w-full max-w-[1040px] bg-[#d4d4d4] p-8 rounded-[40px] border-[12px] border-neutral-400 shadow-2xl flex flex-col gap-4">
          <div className="relative border-4 border-red-600 rounded-3xl p-6 bg-white shadow-inner flex flex-col md:flex-row gap-6">
            <div className="absolute -top-3 left-10 px-4 bg-red-600 text-white text-[10px] font-black tracking-widest uppercase">Fire Brigade Panel</div>
            
            {/* Left side Indicators - Physical Latching LEDs */}
            <div className="flex flex-col gap-3 mt-6">
              <div className={`w-20 h-16 flex items-center justify-center rounded border-2 font-black text-[11px] text-center uppercase transition-all duration-300 ${state.alarms.some(a => a.status === 'FIRE') ? 'bg-red-600 border-red-800 text-white shadow-[0_0_20px_rgba(220,38,38,0.8)]' : 'bg-neutral-200 border-neutral-300 text-neutral-400'}`}>Fire</div>
              <div className={`w-20 h-16 flex items-center justify-center rounded border-2 font-black text-[9px] text-center leading-tight uppercase transition-all duration-300 ${state.alarms.length > 0 && !state.alarmsSilenced ? 'bg-red-600 border-red-800 text-white shadow-[0_0_15px_rgba(220,38,38,0.6)]' : 'bg-neutral-200 border-neutral-300 text-neutral-400'}`}>Alarm Routing<br/>Activated</div>
              <div className={`w-20 h-16 flex items-center justify-center rounded border-2 font-black text-[11px] text-center uppercase transition-all duration-300 ${state.powerStatus === 'OK' ? 'bg-emerald-500 border-emerald-700 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-neutral-200 border-neutral-300 text-neutral-400'}`}>Power</div>
            </div>

            {/* Center Area: LCD + Control Cluster */}
            <div className="flex-grow flex flex-col gap-2">
              <div className="aspect-[16/9] bg-black border-4 border-neutral-800 rounded shadow-2xl overflow-hidden relative">
                <F220LCD state={state} />
              </div>

              {/* Soft Keys - Triangular Buttons positioned below LCD */}
              <div className="flex justify-around px-8 mt-1">
                {[1, 2, 3, 4].map(n => (
                  <button key={n} className="group relative flex flex-col items-center">
                    <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[24px] border-b-neutral-500 group-hover:border-b-neutral-400 group-active:scale-90 transition-all cursor-pointer" />
                  </button>
                ))}
              </div>

              {/* Functional Controls Cluster */}
              <div className="grid grid-cols-5 gap-4 mt-6">
                <PanelButton label="Silence Buzzer" onClick={() => {
                  if (state.alarms.length > 0 && !state.buzzerSilenced) recordAction("Silenced Buzzer", 10);
                  setState(s => ({...s, buzzerSilenced: true}));
                }} className="h-20 text-[10px] font-bold bg-neutral-100 border-neutral-400" />
                
                <PanelButton label={"SILENCE/\nRESOUND\nALARM"} onClick={() => {
                   if (!state.alarmsSilenced) recordAction("Silenced Alarms", 20);
                   setState(s => ({...s, alarmsSilenced: !s.alarmsSilenced}));
                }} variant="default" className="h-20 text-[10px] font-black border-2 border-red-600 bg-white text-red-700" />
                
                <div className="flex flex-col gap-1 border-2 border-neutral-300 p-1.5 rounded-xl bg-neutral-50 relative">
                  <div className="text-[7px] font-black text-center text-neutral-500 uppercase tracking-tighter">Several Alarms</div>
                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <div className={`w-1.5 h-1.5 rounded-full ${state.alarms.length > 1 ? 'bg-red-600 shadow-[0_0_4px_red]' : 'bg-neutral-400'}`}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 h-full pt-4">
                    <button onClick={() => setState(s => ({...s, currentDisplayIndex: (s.currentDisplayIndex - 1 + s.alarms.length) % s.alarms.length}))} className="bg-neutral-200 border-2 border-neutral-300 rounded-lg flex items-center justify-center hover:bg-neutral-100 active:bg-neutral-400 transition-colors shadow-sm">&larr;</button>
                    <button onClick={() => setState(s => ({...s, currentDisplayIndex: (s.currentDisplayIndex + 1) % s.alarms.length}))} className="bg-neutral-200 border-2 border-neutral-300 rounded-lg flex items-center justify-center hover:bg-neutral-100 active:bg-neutral-400 transition-colors shadow-sm">&rarr;</button>
                  </div>
                </div>

                <PanelButton label="Reset" onClick={handleReset} variant="green" className="h-20 font-bold text-xs" />
                <PanelButton label="Disable" onClick={handleDisableEnableButton} variant="yellow" className="h-20 font-bold text-xs border-amber-500 bg-amber-50" />
              </div>
            </div>

            {/* Right side Cluster: Indicators + Numeric Keypad */}
            <div className="w-52 flex flex-col gap-3">
              {/* FAULT Indicator Area - AMBER/ORANGE BACKGROUND */}
              <div className="bg-amber-400 border-2 border-amber-600 p-3 rounded-2xl shadow-sm text-[10px]">
                <div className="text-center font-black text-amber-900 bg-amber-500/30 border-b border-amber-600 mb-2 py-0.5 tracking-[0.2em]">FAULT</div>
                <div className="grid grid-cols-1 gap-1.5 font-bold text-amber-950">
                  <div className="flex justify-between items-center"><span>System</span> <div className={`w-2.5 h-2.5 rounded-full border border-amber-900/40 ${state.alarms.some(a => a.isPersistent) ? 'bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,1)]' : 'bg-neutral-800'}`}></div></div>
                  <div className="flex justify-between items-center"><span>Power</span> <div className={`w-2.5 h-2.5 rounded-full border border-amber-900/40 ${state.powerStatus === 'FAULT' ? 'bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,1)]' : 'bg-neutral-800'}`}></div></div>
                  <div className="flex justify-between items-center"><span>Loop</span> <div className={`w-2.5 h-2.5 rounded-full border border-amber-900/40 ${false ? 'bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,1)]' : 'bg-neutral-800'}`}></div></div>
                  <div className="flex justify-between items-center"><span>Earth</span> <div className="w-2.5 h-2.5 bg-neutral-800 rounded-full border border-amber-900/40"></div></div>
                  <div className="flex justify-between items-center"><span>Sndr</span> <div className={`w-2.5 h-2.5 rounded-full border border-amber-900/40 ${state.alarmsSilenced ? 'bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,1)]' : 'bg-neutral-800'}`}></div></div>
                </div>
              </div>

              {/* Status List - GREY BACKGROUND */}
              <div className="bg-neutral-300 border-2 border-neutral-400 rounded-2xl p-2.5 space-y-2 text-[9px] font-black text-neutral-700">
                 <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 border border-neutral-500 ${state.alarmsSilenced ? 'bg-amber-400 shadow-[0_0_3px_amber]' : 'bg-white'}`}></div> ALARMS SILENCED</div>
                 <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 border border-neutral-500 bg-white`}></div> SOUNDER DISABLED</div>
                 <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 border border-neutral-500 bg-white`}></div> PRE-ALARM</div>
                 <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 border border-neutral-500 bg-white`}></div> SUPERVISORY</div>
                 <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 border-2 border-neutral-800 bg-white relative flex items-center justify-center`}><div className="w-1 h-1 bg-neutral-800"></div></div> DELAY <span className="ml-auto text-[7px] text-neutral-500 opacity-60">TEST</span></div>
              </div>

              {/* Keypad Row */}
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                  <button key={n} onClick={() => handleKeypadPress(n.toString())} className="bg-neutral-200 border-b-4 border-neutral-400 rounded-xl h-10 flex flex-col items-center justify-center hover:bg-neutral-100 active:translate-y-0.5 active:border-b-0 transition-all shadow-sm">
                    <span className="text-sm font-black text-neutral-800">{n}</span>
                    <span className="text-[6px] font-bold text-neutral-500">{['', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'][n-1]}</span>
                  </button>
                ))}
                <button onClick={handleCancel} className="bg-neutral-200 border-b-4 border-neutral-400 rounded-xl h-10 flex items-center justify-center text-[8px] font-black uppercase leading-[1] text-neutral-700 active:translate-y-0.5 active:border-b-0">ESC/<br/>BACK</button>
                <button onClick={() => handleKeypadPress('0')} className="bg-neutral-200 border-b-4 border-neutral-400 rounded-xl h-10 flex items-center justify-center text-sm font-black text-neutral-800 active:translate-y-0.5 active:border-b-0">0</button>
                <button className="bg-neutral-200 border-b-4 border-neutral-400 rounded-xl h-10 flex items-center justify-center text-[9px] font-black uppercase text-neutral-700 active:translate-y-0.5 active:border-b-0">Menu</button>
              </div>

              {/* Navigation Cluster */}
              <div className="flex flex-col items-center gap-1.5 mt-2">
                <button className="bg-neutral-200 border-b-4 border-neutral-400 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neutral-100 active:translate-y-0.5 active:border-b-0">&uarr;</button>
                <div className="flex gap-1.5">
                   <button className="bg-neutral-200 border-b-4 border-neutral-400 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neutral-100 active:translate-y-0.5 active:border-b-0">&larr;</button>
                   <button className="bg-neutral-200 border-b-4 border-neutral-400 w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-neutral-800 active:translate-y-0.5 active:border-b-0">OK</button>
                   <button className="bg-neutral-200 border-b-4 border-neutral-400 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neutral-100 active:translate-y-0.5 active:border-b-0">&rarr;</button>
                </div>
                <button className="bg-neutral-200 border-b-4 border-neutral-400 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-neutral-100 active:translate-y-0.5 active:border-b-0">&darr;</button>
              </div>
            </div>
          </div>

          {/* Dedicated Functional Row Cluster below Red Box */}
          <div className="grid grid-cols-7 gap-4 mt-4 px-2">
             <div className="flex flex-col gap-1.5 items-center">
                <div className={`w-5 h-1.5 rounded-full transition-all ${state.alarms.length > 0 ? 'bg-red-600 shadow-[0_0_8px_red]' : 'bg-neutral-800'}`}></div>
                <PanelButton label="Alarms" onClick={() => {}} className="w-full text-[10px] font-black h-12 bg-neutral-100 border-neutral-400" />
             </div>
             <div className="flex flex-col gap-1.5 items-center">
                <div className={`w-5 h-1.5 rounded-full transition-all ${state.alarms.some(a => a.status === 'FAULT') ? 'bg-amber-400 shadow-[0_0_8px_amber]' : 'bg-neutral-800'}`}></div>
                <PanelButton label="Faults" onClick={() => {}} className="w-full text-[10px] font-black h-12 bg-neutral-100 border-neutral-400" />
             </div>
             <div className="flex flex-col gap-1.5 items-center">
                <div className={`w-5 h-1.5 rounded-full transition-all ${state.isolatedZones.length > 0 ? 'bg-amber-400 shadow-[0_0_8px_amber]' : 'bg-neutral-800'}`}></div>
                <PanelButton label="Disable-ments" onClick={() => {}} className="w-full text-[9px] font-black h-12 bg-neutral-100 border-neutral-400" />
             </div>
             <div className="flex flex-col gap-1.5 items-center">
                <div className="w-5 h-1.5 bg-neutral-800 rounded-full"></div>
                <PanelButton label="ACF Disable" onClick={() => {}} variant="yellow" className="w-full text-[9px] font-black h-12 border-2 border-amber-600 shadow-md" />
             </div>
             <div className="flex flex-col gap-1.5 items-center">
                <div className="w-5 h-1.5 bg-neutral-800 rounded-full"></div>
                <PanelButton label="Door Holder Disable" onClick={() => {}} variant="yellow" className="w-full text-[8px] font-black h-12 border-2 border-amber-600 shadow-md" />
             </div>
             <div className="flex flex-col gap-1.5 items-center">
                <div className="w-5 h-1.5 bg-neutral-800 rounded-full"></div>
                <PanelButton label="Warn System Disable" onClick={() => {}} variant="yellow" className="w-full text-[8px] font-black h-12 border-2 border-amber-600 shadow-md" />
             </div>
             <div className="flex flex-col gap-1.5 items-center">
                <div className="w-5 h-1.5 bg-neutral-800 rounded-full"></div>
                <PanelButton label="Warn System On" onClick={() => {}} variant="red" className="w-full text-[8px] font-black h-12 border-2 border-red-600 shadow-md" />
             </div>
          </div>

          {/* Branding & Compliance Footer */}
          <div className="mt-4 flex justify-between items-end border-t border-neutral-300 pt-6 px-4">
             <div className="flex items-baseline gap-4">
                <div className="flex flex-col">
                   <span className="text-red-700 font-black italic text-4xl uppercase tracking-tighter leading-none">Pertronic</span>
                   <span className="text-[10px] text-red-600 font-black uppercase tracking-widest mt-1">Industries Limited</span>
                </div>
                <div className="h-10 w-[2px] bg-neutral-400 self-center mx-2"></div>
                <div className="flex flex-col justify-center">
                  <span className="text-neutral-700 text-sm font-black uppercase tracking-[0.2em]">F220</span>
                  <span className="text-[8px] text-neutral-500 font-bold uppercase tracking-widest">Analogue Addressable Fire Alarm System</span>
                </div>
             </div>
             <div className="text-right">
               <div className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.1em] mb-1">Australian Standard Compliance</div>
               <div className="text-[10px] font-black text-neutral-700 uppercase tracking-widest bg-neutral-200 px-3 py-1 rounded">AS7240.2 & AS4428.3-2010</div>
             </div>
          </div>
        </div>
      ) : (
        /* AMPAC FIREFINDER PLUS UI */
        <div className="relative w-full max-w-5xl panel-bg border-[14px] border-neutral-400 rounded-[50px] p-8 shadow-2xl flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-grow border-4 border-red-700 rounded-3xl p-6 bg-neutral-200 shadow-inner relative">
              <div className="absolute -top-3 left-8 px-3 bg-red-700 text-white text-[11px] font-black tracking-widest uppercase">Fire Brigade Panel - {view.replace('_', ' ')}</div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[380px]">
                <div className="md:col-span-3 flex flex-col gap-4 pt-6">
                  <div className="bg-neutral-300/50 p-2 rounded-lg border border-neutral-400/30">
                    <LED label="FIRE" color="red" isOn={state.alarms.some(a => a.status === 'FIRE')} isFlashing />
                    <LED label="ALARM ROUTING ACTIVATED" color="red" isOn={state.alarms.length > 0 && !state.alarmsSilenced} isFlashing />
                  </div>
                  <div className="mt-auto flex flex-col gap-3">
                    <PanelButton label="SILENCE BUZZER" onClick={() => {
                      if (state.alarms.length > 0 && !state.buzzerSilenced) recordAction("Silenced Buzzer", 10);
                      setState(s => ({...s, buzzerSilenced: true}));
                    }} className="h-16 w-full" />
                    <PanelButton label="SILENCE / RESOUND ALARM" onClick={() => {
                        if (!state.alarmsSilenced) recordAction("Silenced Alarms", 20);
                        setState(s => ({...s, alarmsSilenced: !s.alarmsSilenced}));
                      }} variant="red" className="h-24 w-full" />
                  </div>
                </div>

                <div className="md:col-span-7 flex flex-col gap-4">
                  <div className="flex-grow"><LCDDisplay state={state} /></div>
                  <div className="grid grid-cols-4 gap-3">
                    <PanelButton label="PREVIOUS" onClick={() => setState(s => ({...s, currentDisplayIndex: (s.currentDisplayIndex - 1 + s.alarms.length) % s.alarms.length}))} className="h-12" />
                    <PanelButton label="NEXT" onClick={() => setState(s => ({...s, currentDisplayIndex: (s.currentDisplayIndex + 1) % s.alarms.length}))} className="h-12" />
                    <PanelButton label="RESET" onClick={handleReset} variant="green" className="h-16" />
                    <PanelButton label="DISABLE" onClick={handleDisableEnableButton} variant="yellow" className="h-16" />
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col gap-1 py-1 border-l border-neutral-300 pl-4 text-[9px]">
                  <LED label="POWER" color="green" isOn={state.powerStatus === 'OK'} />
                  <LED label="SYSTEM FAULT" color="yellow" isOn={state.alarms.some(a => a.isPersistent)} />
                  <LED label="EARTH FAULT" color="yellow" isOn={false} />
                  <LED label="TEST" color="yellow" isOn={false} />
                  <LED label="FAULT" color="yellow" isOn={state.alarms.some(a => a.status === 'FAULT')} />
                  <LED label="DISABLED" color="yellow" isOn={state.isolatedZones.length > 0} />
                  <LED label="ALARMS SILENCED" color="yellow" isOn={state.alarmsSilenced} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-4 py-6 border-t-2 border-neutral-400">
            <div className="flex flex-col gap-2">
              <PanelButton label="ZONE / DEVICE DISABLE / ENABLE" onClick={handleDisableEnableButton} variant="yellow" className="h-14" />
              <PanelButton label="ALARM DEVICES DISABLE" onClick={() => {}} variant="yellow" />
              <PanelButton label="ANCILLARY DISABLE" onClick={() => {}} variant="yellow" />
              <PanelButton label="DELAY OVERRIDE" onClick={() => {}} variant="yellow" />
            </div>
            <div className="grid grid-cols-2 gap-2 content-start">
              <PanelButton label="LOOP" onClick={() => setState(s => ({...s, inputTarget: 'LOOP', numericInput: ''}))} variant="keypad" />
              <PanelButton label="DEVICE" onClick={() => setState(s => ({...s, inputTarget: 'DEVICE', numericInput: ''}))} variant="keypad" />
              <PanelButton label="ZONE" onClick={() => setState(s => ({...s, inputTarget: 'ZONE', numericInput: ''}))} variant="keypad" />
              <PanelButton label="DISPLAY" onClick={() => {}} variant="keypad" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <PanelButton key={n} label={n.toString()} onClick={() => handleKeypadPress(n.toString())} variant="keypad" className="aspect-square" />
              ))}
              <PanelButton label="CANCEL" onClick={handleCancel} variant="keypad" className="bg-neutral-400 text-xs" />
              <PanelButton label="0" onClick={() => handleKeypadPress('0')} variant="keypad" className="aspect-square" />
              <PanelButton label="ENTER" onClick={() => {}} variant="green" className="text-[10px]" />
            </div>
            <div className="flex flex-col gap-3">
              <PanelButton label="CANCEL ENTRY" onClick={handleCancel} className="h-12 text-xs" />
              <div className="grid grid-cols-2 gap-2">
                <PanelButton label="MENU" onClick={() => {}} className="h-12" />
                <PanelButton label="FUNCTION" onClick={() => {}} className="h-12" />
              </div>
              <div className="mt-auto text-right pr-2">
                <div className="text-xl font-black italic text-neutral-600 tracking-tighter">AMPAC</div>
                <div className="text-[8px] font-bold text-neutral-500 uppercase">AS7240.2 / AS7240.4</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Instructions Dashboard */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl">
        <div className="bg-neutral-800/80 p-5 rounded-2xl border-l-4 border-red-600 backdrop-blur-md shadow-xl">
          <h4 className="text-red-500 font-black mb-3 text-[10px] tracking-widest uppercase">Emergency Protocol</h4>
          <ol className="text-neutral-300 text-[10px] font-bold space-y-2 list-decimal ml-4">
            <li><strong>SILENCE BUZZER:</strong> Stop local alert (Ack).</li>
            <li><strong>CHECK DISPLAY:</strong> Identify event location.</li>
            <li><strong>SILENCE ALARMS:</strong> Silence external bells/speakers.</li>
            <li><strong>RESET:</strong> Clear panel memory.</li>
          </ol>
        </div>

        <div className="bg-neutral-800/80 p-5 rounded-2xl border-l-4 border-amber-500 backdrop-blur-md shadow-xl">
          <h4 className="text-amber-500 font-black mb-3 text-[10px] tracking-widest uppercase">Isolate Strategy</h4>
          <p className="text-neutral-300 text-[10px] leading-tight mb-2">
            Persistent faults require <strong>Isolation</strong> to allow the rest of the building protection to be restored.
          </p>
          <div className="text-neutral-400 text-[9px] uppercase font-bold bg-neutral-900/50 p-2 rounded">
            Pro-Tip: F220 & ZoneSense "DISABLE" buttons act as bulk isolates for active alarms in this sim.
          </div>
        </div>

        <div className="bg-neutral-800/80 p-5 rounded-2xl border-l-4 border-blue-500 backdrop-blur-md shadow-xl">
          <h4 className="text-blue-500 font-black mb-3 text-[10px] tracking-widest uppercase">Panel Selection</h4>
          <div className="text-neutral-300 text-[10px] space-y-2 font-medium">
            <p><strong>FireFinder:</strong> Addressable, text-heavy.</p>
            <p><strong>F220:</strong> Visual color-coded high-res interface.</p>
            <p><strong>ZoneSense:</strong> Conventional LED-driven interface.</p>
          </div>
        </div>

        <div className="bg-neutral-800/80 p-5 rounded-2xl border-l-4 border-emerald-500 backdrop-blur-md shadow-xl">
          <h4 className="text-emerald-500 font-black mb-3 text-[10px] tracking-widest uppercase">Scoring Criteria</h4>
          <div className="text-neutral-400 text-[10px] space-y-1">
            <div className="flex justify-between border-b border-neutral-700 pb-1"><span>Silence Sequence</span> <span className="text-emerald-500">+20</span></div>
            <div className="flex justify-between border-b border-neutral-700 pb-1"><span>Identify Persistent Fault</span> <span className="text-emerald-500">+40</span></div>
            <div className="flex justify-between border-b border-neutral-700 pb-1"><span>Correct Reset</span> <span className="text-emerald-500">+100</span></div>
            <div className="flex justify-between"><span>Protocol Error</span> <span className="text-red-500">-60</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
