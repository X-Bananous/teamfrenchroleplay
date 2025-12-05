

import { state } from '../state.js';
import { createHeistLobby, inviteToLobby, startHeistSync } from '../services.js';
import { showToast, showModal } from '../ui.js';

export const BLACK_MARKET_CATALOG = {
    light: [
        { name: "Beretta M9", price: 2800, icon: "target" },
        { name: "Revolver", price: 3000, icon: "circle-dot" },
        { name: "Colt M1911", price: 3500, icon: "target" },
        { name: "Colt Python", price: 4200, icon: "circle-dot" },
        { name: "Desert Eagle", price: 4500, icon: "triangle" }
    ],
    medium: [
        { name: "TEC 9", price: 9500, icon: "zap" },
        { name: "SKORPION", price: 14500, icon: "zap" },
        { name: "Remington 870", price: 16500, icon: "move" },
        { name: "Kriss Vector", price: 20500, icon: "zap" }
    ],
    heavy: [
        { name: "PPSH 41", price: 40000, icon: "flame" },
        { name: "AK47", price: 50000, icon: "flame" }
    ],
    sniper: [
        { name: "Remington MSR", price: 60000, icon: "crosshair" }
    ]
};

export const HEIST_DATA = [
    { id: 'house', name: 'Cambriolage Maison', min: 100, max: 500, time: 60, rate: 70, icon: 'home' },
    { id: 'gas', name: 'Station Service', min: 500, max: 1000, time: 105, rate: 65, icon: 'fuel' },
    { id: 'atm', name: 'Braquage ATM', min: 1000, max: 5000, time: 90, rate: 50, icon: 'credit-card' },
    { id: 'truck', name: 'Fourgon Blindé', min: 250000, max: 500000, time: 900, rate: 15, icon: 'truck' },
    { id: 'jewelry', name: 'Bijouterie', min: 500000, max: 700000, time: 1020, rate: 10, icon: 'gem' },
    { id: 'bank', name: 'Banque Centrale', min: 700000, max: 1000000, time: 1200, rate: 5, icon: 'landmark' }
];

