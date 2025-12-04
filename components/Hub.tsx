import React, { useState } from 'react';
import { User, Character } from '../types';
import { 
  Users, 
  Siren, 
  Gavel, 
  Briefcase, 
  Skull, 
  LogOut,
  ShieldCheck
} from 'lucide-react';
import StaffPanel from './StaffPanel';

interface HubProps {
  user: User;
  character: Character;
  onLogout: () => void;
}

const Hub: React.FC<HubProps> = ({ user, character, onLogout }) => {
  const [activePanel, setActivePanel] = useState<'main' | 'staff' | 'services' | 'illicit' | 'court'>('main');

  // Mock server status data
  const onlinePlayers = 32;
  const maxPlayers = 42;
  const queueCount = 5;

  // Mock online list
  const onlineList = Array.from({ length: 12 }, (_, i) => ({
    name: `Player_${i + 402}`,
    id: i,
    job: i % 3 === 0 ? 'Police' : i % 3 === 1 ? 'EMS' : 'Civilian'
  }));

  const renderContent = () => {
    switch (activePanel) {
      case 'staff':
        return <StaffPanel />;
      default:
        // Placeholder for other panels
        if (activePanel !== 'main') {
           return (
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center h-full flex flex-col items-center justify-center">
                <h2 className="text-2xl text-white font-bold mb-4 capitalize">{activePanel} Services</h2>
                <p className="text-slate-400">This module is currently under development.</p>
                <button 
                  onClick={() => setActivePanel('main')}
                  className="mt-6 text-indigo-400 hover:text-indigo-300 underline"
                >
                  Return to Dashboard
                </button>
            </div>
           );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
             {/* Public Services Bubble */}
             <button 
                onClick={() => setActivePanel('services')}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/40 to-slate-900 border border-blue-500/30 hover:border-blue-400/60 transition-all p-6 flex flex-col items-center justify-center min-h-[200px]"
             >
                <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
                <Briefcase className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold text-blue-100 z-10">Public Services</h3>
                <p className="text-sm text-blue-300/60 mt-2 text-center max-w-[200px] z-10">Police, EMS, and Government Jobs</p>
             </button>

             {/* Illicit Services Bubble */}
             <button 
                onClick={() => setActivePanel('illicit')}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900/40 to-slate-900 border border-red-500/30 hover:border-red-400/60 transition-all p-6 flex flex-col items-center justify-center min-h-[200px]"
             >
                <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
                <Skull className="w-12 h-12 text-red-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold text-red-100 z-10">Illicit Network</h3>
                <p className="text-sm text-red-300/60 mt-2 text-center max-w-[200px] z-10">Black Market, Gangs, and Dark Web</p>
             </button>

             {/* Court Bubble */}
             <button 
                onClick={() => setActivePanel('court')}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-900/40 to-slate-900 border border-amber-500/30 hover:border-amber-400/60 transition-all p-6 flex flex-col items-center justify-center min-h-[200px]"
             >
                <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
                <Gavel className="w-12 h-12 text-amber-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold text-amber-100 z-10">Tribunal</h3>
                <p className="text-sm text-amber-300/60 mt-2 text-center max-w-[200px] z-10">Justice System and Legal Proceedings</p>
             </button>

             {/* Staff Bubble - Only visible if staff */}
             {user.isStaff && (
               <button 
                  onClick={() => setActivePanel('staff')}
                  className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/30 hover:border-purple-400/60 transition-all p-6 flex flex-col items-center justify-center min-h-[200px]"
               >
                  <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors"></div>
                  <ShieldCheck className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-purple-100 z-10">Administration</h3>
                  <p className="text-sm text-purple-300/60 mt-2 text-center max-w-[200px] z-10">Manage characters and tickets</p>
               </button>
             )}
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0f172a] flex overflow-hidden">
      {/* Sidebar / Status Column */}
      <aside className="w-80 bg-slate-900 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <img src={user.avatar} alt="Avatar" className="w-12 h-12 rounded-full border-2 border-indigo-500" />
            <div>
              <h3 className="font-bold text-white truncate max-w-[150px]">{user.username}</h3>
              <span className="text-xs text-indigo-400 uppercase tracking-wider font-semibold">
                {character.first_name} {character.last_name}
              </span>
            </div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h4 className="text-slate-400 text-xs uppercase font-semibold mb-3 flex items-center">
              <Siren className="w-4 h-4 mr-2 text-red-500 animate-pulse" />
              Server Status
            </h4>
            <div className="flex justify-between items-end mb-2">
              <span className="text-2xl font-bold text-white">{onlinePlayers}<span className="text-slate-500 text-base font-normal">/{maxPlayers}</span></span>
              <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Online</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(onlinePlayers / maxPlayers) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Queue: <span className="text-white">{queueCount}</span> waiting</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h4 className="text-slate-500 text-xs uppercase font-bold mb-4 px-2">Online Citizens</h4>
          <div className="space-y-2">
            {onlineList.map((player) => (
              <div key={player.id} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-colors cursor-default">
                <div className={`w-2 h-2 rounded-full ${player.job === 'Police' ? 'bg-blue-500' : player.job === 'EMS' ? 'bg-red-500' : 'bg-slate-500'}`}></div>
                <span className="text-slate-300 text-sm">{player.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-700">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-slate-800 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-hidden flex flex-col">
        <header className="flex justify-between items-center mb-8">
            <div>
               <h1 className="text-3xl font-bold text-white tracking-tight">
                  {activePanel === 'main' ? 'City Dashboard' : 
                   activePanel === 'staff' ? 'Staff Control' : 
                   activePanel === 'court' ? 'Department of Justice' :
                   activePanel === 'illicit' ? 'Underground' : 'Public Services'}
               </h1>
               <p className="text-slate-400 mt-1">
                 Welcome to Los Santos, {character.first_name}.
               </p>
            </div>
            
            {activePanel !== 'main' && (
              <button 
                onClick={() => setActivePanel('main')}
                className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 transition-colors"
              >
                Back to Dashboard
              </button>
            )}
        </header>

        <div className="flex-1 overflow-y-auto pr-2 pb-2">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Hub;
