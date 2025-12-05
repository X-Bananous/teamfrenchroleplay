

import { state } from '../state.js';

// Configuration du catalogue
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
    { id: 'gas', name: 'Station Service', min: 500, max: 1000, time: 105, rate: 65, icon: 'fuel' }, // 1.45 min = 105 sec
    { id: 'atm', name: 'Braquage ATM', min: 1000, max: 5000, time: 90, rate: 50, icon: 'credit-card' }, // 1.30 min = 90 sec
    { id: 'truck', name: 'Fourgon Blindé', min: 250000, max: 500000, time: 900, rate: 15, icon: 'truck' }, // 15 min = 900 sec
    { id: 'jewelry', name: 'Bijouterie', min: 500000, max: 700000, time: 1020, rate: 10, icon: 'gem' }, // 17 min = 1020 sec
    { id: 'bank', name: 'Banque Centrale', min: 700000, max: 1000000, time: 1200, rate: 5, icon: 'landmark' } // 20 min = 1200 sec
];

export const IllicitView = () => {
    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500"><div class="loader-spinner mb-4 mx-auto"></div>Chargement du réseau...</div>';

    const tabs = [
        { id: 'light', label: 'Légères', icon: 'target' },
        { id: 'medium', label: 'Moyennes', icon: 'zap' },
        { id: 'heavy', label: 'Lourdes', icon: 'flame' },
        { id: 'sniper', label: 'Snipers', icon: 'crosshair' },
        { id: 'heists', label: 'Braquages', icon: 'timer' },
    ];

    // --- HEIST ACTIVE OVERLAY ---
    if (state.activeHeist) {
        const h = state.activeHeist;
        const now = Math.floor(Date.now() / 1000);
        const remaining = h.endTime - now;
        const progress = Math.max(0, Math.min(100, 100 - (remaining / h.totalTime * 100)));

        if (remaining <= 0) {
            // Heist Finished Logic is handled in app.js loop/timer, but render provides a "Collect" state visually
             return `
                <div class="animate-fade-in flex items-center justify-center h-full">
                    <div class="glass-panel p-8 text-center max-w-md w-full">
                        <div class="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-6 animate-bounce">
                            <i data-lucide="check" class="w-10 h-10"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-white mb-2">Opération Terminée</h2>
                        <p class="text-gray-400 mb-6">L'équipe est de retour au QG.</p>
                        <button onclick="actions.finishHeist()" class="glass-btn w-full py-3 rounded-xl font-bold">
                            Voir le résultat
                        </button>
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
                        <div class="text-xs text-gray-500 uppercase tracking-widest mb-6">${h.name}</div>
                        
                        <div class="text-4xl font-mono font-bold text-white mb-8">
                            ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}
                        </div>

                        <div class="h-2 w-full bg-gray-800 rounded-full overflow-hidden mb-4">
                            <div class="h-full bg-red-500 transition-all duration-1000" style="width: ${progress}%"></div>
                        </div>
                        <p class="text-xs text-gray-500">Ne fermez pas cette page. Restez discret.</p>
                    </div>
                </div>
            </div>
        `;
    }

    // --- NORMAL CATALOG VIEW ---
    if (state.activeIllicitTab === 'heists') {
        return `
            <div class="animate-fade-in max-w-6xl mx-auto space-y-6">
                 <!-- Header Heist -->
                <div class="glass-card p-6 rounded-[30px] bg-gradient-to-r from-orange-900/40 to-black border-orange-500/20 relative overflow-hidden flex items-center justify-between">
                    <div class="absolute -left-10 -top-10 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px]"></div>
                    <div class="relative z-10">
                        <h2 class="text-3xl font-bold text-white flex items-center gap-3">
                            <i data-lucide="masks" class="w-8 h-8 text-orange-500"></i>
                            Opérations Criminelles
                        </h2>
                        <p class="text-orange-400/60 text-sm mt-1 font-mono tracking-wider">PLANIFICATION DE BRAQUAGES</p>
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
                        <div class="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group">
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
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-500">Chances Réussite</span>
                                    <span class="text-white font-bold">${h.rate}%</span>
                                </div>
                            </div>

                            <form onsubmit="actions.startHeist('${h.id}', event)" class="mt-auto relative z-10">
                                <div class="flex items-center justify-between mb-3 bg-black/30 p-2 rounded-lg">
                                    <span class="text-xs text-gray-400">Taille Groupe</span>
                                    <input type="number" name="group_size" min="1" max="4" value="1" class="w-12 bg-transparent text-right text-white font-bold focus:outline-none">
                                </div>
                                <button type="submit" class="glass-btn w-full py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform">
                                    Lancer l'opération
                                </button>
                            </form>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const currentItems = BLACK_MARKET_CATALOG[state.activeIllicitTab] || [];

    return `
        <div class="animate-fade-in max-w-6xl mx-auto space-y-6">
            
            <!-- Header Dark -->
            <div class="glass-card p-6 rounded-[30px] bg-gradient-to-r from-red-900/40 to-black border-red-500/20 relative overflow-hidden flex items-center justify-between">
                <div class="absolute -left-10 -top-10 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]"></div>
                
                <div class="relative z-10">
                    <h2 class="text-3xl font-bold text-white flex items-center gap-3">
                        <i data-lucide="skull" class="w-8 h-8 text-red-500"></i>
                        Marché Noir
                    </h2>
                    <p class="text-red-400/60 text-sm mt-1 font-mono tracking-wider">CONNEXION SÉCURISÉE • TOR NETWORK</p>
                </div>

                <div class="text-right z-10 hidden md:block">
                    <div class="text-[10px] text-gray-400 uppercase tracking-widest">Argent Liquide Disponible</div>
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

            <!-- Items Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${currentItems.map(item => {
                    const canAfford = state.bankAccount.cash_balance >= item.price;
                    return `
                        <div class="glass-panel p-5 rounded-2xl border border-white/5 hover:border-red-500/30 transition-all group relative overflow-hidden">
                            <div class="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                            
                            <div class="relative z-10 flex justify-between items-start mb-4">
                                <div class="w-12 h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-red-400 transition-colors">
                                    <i data-lucide="${item.icon}" class="w-6 h-6"></i>
                                </div>
                                <div class="px-3 py-1 bg-black/40 rounded-full border border-white/5 text-xs font-mono text-gray-400">
                                    Arme
                                </div>
                            </div>

                            <div class="relative z-10 mb-6">
                                <h3 class="text-lg font-bold text-white group-hover:text-red-100 transition-colors">${item.name}</h3>
                                <div class="font-mono text-xl font-bold ${canAfford ? 'text-emerald-400' : 'text-red-500'}">
                                    $${item.price.toLocaleString()}
                                </div>
                            </div>

                            <button onclick="actions.buyIllegalItem('${item.name}', ${item.price})" 
                                ${!canAfford ? 'disabled' : ''}
                                class="relative z-10 w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all 
                                ${canAfford 
                                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 cursor-pointer' 
                                    : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'}">
                                <i data-lucide="${canAfford ? 'shopping-cart' : 'lock'}" class="w-4 h-4"></i>
                                ${canAfford ? 'Acheter en Espèces' : 'Fonds Insuffisants'}
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="text-center text-xs text-gray-600 mt-8 max-w-lg mx-auto">
                Attention : L'achat d'armes illégales est passible de poursuites RP. Les objets sont ajoutés directement à votre inventaire.
            </div>
        </div>
    `;
};