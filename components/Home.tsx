
import React from 'react';
import { AppView } from '../types';

interface HomeProps {
  onSelectPanel: (view: AppView) => void;
}

const Home: React.FC<HomeProps> = ({ onSelectPanel }) => {
  const panels = [
    {
      id: 'FIREFINDER_PLUS' as AppView,
      name: 'Ampac FireFinder PLUS',
      status: 'Available',
      badge: 'Industry Standard',
      description: 'Intelligent addressable fire alarm control panel. Supports large-scale network configurations and complex logical mapping.',
    },
    {
      id: 'PERTRONIC_F220' as AppView,
      name: 'Pertronic F220',
      status: 'Coming Soon',
      badge: 'Advanced Visual',
      description: 'Analogue addressable fire alarm system common in ANZ. Features a high-resolution color display and intuitive event mapping.',
      disabled: true,
    },
    {
      id: 'ZONESENSE_PLUS' as AppView,
      name: 'Ampac ZoneSense Plus',
      status: 'Coming Soon',
      badge: 'Obsolete',
      description: 'Fire panel no longer meets Australian Standards but may still be in use.',
      disabled: true,
    },
    {
      id: 'NOTIFIER' as any,
      name: 'Notifier ONYX Series',
      status: 'Coming Soon',
      badge: 'Future Update',
      description: 'Advanced fire alarm control systems with high-speed network communication and integrated voice evacuation.',
      disabled: true,
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8 flex flex-col items-center">
      <header className="max-w-6xl w-full mb-12 flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(220,38,38,0.4)]">
           <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
        </div>
        <h1 className="text-5xl font-black tracking-tight mb-4 uppercase italic">Fire Panel <span className="text-red-600">Sim</span></h1>
        <p className="text-neutral-400 max-w-2xl text-lg">
          High-fidelity simulations for firefighters and technicians. Practice silencing, investigating, isolating, and resetting industry-standard Fire Indicator Panels.
        </p>
      </header>

      <main className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {panels.map((panel) => (
          <div
            key={panel.name}
            onClick={() => !panel.disabled && onSelectPanel(panel.id)}
            className={`group relative overflow-hidden rounded-3xl border-2 transition-all duration-300 flex flex-col
              ${panel.disabled
                ? 'border-neutral-800 opacity-60 grayscale'
                : 'border-neutral-800 hover:border-red-500/50 hover:shadow-[0_0_40px_rgba(220,38,38,0.15)] cursor-pointer active:scale-[0.98]'}`}
          >
            <div className="p-6 flex flex-col flex-grow bg-neutral-900 min-h-[300px]">
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${panel.disabled ? 'bg-neutral-800 text-neutral-500' : 'bg-red-600 text-white'}`}>
                  {panel.badge}
                </span>
                <span className="text-xs font-bold text-neutral-500 uppercase">{panel.status}</span>
              </div>

              <h3 className="text-xl font-black mb-2 uppercase">{panel.name}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                {panel.description}
              </p>

              <div className="mt-auto">
                <button
                  className={`w-full py-3 rounded-xl font-bold transition-colors ${panel.disabled
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                    : 'bg-white text-black group-hover:bg-red-600 group-hover:text-white uppercase tracking-widest text-xs'}`}
                >
                  {panel.disabled ? 'Planned Feature' : 'Enter Simulator'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </main>

      <footer className="mt-20 text-neutral-600 text-xs font-bold uppercase tracking-widest text-center border-t border-neutral-900 pt-8 w-full max-w-6xl">
        Fire Panel Simulator is developed following available documentation and best practices.
      </footer>
    </div>
  );
};

export default Home;
