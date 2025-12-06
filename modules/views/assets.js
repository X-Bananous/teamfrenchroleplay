

import { state } from '../state.js';

// Helper to generate a single row HTML - ensures consistency between Main View and Search Results
export const generateInventoryRow = (item) => `
    <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
        <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl ${item.is_cash ? 'bg-emerald-500/20 text-emerald-400' : item.is_virtual ? 'bg-blue-500/20 text-blue-400' : 'bg-indigo-500/20 text-indigo-400'} flex items-center justify-center border border-white/5">
                <i data-lucide="${item.is_cash ? 'banknote' : item.is_virtual ? 'id-card' : 'package'}" class="w-6 h-6"></i>
            </div>
            <div>
                <div class="font-bold text-white text-base">${item.name}</div>
                <div class="text-xs text-gray-500 font-mono">
                    Qté: <span class="text-gray-300">${item.quantity.toLocaleString()}</span> ${!item.is_virtual ? `&times; $${item.estimated_value.toLocaleString()}` : ''}
                </div>
            </div>
        </div>
        <div class="text-right flex items-center gap-4">
            ${!item.is_virtual ? `
                <div>
                    <div class="font-bold text-white">$ ${(item.quantity * item.estimated_value).toLocaleString()}</div>
                    <div class="text-[10px] text-gray-500 uppercase tracking-wider">Valeur</div>
                </div>
                ${!item.is_cash ? `
                    <button onclick="actions.deleteInventoryItem('${item.id}', '${item.name}')" class="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors" title="Jeter">
                        <i data-lucide="trash" class="w-4 h-4"></i>
                    </button>
                ` : ''}
            ` : `
                <button onclick="actions.openIdCard()" class="glass-btn-secondary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-500/20 hover:text-blue-300 transition-colors">
                    Consulter
                </button>
            `}
        </div>
    </div>
`;

export const AssetsView = () => {
    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500"><div class="loader-spinner mb-4 mx-auto"></div>Synchronisation du patrimoine...</div>';

    // --- ID CARD MODAL ---
    let idCardHtml = '';
    if (state.idCardModalOpen) {
        const char = state.activeCharacter;
        const birthDate = new Date(char.birth_date).toLocaleDateString('fr-FR');
        const createdAt = new Date(char.created_at).toLocaleDateString('fr-FR');
        
        idCardHtml = `
            <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="actions.closeIdCard()"></div>
                
                <div class="id-card-bg w-full max-w-[400px] h-[250px] rounded-2xl relative z-10 overflow-hidden text-gray-800 p-6 flex flex-col justify-between shadow-2xl transform scale-110">
                    <!-- Background Pattern -->
                    <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    
                    <div class="flex justify-between items-start border-b-2 border-blue-800 pb-2 relative z-10">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold text-xs">LA</div>
                            <div>
                                <h3 class="font-bold text-lg leading-none text-blue-900">STATE OF CALIFORNIA</h3>
                                <div class="text-[8px] font-bold tracking-widest uppercase text-blue-700">Driver License</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] font-bold text-red-600">ID: ${char.id.split('-')[0].toUpperCase()}</div>
                            <div class="text-[8px] text-gray-500">EXP: 12/2030</div>
                        </div>
                    </div>

                    <div class="flex gap-4 mt-2 relative z-10">
                        <div class="w-24 h-32 bg-gray-300 border border-gray-400 rounded-md overflow-hidden shrink-0">
                            ${state.user.avatar ? `<img src="${state.user.avatar}" class="w-full h-full object-cover grayscale contrast-125">` : '<div class="w-full h-full flex items-center justify-center bg-gray-200"><i data-lucide="user" class="w-8 h-8 text-gray-400"></i></div>'}
                        </div>
                        <div class="flex-1 space-y-1">
                            <div>
                                <div class="text-[8px] text-gray-500 uppercase">Last Name</div>
                                <div class="font-bold text-lg uppercase leading-none">${char.last_name}</div>
                            </div>
                            <div>
                                <div class="text-[8px] text-gray-500 uppercase">First Name</div>
                                <div class="font-bold text-sm uppercase leading-none">${char.first_name}</div>
                            </div>
                             <div class="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                    <div class="text-[8px] text-gray-500 uppercase">DOB</div>
                                    <div class="font-bold text-xs leading-none text-red-700">${birthDate}</div>
                                </div>
                                <div>
                                    <div class="text-[8px] text-gray-500 uppercase">Sex</div>
                                    <div class="font-bold text-xs leading-none">M</div>
                                </div>
                            </div>
                            <div class="mt-2">
                                <div class="text-[8px] text-gray-500 uppercase">Issued</div>
                                <div class="font-bold text-xs leading-none">${createdAt}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button onclick="actions.closeIdCard()" class="absolute top-10 right-10 text-white hover:text-gray-300 z-50">
                    <i data-lucide="x-circle" class="w-10 h-10"></i>
                </button>
            </div>
        `;
    }

    // --- MAIN ASSETS LIST ---
    let combinedInventory = [];
    if (state.bankAccount.cash_balance > 0) {
        combinedInventory.push({
            id: 'cash',
            name: 'Espèces (Liquide)',
            quantity: state.bankAccount.cash_balance,
            estimated_value: 1,
            is_cash: true
        });
    }
    combinedInventory = [...combinedInventory, ...state.inventory];

    if (state.inventoryFilter) {
        const lower = state.inventoryFilter.toLowerCase();
        combinedInventory = combinedInventory.filter(i => i.name.toLowerCase().includes(lower));
    }

    const inventoryHtml = combinedInventory.length > 0 
        ? combinedInventory.map(generateInventoryRow).join('')
        : `<div class="text-center text-gray-500 py-10 italic">Aucun objet trouvé.</div>`;

    return `
        ${idCardHtml}
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
                            oninput="actions.handleInventorySearch(this.value)" 
                            value="${state.inventoryFilter}"
                            placeholder="Rechercher un objet..." 
                            class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm">
                    </div>
                </div>

                <div class="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1" id="inventory-list-container">
                    ${inventoryHtml}
                </div>
            </div>
        </div>
    `;
};