export const IllicitView = () => {
    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500"><div class="loader-spinner mb-4 mx-auto"></div>Chargement du réseau...</div>';

    // --- LOBBY SYSTEM ---
    if (state.activeHeistLobby) {
        const lobby = state.activeHeistLobby;
        const heistInfo = HEIST_DATA.find(h => h.id === lobby.heist_type);
        const amHost = lobby.host_id === state.activeCharacter.id;

        // 1. SETUP PHASE
        if (lobby.status === 'setup') {
             return `
                <div class="animate-fade-in max-w-2xl mx-auto mt-10">
                    <div class="glass-panel p-8 rounded-2xl relative overflow-hidden">
                        <div class="absolute top-0 right-0 p-6 opacity-5"><i data-lucide="${heistInfo.icon}" class="w-32 h-32 text-white"></i></div>
                        
                        <div class="relative z-10 mb-6 border-b border-white/10 pb-6">
                            <h2 class="text-2xl font-bold text-white flex items-center gap-3">
                                <span class="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
                                Préparation: ${heistInfo.name}
                            </h2>
                            <p class="text-gray-400 text-sm mt-1">Invitez votre équipe avant de lancer l'opération.</p>
                        </div>

                        <!-- Members List -->
                        <div class="mb-6 space-y-2">
                            <h3 class="text-xs uppercase text-gray-500 font-bold tracking-wider mb-3">Équipe (${state.heistMembers.length}/4)</h3>
                            ${state.heistMembers.map(m => `
                                <div class="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded bg-gray-700 flex items-center justify-center font-bold text-xs">${m.characters?.first_name[0]}</div>
                                        <div>
                                            <div class="font-bold text-white text-sm">${m.characters?.first_name} ${m.characters?.last_name}</div>
                                            <div class="text-[10px] ${m.status === 'accepted' ? 'text-emerald-400' : 'text-amber-400'} uppercase">${m.status}</div>
                                        </div>
                                    </div>
                                    ${m.character_id === lobby.host_id ? '<span class="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Hôte</span>' : ''}
                                </div>
                            `).join('')}
                        </div>

                        <!-- Invite Section (Host Only) -->
                        ${amHost ? `
                            <div class="mb-8">
                                <label class="text-xs text-gray-500 uppercase font-bold mb-2 block">Inviter un complice</label>
                                <div class="flex gap-2">
                                    <select id="invite-select" class="glass-input flex-1 p-3 rounded-xl text-sm bg-black">
                                        <option value="">Sélectionner un citoyen...</option>
                                        ${state.availableHeistPartners.map(p => `<option value="${p.id}">${p.first_name} ${p.last_name}</option>`).join('')}
                                    </select>
                                    <button onclick="actions.inviteToLobby(document.getElementById('invite-select').value)" class="glass-btn-secondary px-4 rounded-xl hover:bg-white/10">
                                        <i data-lucide="user-plus" class="w-5 h-5"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <button onclick="actions.startHeistLobby('${heistInfo.time}')" class="glass-btn w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:scale-[1.01] transition-transform">
                                <i data-lucide="play" class="w-5 h-5"></i> COMMENCER LE BRAQUAGE
                            </button>
                        ` : `
                            <div class="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center text-orange-200 text-sm animate-pulse">
                                En attente du chef d'équipe...
                            </div>
                        `}

                         <button onclick="actions.leaveLobby()" class="mt-4 text-xs text-gray-500 hover:text-white underline w-full text-center">Annuler / Quitter</button>
                    </div>
                </div>
            `;
        }

        // 2. ACTIVE PHASE (TIMER SYNC)
        if (lobby.status === 'active') {
            const now = Date.now();
            let remaining = Math.max(0, Math.ceil((lobby.end_time - now) / 1000));
            const totalDuration = (lobby.end_time - lobby.start_time) / 1000;
            const progress = ((totalDuration - remaining) / totalDuration) * 100;

            // Check if finished locally to show button
            if (remaining <= 0) {
                 return `
                    <div class="animate-fade-in flex items-center justify-center h-full">
                        <div class="glass-panel p-8 text-center max-w-md w-full">
                            <div class="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-6 animate-bounce">
                                <i data-lucide="check" class="w-10 h-10"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-white mb-2">Opération Terminée</h2>
                            <p class="text-gray-400 mb-6">L'équipe est de retour au QG.</p>
                            ${amHost ? `
                                <button onclick="actions.finishHeist()" class="glass-btn w-full py-3 rounded-xl font-bold">
                                    Voir le résultat et Partager
                                </button>
                            ` : `<p class="text-sm text-gray-500 italic">En attente du chef pour le partage...</p>`}
                        </div>
                    </div>
                `;
            }

            return `
                <div class="animate-fade-in flex items-center justify-center h-full">
                    <div class="glass-panel p-10 text-center max-w-lg w-full relative overflow-hidden">
                        <div class="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                        <div class="relative z-10">
                            <div class="w-20 h-20 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-6">
                                <i data-lucide="timer" class="w-10 h-10 animate-spin"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-white mb-2">Braquage en cours...</h2>
                            <div class="text-xs text-gray-500 uppercase tracking-widest mb-6">${heistInfo.name}</div>
                            
                            <div class="text-5xl font-mono font-bold text-white mb-8 tracking-wider">
                                ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}
                            </div>

                            <div class="h-2 w-full bg-gray-800 rounded-full overflow-hidden mb-4">
                                <div class="h-full bg-red-500 transition-all duration-1000" style="width: ${progress}%"></div>
                            </div>
                            
                            <div class="flex justify-center gap-2 mt-4">
                                ${state.heistMembers.map(m => `
                                    <div class="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs text-white" title="${m.characters?.first_name}">
                                        ${m.characters?.first_name[0]}
                                    </div>
                                `).join('')}
                            </div>
                            <p class="text-xs text-gray-500 mt-4">Données synchronisées. Ne fermez pas l'onglet.</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // --- CATALOG & MISSION SELECTOR ---
    const tabs = [
        { id: 'light', label: 'Légères', icon: 'target' },
        { id: 'medium', label: 'Moyennes', icon: 'zap' },
        { id: 'heavy', label: 'Lourdes', icon: 'flame' },
        { id: 'sniper', label: 'Snipers', icon: 'crosshair' },
        { id: 'heists', label: 'Braquages', icon: 'timer' },
    ];

    if (state.activeIllicitTab === 'heists') {
        return `
            <div class="animate-fade-in max-w-6xl mx-auto space-y-6">
                <!-- Header -->
                <div class="glass-card p-6 rounded-[30px] bg-gradient-to-r from-orange-900/40 to-black border-orange-500/20 relative overflow-hidden flex items-center justify-between">
                    <div class="absolute -left-10 -top-10 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]"></div>
                    <div class="relative z-10">
                        <h2 class="text-3xl font-bold text-white flex items-center gap-3">
                            <i data-lucide="masks" class="w-8 h-8 text-orange-500"></i>
                            Opérations Criminelles
                        </h2>
                    </div>
                    <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                        ${tabs.map(tab => `
                            <button onclick="actions.setIllicitTab('${tab.id}')" 
                                class="px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all border ${state.activeIllicitTab === tab.id 
                                    ? 'bg-orange-600 text-white border-orange-500' 
                                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}">
                                <i data-lucide="${tab.icon}" class="w-3 h-3"></i>
                                ${tab.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${HEIST_DATA.map(h => `
                        <div class="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group hover:border-orange-500/30 transition-all">
                            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <i data-lucide="${h.icon}" class="w-24 h-24 text-white"></i>
                            </div>

                            <div class="flex items-center gap-4 mb-4 relative z-10">
                                <div class="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                                    <i data-lucide="${h.icon}" class="w-6 h-6"></i>
                                </div>
                                <div>
                                    <h3 class="font-bold text-white text-lg">${h.name}</h3>
                                    <div class="text-xs text-gray-400">Difficulté: <span class="${h.rate < 30 ? 'text-red-400' : 'text-emerald-400'}">${100 - h.rate}/100</span></div>
                                </div>
                            </div>

                            <div class="space-y-3 mb-6 relative z-10">
                                <div class="flex justify-between text-sm border-b border-white/5 pb-2">
                                    <span class="text-gray-500">Gain Estimé</span>
                                    <span class="text-emerald-400 font-mono font-bold">$${(h.min/1000).toFixed(0)}k - ${(h.max/1000).toFixed(0)}k</span>
                                </div>
                                <div class="flex justify-between text-sm border-b border-white/5 pb-2">
                                    <span class="text-gray-500">Durée</span>
                                    <span class="text-white">${Math.floor(h.time / 60)} min ${(h.time % 60) > 0 ? (h.time % 60)+'s' : ''}</span>
                                </div>
                            </div>

                            <button onclick="actions.createLobby('${h.id}')" class="mt-auto glass-btn w-full py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform">
                                <i data-lucide="users" class="w-4 h-4 mr-2"></i>
                                Créer une équipe
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Default Catalog View (Guns)
    const currentItems = BLACK_MARKET_CATALOG[state.activeIllicitTab] || [];
    return `
        <div class="animate-fade-in max-w-6xl mx-auto space-y-6">
            <div class="glass-card p-6 rounded-[30px] bg-gradient-to-r from-red-900/40 to-black border-red-500/20 relative overflow-hidden flex items-center justify-between">
                <div class="absolute -left-10 -top-10 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]"></div>
                <div class="relative z-10">
                    <h2 class="text-3xl font-bold text-white flex items-center gap-3">
                        <i data-lucide="skull" class="w-8 h-8 text-red-500"></i>
                        Marché Noir
                    </h2>
                </div>
                <div class="text-right z-10 hidden md:block">
                    <div class="text-[10px] text-gray-400 uppercase tracking-widest">Argent Liquide</div>
                    <div class="text-3xl font-mono font-bold text-emerald-400">$ ${state.bankAccount.cash_balance.toLocaleString()}</div>
                </div>
            </div>

             <!-- Navigation Tabs -->
            <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                ${tabs.map(tab => `
                    <button onclick="actions.setIllicitTab('${tab.id}')" 
                        class="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border ${state.activeIllicitTab === tab.id 
                            ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20' 
                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}">
                        <i data-lucide="${tab.icon}" class="w-4 h-4"></i>
                        ${tab.label}
                    </button>
                `).join('')}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${currentItems.map(item => {
                    const canAfford = state.bankAccount.cash_balance >= item.price;
                    return `
                        <div class="glass-panel p-5 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group relative overflow-hidden">
                            <div class="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            <div class="relative z-10 mb-6">
                                <div class="flex justify-between items-start mb-4">
                                    <div class="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-red-400 transition-colors">
                                        <i data-lucide="${item.icon}" class="w-6 h-6"></i>
                                    </div>
                                    <div class="font-mono text-xl font-bold ${canAfford ? 'text-emerald-400' : 'text-red-500'}">
                                        $${item.price.toLocaleString()}
                                    </div>
                                </div>
                                <h3 class="text-lg font-bold text-white group-hover:text-red-100 transition-colors">${item.name}</h3>
                            </div>
                            <button onclick="actions.buyIllegalItem('${item.name}', ${item.price})" 
                                ${!canAfford ? 'disabled' : ''}
                                class="relative z-10 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all 
                                ${canAfford ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 cursor-pointer' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}">
                                <i data-lucide="${canAfford ? 'shopping-cart' : 'lock'}" class="w-4 h-4"></i>
                                ${canAfford ? 'Acheter' : 'Manque de fonds'}
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
};
