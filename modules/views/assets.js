
import { state } from '../state.js';

export const AssetsView = () => {
    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500"><div class="loader-spinner mb-4 mx-auto"></div>Synchronisation du patrimoine...</div>';

    // Construire la liste combinée (Espèces + Objets)
    let combinedInventory = [];
    
    // 1. Ajouter l'espèce comme un objet
    if (state.bankAccount.cash_balance > 0) {
        combinedInventory.push({
            id: 'cash',
            name: 'Espèces (Liquide)',
            quantity: state.bankAccount.cash_balance,
            estimated_value: 1, // 1$ = 1$ value
            is_cash: true
        });
    }

    // 2. Ajouter les objets DB
    combinedInventory = [...combinedInventory, ...state.inventory];

    // 3. Filtrer
    if (state.inventoryFilter) {
        const lower = state.inventoryFilter.toLowerCase();
        combinedInventory = combinedInventory.filter(i => i.name.toLowerCase().includes(lower));
    }

    const inventoryHtml = combinedInventory.length > 0 
        ? combinedInventory.map(item => `
            <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl ${item.is_cash ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'} flex items-center justify-center border border-white/5">
                        <i data-lucide="${item.is_cash ? 'banknote' : 'package'}" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="font-bold text-white text-base">${item.name}</div>
                        <div class="text-xs text-gray-500 font-mono">
                            Qté: <span class="text-gray-300">${item.quantity.toLocaleString()}</span> &times; $${item.estimated_value.toLocaleString()}
                        </div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-white">$ ${(item.quantity * item.estimated_value).toLocaleString()}</div>
                    <div class="text-[10px] text-gray-500 uppercase tracking-wider">Valeur Totale</div>
                </div>
            </div>
        `).join('')
        : `<div class="text-center text-gray-500 py-10 italic">Aucun objet trouvé.</div>`;

    return `
        <div class="animate-fade-in space-y-6 max-w-4xl mx-auto">
            
            <!-- Global Wealth Card -->
            <div class="glass-card p-8 rounded-[30px] bg-gradient-to-r from-gray-900 to-black border-indigo-500/20 relative overflow-hidden text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-16 -mt-16"></div>
                
                <div>
                    <div class="flex items-center gap-2 justify-center md:justify-start mb-2">
                        <i data-lucide="gem" class="w-5 h-5 text-indigo-400"></i>
                        <span class="text-xs font-bold text-indigo-400 uppercase tracking-widest">Patrimoine Total Estimé</span>
                    </div>
                    <div class="text-5xl font-bold text-white tracking-tighter mb-1">$ ${state.patrimonyTotal.toLocaleString()}</div>
                    <p class="text-gray-500 text-xs">Cumul: Banque + Espèces + Valeur Objets</p>
                </div>

                <div class="flex gap-4">
                     <div class="bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
                        <div class="text-[10px] text-gray-400 uppercase">Banque</div>
                        <div class="font-mono font-bold text-emerald-400">$ ${state.bankAccount.bank_balance.toLocaleString()}</div>
                     </div>
                     <div class="bg-white/5 px-5 py-3 rounded-2xl border border-white/5">
                        <div class="text-[10px] text-gray-400 uppercase">Actifs Physiques</div>
                        <div class="font-mono font-bold text-indigo-400">$ ${(state.patrimonyTotal - state.bankAccount.bank_balance).toLocaleString()}</div>
                     </div>
                </div>
            </div>

            <!-- Inventory Section -->
            <div class="glass-panel rounded-2xl p-6">
                <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i data-lucide="backpack" class="w-5 h-5 text-gray-400"></i>
                        Inventaire & Actifs
                    </h3>
                    
                    <div class="relative w-full md:w-64">
                        <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                        <input type="text" 
                            oninput="actions.filterAssets(this.value)" 
                            value="${state.inventoryFilter}"
                            placeholder="Rechercher un objet..." 
                            class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm">
                    </div>
                </div>

                <div class="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                    ${inventoryHtml}
                </div>
            </div>
        </div>
    `;
};
