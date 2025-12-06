

import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { hasPermission } from '../utils.js';

export const StaffView = () => {
    // Basic check: Must have at least ONE permission or be founder
    const hasAnyPerm = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;
    if (!hasAnyPerm) return `<div class="p-8 text-red-500">Accès interdit.</div>`;

    let content = '';

    // TABS NAVIGATION
    const tabsHtml = `
        <div class="flex gap-2 mb-8 border-b border-white/10 pb-1 overflow-x-auto custom-scrollbar">
            ${hasPermission('can_approve_characters') ? `
                <button onclick="actions.setStaffTab('applications')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${state.activeStaffTab === 'applications' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}">
                    Candidatures
                </button>
            ` : ''}
            
            <button onclick="actions.setStaffTab('database')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${state.activeStaffTab === 'database' ? 'bg-white/10 text-white border-b-2 border-orange-500' : 'text-gray-400 hover:text-white'}">
                Base de Données
            </button>
            
            ${hasPermission('can_manage_economy') ? `
                <button onclick="actions.setStaffTab('economy')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${state.activeStaffTab === 'economy' ? 'bg-white/10 text-white border-b-2 border-emerald-500' : 'text-gray-400 hover:text-white'}">
                    Économie
                </button>
            ` : ''}
            ${hasPermission('can_manage_staff') ? `
                <button onclick="actions.setStaffTab('permissions')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${state.activeStaffTab === 'permissions' ? 'bg-white/10 text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}">
                    Permissions
                </button>
            ` : ''}
        </div>
    `;

    // --- MODALS (Include Economy & Inventory Modals - Kept same as previous version but abbreviated here for xml brevity, assumed preserved by context) ---
    // RE-INJECTING MODALS CODE
    let economyModalHtml = '';
    if (state.economyModal.isOpen && hasPermission('can_manage_economy')) {
        economyModalHtml = `
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="actions.closeEconomyModal()"></div>
                <div class="glass-panel w-full max-w-md p-6 rounded-2xl relative z-10 animate-slide-up shadow-2xl shadow-emerald-500/10">
                    <h3 class="text-xl font-bold text-white mb-1">Gestion Économique</h3>
                    <p class="text-xs text-emerald-400 uppercase tracking-widest mb-6">
                        ${state.economyModal.targetId === 'ALL' ? 'Action Globale (Tous les joueurs)' : state.economyModal.targetName}
                    </p>
                    <form onsubmit="actions.executeEconomyAction(event)" class="space-y-4">
                        <div class="flex bg-white/5 p-1 rounded-lg">
                            <label class="flex-1 text-center cursor-pointer">
                                <input type="radio" name="mode" value="fixed" checked class="peer sr-only">
                                <span class="block py-2 text-sm font-medium rounded-md text-gray-400 peer-checked:bg-emerald-600 peer-checked:text-white transition-all">Montant Fixe</span>
                            </label>
                            <label class="flex-1 text-center cursor-pointer">
                                <input type="radio" name="mode" value="percent" class="peer sr-only">
                                <span class="block py-2 text-sm font-medium rounded-md text-gray-400 peer-checked:bg-blue-600 peer-checked:text-white transition-all">Pourcentage %</span>
                            </label>
                        </div>
                        <input type="number" name="amount" placeholder="Valeur" min="1" class="glass-input w-full p-3 rounded-xl" required>
                        <div class="grid grid-cols-2 gap-4 pt-2">
                            <button type="submit" name="action" value="add" class="glass-btn bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                <i data-lucide="plus" class="w-4 h-4"></i> Ajouter
                            </button>
                            <button type="submit" name="action" value="remove" class="glass-btn bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                <i data-lucide="minus" class="w-4 h-4"></i> Retirer
                            </button>
                        </div>
                    </form>
                    <button onclick="actions.closeEconomyModal()" class="absolute top-4 right-4 text-gray-500 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
            </div>
        `;
    }

    let inventoryModalHtml = '';
    if (state.inventoryModal.isOpen && hasPermission('can_manage_inventory')) {
        inventoryModalHtml = `
             <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="actions.closeInventoryModal()"></div>
                <div class="glass-panel w-full max-w-2xl p-6 rounded-2xl relative z-10 animate-slide-up flex flex-col max-h-[85vh]">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <h3 class="text-xl font-bold text-white">Inventaire Admin</h3>
                            <p class="text-xs text-orange-400 uppercase tracking-widest">${state.inventoryModal.targetName}</p>
                        </div>
                        <button onclick="actions.closeInventoryModal()" class="text-gray-500 hover:text-white"><i data-lucide="x" class="w-6 h-6"></i></button>
                    </div>
                    <div class="flex-1 overflow-y-auto custom-scrollbar mb-6 bg-white/5 rounded-xl border border-white/5">
                        ${state.inventoryModal.items.length > 0 ? `
                            <table class="w-full text-left text-sm">
                                <thead class="bg-white/5 text-xs uppercase text-gray-500 sticky top-0"><tr><th class="p-3">Objet</th><th class="p-3">Qté</th><th class="p-3 text-right">Action</th></tr></thead>
                                <tbody class="divide-y divide-white/5">
                                    ${state.inventoryModal.items.map(item => `
                                        <tr>
                                            <td class="p-3 font-medium text-white">${item.name}</td>
                                            <td class="p-3 text-gray-400">${item.quantity}</td>
                                            <td class="p-3 text-right">
                                                <button onclick="actions.manageInventoryItem('remove', '${item.id}', '${item.name}')" class="text-red-400 hover:text-red-300 p-1 bg-red-500/10 rounded"><i data-lucide="trash" class="w-4 h-4"></i></button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : `<div class="p-8 text-center text-gray-500 italic">Inventaire vide.</div>`}
                    </div>
                    <form onsubmit="actions.manageInventoryItem('add', null, null, event)" class="pt-4 border-t border-white/10">
                        <h4 class="text-sm font-bold text-white mb-3">Ajouter un objet</h4>
                        <div class="flex gap-2">
                            <input type="text" name="item_name" placeholder="Nom de l'objet (ex: Montre)" class="glass-input flex-1 p-2 rounded-lg" required>
                            <input type="number" name="quantity" value="1" min="1" class="glass-input w-20 p-2 rounded-lg" required>
                            <input type="number" name="value" placeholder="Valeur $" class="glass-input w-24 p-2 rounded-lg" required>
                            <button type="submit" class="glass-btn px-4 rounded-lg bg-blue-600 hover:bg-blue-500"><i data-lucide="plus" class="w-4 h-4"></i></button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // --- CONTENT VIEWS ---
    if (state.activeStaffTab === 'applications' && hasPermission('can_approve_characters')) {
        let pending = state.pendingApplications || [];
        if (state.staffSearchQuery) {
            const q = state.staffSearchQuery.toLowerCase();
            pending = pending.filter(p => p.first_name.toLowerCase().includes(q) || p.last_name.toLowerCase().includes(q) || p.discord_username.toLowerCase().includes(q));
        }
        content = `
            <div class="mb-4">
                <div class="relative">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                    <input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" placeholder="Rechercher une candidature..." class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm">
                </div>
            </div>
            <div class="space-y-3">
                ${pending.length === 0 ? `<div class="p-6 text-center text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10 text-sm">Aucune demande trouvée.</div>` : ''}
                ${pending.map(p => `
                    <div class="glass-card p-4 rounded-xl flex items-center justify-between border-l-4 border-l-amber-500/50">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-400 border border-white/10 overflow-hidden">
                                ${p.discord_avatar ? `<img src="${p.discord_avatar}" class="w-full h-full object-cover">` : p.first_name[0]}
                            </div>
                            <div>
                                <div class="font-bold text-white">${p.first_name} ${p.last_name}</div>
                                <div class="text-xs text-gray-400 flex items-center gap-2"><span class="text-blue-300">@${p.discord_username || 'Inconnu'}</span><span>${p.age} ans</span><span class="text-gray-500 border border-gray-700 px-1 rounded uppercase text-[9px]">${p.alignment || '?'}</span></div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="actions.decideApplication('${p.id}', 'accepted')" class="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 p-2 rounded-lg transition-colors cursor-pointer"><i data-lucide="check" class="w-4 h-4"></i></button>
                            <button onclick="actions.decideApplication('${p.id}', 'rejected')" class="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-2 rounded-lg transition-colors cursor-pointer"><i data-lucide="x" class="w-4 h-4"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

    } else if (state.activeStaffTab === 'database') {
        const canDelete = hasPermission('can_manage_characters');
        const canInventory = hasPermission('can_manage_inventory');
        const canChangeTeam = hasPermission('can_change_team');
        let allChars = state.allCharactersAdmin || [];
        if (state.staffSearchQuery) {
            const q = state.staffSearchQuery.toLowerCase();
            allChars = allChars.filter(c => c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q) || c.discord_username.toLowerCase().includes(q));
        }
        
        content = `
            <div class="mb-4">
                <div class="relative">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i>
                    <input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" placeholder="Rechercher un citoyen..." class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm">
                </div>
            </div>
            <div class="glass-panel overflow-hidden rounded-xl">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-white/5 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                        <tr>
                            <th class="p-4 border-b border-white/10">Citoyen</th>
                            <th class="p-4 border-b border-white/10">Team</th>
                            <th class="p-4 border-b border-white/10">Statut</th>
                            <th class="p-4 border-b border-white/10 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm divide-y divide-white/5">
                        ${allChars.map(c => `
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="p-4 font-medium text-white">
                                    ${c.first_name} ${c.last_name}
                                    <div class="text-xs text-blue-300 font-normal">@${c.discord_username}</div>
                                </td>
                                <td class="p-4 text-xs text-gray-400 uppercase">${c.alignment || 'N/A'}</td>
                                <td class="p-4"><span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold ${c.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : c.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}">${c.status}</span></td>
                                <td class="p-4 text-right flex justify-end gap-2">
                                    ${canChangeTeam ? `
                                        <button onclick="actions.adminSwitchTeam('${c.id}', '${c.alignment}')" class="text-purple-400 hover:text-purple-300 p-1 bg-purple-500/10 rounded mr-1" title="Changer Équipe"><i data-lucide="refresh-cw" class="w-4 h-4"></i></button>
                                    `: ''}
                                    ${canInventory && c.status === 'accepted' ? `
                                        <button onclick="actions.openInventoryModal('${c.id}', '${c.first_name} ${c.last_name}')" class="text-orange-400 hover:text-orange-300 p-1 bg-orange-500/10 rounded mr-1" title="Gérer Inventaire"><i data-lucide="backpack" class="w-4 h-4"></i></button>
                                    ` : ''}
                                    ${canDelete ? `
                                        <button onclick="actions.adminDeleteCharacter('${c.id}', '${c.first_name} ${c.last_name}')" class="text-gray-500 hover:text-red-400 p-1" title="Supprimer définitivement"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                                    ` : `<span class="text-gray-700 text-xs">Lecture Seule</span>`}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (state.activeStaffTab === 'economy' && hasPermission('can_manage_economy')) {
         let allChars = state.allCharactersAdmin || [];
        if (state.staffSearchQuery) {
            const q = state.staffSearchQuery.toLowerCase();
            allChars = allChars.filter(c => c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q) || c.discord_username.toLowerCase().includes(q));
        }
        content = `
            <div class="mb-6 flex justify-between items-center bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                <div><h3 class="font-bold text-white">Actions Globales</h3><p class="text-xs text-gray-400">Affecte l'intégralité des comptes bancaires du serveur.</p></div>
                <button onclick="actions.openEconomyModal('ALL')" class="glass-btn-secondary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"><i data-lucide="globe" class="w-4 h-4"></i> Gérer tout le monde</button>
            </div>
            <div class="mb-4">
                <div class="relative"><i data-lucide="search" class="w-4 h-4 absolute left-3 top-3 text-gray-500"></i><input type="text" oninput="actions.staffSearch(this.value)" value="${state.staffSearchQuery}" placeholder="Rechercher un joueur..." class="glass-input pl-10 pr-4 py-2.5 rounded-xl w-full text-sm"></div>
            </div>
            <div class="glass-panel overflow-hidden rounded-xl">
                 <table class="w-full text-left border-collapse">
                    <thead class="text-xs uppercase text-gray-500 tracking-wider"><tr><th class="p-4 border-b border-white/5">Citoyen</th><th class="p-4 border-b border-white/5 text-right">Action</th></tr></thead>
                    <tbody class="text-sm divide-y divide-white/5">
                        ${allChars.filter(c => c.status === 'accepted').map(c => `
                            <tr class="hover:bg-white/5">
                                <td class="p-4"><div class="font-medium text-white">${c.first_name} ${c.last_name}</div><div class="text-xs text-blue-300">@${c.discord_username}</div></td>
                                <td class="p-4 text-right"><button onclick="actions.openEconomyModal('${c.id}', '${c.first_name} ${c.last_name}')" class="glass-btn-secondary px-3 py-1 rounded text-xs hover:text-emerald-400 border-white/10"><i data-lucide="coins" class="w-3 h-3 mr-1"></i> Gérer</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (state.activeStaffTab === 'permissions' && hasPermission('can_manage_staff')) {
        content = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <div class="glass-panel p-6 rounded-xl relative min-h-[300px]">
                        <h3 class="font-bold text-white mb-4">Gérer les permissions</h3>
                        <p class="text-xs text-gray-400 mb-4">Recherchez un utilisateur Discord pour lui attribuer des droits.</p>
                        <div class="relative mb-4">
                            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                            <input type="text" placeholder="Pseudo Discord ou ID..." oninput="actions.searchProfilesForPerms(this.value)" class="glass-input p-3 pl-10 rounded-lg w-full text-sm placeholder-gray-500" autocomplete="off">
                            <div id="perm-search-dropdown" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar hidden"></div>
                        </div>
                        <div id="perm-editor-container"><div class="text-center text-gray-600 py-10 text-sm">Sélectionnez un utilisateur pour modifier ses droits.</div></div>
                    </div>
                </div>
                <div class="glass-panel p-6 rounded-xl h-fit">
                    <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="shield" class="w-4 h-4 text-purple-400"></i> Équipe Staff Actuelle</h3>
                    <div class="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                        ${state.staffMembers.map(m => `
                            <button onclick="actions.selectUserForPerms('${m.id}')" class="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 flex items-center gap-3 transition-colors border border-white/5 group">
                                <img src="${m.avatar_url || ''}" class="w-10 h-10 rounded-full border border-white/10 group-hover:border-purple-500/50 transition-colors">
                                <div class="flex-1 min-w-0">
                                    <div class="font-bold text-white text-sm truncate">${m.username}</div>
                                    <div class="flex flex-wrap gap-1 mt-1">
                                        ${m.permissions.can_approve_characters ? '<span class="text-[9px] px-1 bg-blue-500/20 text-blue-300 rounded">Candid</span>' : ''}
                                        ${m.permissions.can_manage_economy ? '<span class="text-[9px] px-1 bg-emerald-500/20 text-emerald-300 rounded">Eco</span>' : ''}
                                        ${m.permissions.can_manage_staff ? '<span class="text-[9px] px-1 bg-purple-500/20 text-purple-300 rounded">Admin</span>' : ''}
                                        ${m.permissions.can_manage_characters ? '<span class="text-[9px] px-1 bg-orange-500/20 text-orange-300 rounded">DB</span>' : ''}
                                        ${m.permissions.can_manage_inventory ? '<span class="text-[9px] px-1 bg-teal-500/20 text-teal-300 rounded">Inv</span>' : ''}
                                    </div>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="animate-fade-in max-w-6xl mx-auto relative">
            <div class="flex items-center gap-3 mb-6">
                <div class="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    <i data-lucide="shield-alert" class="w-6 h-6"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">Administration</h2>
            </div>
            ${tabsHtml}
            ${content}
            ${economyModalHtml}
            ${inventoryModalHtml}
        </div>
    `;
};