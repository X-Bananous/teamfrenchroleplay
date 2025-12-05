
import { state } from '../state.js';
import { BankView } from './bank.js';
import { StaffView } from './staff.js';
import { AssetsView } from './assets.js';
import { hasPermission } from '../utils.js';

export const HubView = () => {
    let content = '';
    
    if (state.activeHubPanel === 'main') {
        const showStaffCard = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;

        content = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                <!-- Bank Card -->
                <button onclick="actions.setHubPanel('bank')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-emerald-500/20">
                    <div class="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <i data-lucide="landmark" class="w-6 h-6"></i>
                    </div>
                    <div class="relative z-10">
                        <h3 class="text-xl font-bold text-white">Ma Banque</h3>
                        <p class="text-sm text-gray-400 mt-1">Solde, Retraits & Virements</p>
                    </div>
                </button>

                <!-- Patrimoine Card -->
                <button onclick="actions.setHubPanel('assets')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-indigo-500/20">
                    <div class="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                        <i data-lucide="gem" class="w-6 h-6"></i>
                    </div>
                    <div class="relative z-10">
                        <h3 class="text-xl font-bold text-white">Patrimoine</h3>
                        <p class="text-sm text-gray-400 mt-1">Inventaire & Valeur Totale</p>
                    </div>
                </button>

                <!-- Services -->
                <button onclick="actions.setHubPanel('services')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer">
                    <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                        <i data-lucide="siren" class="w-6 h-6"></i>
                    </div>
                    <div class="relative z-10">
                        <h3 class="text-xl font-bold text-white">Urgence & Services</h3>
                        <p class="text-sm text-gray-400 mt-1">Police, Sheriff, Fire & DOT</p>
                    </div>
                </button>

                <!-- Illicit -->
                <button onclick="actions.setHubPanel('illicit')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer">
                    <div class="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 mb-4 group-hover:bg-red-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                        <i data-lucide="skull" class="w-6 h-6"></i>
                    </div>
                    <div class="relative z-10">
                        <h3 class="text-xl font-bold text-white">Monde Criminel</h3>
                        <p class="text-sm text-gray-400 mt-1">Mafias, Gangs & Marché Noir</p>
                    </div>
                </button>

                <!-- Staff Card (Conditional) -->
                ${showStaffCard ? `
                <button onclick="actions.setHubPanel('staff')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden border-purple-500/20 cursor-pointer">
                    <div class="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                        <i data-lucide="shield-alert" class="w-6 h-6"></i>
                    </div>
                    <div class="relative z-10">
                        <h3 class="text-xl font-bold text-white">Administration</h3>
                        <p class="text-sm text-gray-400 mt-1">Gestion Joueurs & Whitelist</p>
                        ${state.pendingApplications.length > 0 ? `<div class="absolute top-0 right-0 mt-6 mr-6 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>` : ''}
                    </div>
                </button>
                ` : ''}
            </div>
        `;
    } else if (state.activeHubPanel === 'bank') {
        content = BankView();
    } else if (state.activeHubPanel === 'assets') {
        content = AssetsView();
    } else if (state.activeHubPanel === 'staff') {
        content = StaffView();
    } else {
            content = `
            <div class="flex flex-col items-center justify-center h-[50vh] text-center animate-fade-in">
                <div class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                    <i data-lucide="cone" class="w-10 h-10 text-gray-400"></i>
                </div>
                <h2 class="text-2xl font-bold text-white mb-2">En Développement</h2>
                <p class="text-gray-400 max-w-md">Le module <span class="text-blue-400 capitalize">${state.activeHubPanel}</span> est en cours de construction.</p>
                <button onclick="actions.setHubPanel('main')" class="mt-8 glass-btn-secondary px-6 py-2 rounded-xl text-sm">Retour</button>
            </div>
        `;
    }

    // Sidebar Navigation Logic
    const navItem = (panel, icon, label, color = 'text-white') => {
        const isActive = state.activeHubPanel === panel;
        const bgClass = isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white';
        return `
            <button onclick="actions.setHubPanel('${panel}')" class="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${bgClass}">
                <i data-lucide="${icon}" class="w-5 h-5 ${isActive ? color : ''}"></i>
                ${label}
            </button>
        `;
    };

    const hasStaffAccess = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;

    return `
        <div class="flex h-full w-full bg-[#050505]">
            <!-- Sidebar -->
            <aside class="w-72 glass-panel border-y-0 border-l-0 flex flex-col relative z-20">
                <div class="p-6 border-b border-white/5">
                    <div class="flex items-center gap-3">
                        <img src="${state.user.avatar}" class="w-10 h-10 rounded-full border border-white/10">
                        <div class="overflow-hidden">
                            <h3 class="font-bold text-white truncate text-sm">${state.user.username}</h3>
                            <p class="text-xs text-blue-400 font-semibold uppercase tracking-wider">${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</p>
                        </div>
                    </div>
                </div>
                
                <div class="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Menu Principal</div>
                    ${navItem('main', 'layout-grid', 'Tableau de bord', 'text-blue-400')}
                    ${navItem('bank', 'landmark', 'Ma Banque', 'text-emerald-400')}
                    ${navItem('assets', 'gem', 'Patrimoine', 'text-indigo-400')}
                    ${navItem('services', 'siren', 'Services Publics', 'text-blue-400')}
                    ${navItem('illicit', 'skull', 'Illégal', 'text-red-400')}
                    
                    ${hasStaffAccess ? `
                        <div class="my-4 border-t border-white/5"></div>
                        <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Staff</div>
                        ${navItem('staff', 'shield-alert', 'Administration', 'text-purple-400')}
                    ` : ''}
                </div>

                <div class="p-4 bg-black/20 border-t border-white/5">
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="actions.backToSelect()" class="w-full glass-btn-secondary py-2 rounded-lg text-xs text-gray-300 hover:bg-white/10 cursor-pointer flex items-center justify-center gap-1" title="Changer de personnage">
                            <i data-lucide="users" class="w-3 h-3"></i> Persos
                            </button>
                            <button onclick="actions.confirmLogout()" class="w-full glass-btn-secondary py-2 rounded-lg text-xs text-red-300 hover:bg-red-900/20 border-red-500/10 cursor-pointer flex items-center justify-center gap-1">
                            <i data-lucide="log-out" class="w-3 h-3"></i> Sortir
                            </button>
                        </div>
                </div>
            </aside>

            <!-- Content -->
            <main class="flex-1 flex flex-col relative overflow-hidden">
                <header class="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-md z-10">
                    <h1 class="text-xl font-bold text-white capitalize">
                        ${state.activeHubPanel === 'main' ? 'Los Angeles' : 
                          state.activeHubPanel === 'bank' ? 'Banque Nationale' : 
                          state.activeHubPanel === 'assets' ? 'Gestion de Patrimoine' :
                          state.activeHubPanel}
                    </h1>
                    <div class="flex items-center gap-4">
                        <div class="bg-black/40 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                            <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span class="text-xs font-mono text-gray-300">En Ligne</span>
                        </div>
                    </div>
                </header>

                <div class="flex-1 overflow-y-auto p-8 relative z-0 custom-scrollbar">
                    ${content}
                </div>
            </main>
        </div>
    `;
};