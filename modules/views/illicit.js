
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

export const IllicitView = () => {
    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500"><div class="loader-spinner mb-4 mx-auto"></div>Chargement du réseau...</div>';

    const tabs = [
        { id: 'light', label: 'Légères', icon: 'target' },
        { id: 'medium', label: 'Moyennes', icon: 'zap' },
        { id: 'heavy', label: 'Lourdes', icon: 'flame' },
        { id: 'sniper', label: 'Snipers', icon: 'crosshair' },
    ];

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

                <div class="text-right z-10">
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
