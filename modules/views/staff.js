import { state } from '../state.js';
import { hasPermission } from '../utils.js';

export const StaffView = () => {
    const hasAnyPerm = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;
    if (!hasAnyPerm) return `<div class="p-8 text-red-500">Accès interdit.</div>`;

    let content = '';

    // TABS NAVIGATION - Added Economy Tab
    const tabsHtml = `
        <div class="flex gap-2 mb-8 border-b border-white/10 pb-1">
            ${hasPermission('can_approve_characters') ? `
                <button onclick="actions.setStaffTab('applications')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${state.activeStaffTab === 'applications' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}">
                    Candidatures
                </button>
            ` : ''}
            ${hasPermission('can_delete_characters') ? `
                <button onclick="actions.setStaffTab('database')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${state.activeStaffTab === 'database' ? 'bg-white/10 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-white'}">
                    Base de Données
                </button>
            ` : ''}
            ${hasPermission('can_manage_economy') ? `
                <button onclick="actions.setStaffTab('economy')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${state.activeStaffTab === 'economy' ? 'bg-white/10 text-white border-b-2 border-emerald-500' : 'text-gray-400 hover:text-white'}">
                    Économie
                </button>
            ` : ''}
            ${hasPermission('can_manage_staff') ? `
                <button onclick="actions.setStaffTab('permissions')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${state.activeStaffTab === 'permissions' ? 'bg-white/10 text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}">
                    Permissions
                </button>
            ` : ''}
        </div>
    `;

    // MODAL ECONOMY HTML
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
                    <button onclick="actions.closeEconomyModal()" class="absolute top-4 right-4 text-gray-500 hover:text-white">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // CONTENT SWITCH
    if (state.activeStaffTab === 'applications' && hasPermission('can_approve_characters')) {
        const pending = state.pendingApplications || [];
        content = `
            <div class="space-y-3">
                ${pending.length === 0 ? `<div class="p-6 text-center text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10 text-sm">Aucune demande en attente.</div>` : ''}
                ${pending.map(p => `
                    <div class="glass-card p-4 rounded-xl flex items-center justify-between border-l-4 border-l-amber-500/50">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-400 border border-white/10 overflow-hidden">
                                ${p.discord_avatar ? `<img src="${p.discord_avatar}" class="w-full h-full object-cover">` : p.first_name[0]}
                            </div>
                            <div>
                                <div class="font-bold text-white">${p.first_name} ${p.last_name}</div>
                                <div class="text-xs text-gray-400 flex items-center gap-2">
                                    <span class="text-blue-300">@${p.discord_username || 'Inconnu'}</span>
                                    <span>${p.age} ans</span>
                                </div>
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
    } else if (state.activeStaffTab === 'database' && hasPermission('can_delete_characters')) {
        const allChars = state.allCharactersAdmin || [];
        content = `
            <div class="glass-panel overflow-hidden rounded-xl">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-white/5 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                        <tr>
                            <th class="p-4 border-b border-white/10">Citoyen</th>
                            <th class="p-4 border-b border-white/10">Propriétaire</th>
                            <th class="p-4 border-b border-white/10">Statut</th>
                            <th class="p-4 border-b border-white/10 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm divide-y divide-white/5">
                        ${allChars.map(c => `
                            <tr class="hover:bg-white/5 transition-colors">
                                <td class="p-4 font-medium text-white">${c.first_name} ${c.last_name}</td>
                                <td class="p-4 text-blue-300">@${c.discord_username}</td>
                                <td class="p-4">
                                    <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold 
                                        ${c.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400' : 
                                          c.status === 'rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}">
                                        ${c.status}
                                    </span>
                                </td>
                                <td class="p-4 text-right flex justify-end gap-2">
                                    <button onclick="actions.adminDeleteCharacter('${c.id}', '${c.first_name} ${c.last_name}')" class="text-gray-500 hover:text-red-400 p-1">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (state.activeStaffTab === 'economy' && hasPermission('can_manage_economy')) {
        const allChars = state.allCharactersAdmin || [];
        // Economy dedicated tab logic
        content = `
            <div class="mb-6 flex justify-between items-center bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                <div>
                    <h3 class="font-bold text-white">Actions Globales</h3>
                    <p class="text-xs text-gray-400">Affecte l'intégralité des comptes bancaires du serveur.</p>
                </div>
                <button onclick="actions.openEconomyModal('ALL')" class="glass-btn-secondary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer">
                    <i data-lucide="globe" class="w-4 h-4"></i> Gérer tout le monde
                </button>
            </div>

            <div class="glass-panel overflow-hidden rounded-xl">
                <div class="p-4 border-b border-white/10 bg-white/5 font-semibold text-gray-300 text-sm">
                    Gestion Individuelle
                </div>
                 <table class="w-full text-left border-collapse">
                    <thead class="text-xs uppercase text-gray-500 tracking-wider">
                         <tr>
                            <th class="p-4 border-b border-white/5">Citoyen</th>
                            <th class="p-4 border-b border-white/5 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm divide-y divide-white/5">
                        ${allChars.filter(c => c.status === 'accepted').map(c => `
                            <tr class="hover:bg-white/5">
                                <td class="p-4">
                                    <div class="font-medium text-white">${c.first_name} ${c.last_name}</div>
                                    <div class="text-xs text-blue-300">@${c.discord_username}</div>
                                </td>
                                <td class="p-4 text-right">
                                    <button onclick="actions.openEconomyModal('${c.id}', '${c.first_name} ${c.last_name}')" class="glass-btn-secondary px-3 py-1 rounded text-xs hover:text-emerald-400 border-white/10">
                                        <i data-lucide="coins" class="w-3 h-3 mr-1"></i> Gérer
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

    } else if (state.activeStaffTab === 'permissions' && hasPermission('can_manage_staff')) {
        content = `
            <div class="glass-panel p-6 rounded-xl mb-6">
                <h3 class="font-bold text-white mb-4">Gérer les permissions Staff</h3>
                <form onsubmit="actions.adminLookupUser(event)" class="flex gap-4 mb-6">
                    <input type="text" name="discord_id" placeholder="ID Discord (ex: 81495...)" class="glass-input flex-1 p-3 rounded-lg" required>
                    <button type="submit" class="glass-btn px-6 rounded-lg">Chercher</button>
                </form>
                
                <div id="perm-editor-container">
                    <!-- Dynamic content filled by JS after lookup -->
                    <p class="text-gray-500 text-sm italic">Entrez un ID pour modifier les droits.</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="animate-fade-in max-w-5xl mx-auto relative">
            <div class="flex items-center gap-3 mb-6">
                <div class="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    <i data-lucide="shield-alert" class="w-6 h-6"></i>
                </div>
                <h2 class="text-2xl font-bold text-white">Administration</h2>
            </div>
            ${tabsHtml}
            ${content}
            ${economyModalHtml}
        </div>
    `;
};