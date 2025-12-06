import { state } from '../state.js';
import { CONFIG } from '../config.js';
import { HEIST_DATA } from './illicit.js';

export const ServicesView = () => {
    
    // TABS
    const tabs = [
        { id: 'directory', label: 'Annuaire Citoyen', icon: 'book-user' },
        { id: 'dispatch', label: 'Dispatch & 911', icon: 'radio' },
        { id: 'map', label: 'Carte & Véhicules', icon: 'map' }
    ];

    let content = '';

    // --- TAB 1: DIRECTORY ---
    if (state.activeServicesTab === 'directory') {
        const citizens = state.allCharactersAdmin || []; // We use the cached list but filter for view
        const publicList = citizens.filter(c => c.status === 'accepted');

        content = `
            <div class="glass-panel p-6 rounded-2xl">
                <div class="mb-4 relative">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                    <input type="text" placeholder="Rechercher un citoyen..." class="glass-input pl-10 p-3 rounded-xl w-full text-sm">
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    ${publicList.map(c => `
                        <div class="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                ${c.first_name[0]}
                            </div>
                            <div>
                                <div class="font-bold text-white text-sm">${c.first_name} ${c.last_name}</div>
                                <div class="text-xs text-gray-500">Citoyen de Los Angeles</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // --- TAB 2: DISPATCH ---
    else if (state.activeServicesTab === 'dispatch') {
        // ACTIVE MAJOR HEISTS (Duration > 30s)
        const heists = state.globalActiveHeists || [];
        const activeAlerts = heists.filter(h => {
            const duration = Date.now() - new Date(h.start_time).getTime();
            return duration > 30000; // 30 seconds delay
        });

        // 911 CALLS
        const calls = state.emergencyCalls || [];

        // MODAL CREATE CALL
        const createCallForm = `
            <div class="glass-panel p-6 rounded-2xl mb-6">
                <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="phone-call" class="w-4 h-4 text-red-400"></i> Créer un Appel d'Urgence</h3>
                <form onsubmit="actions.createEmergencyCall(event)" class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select name="service" class="glass-input p-2 rounded-lg text-sm">
                        <option value="police">Police / Sheriff</option>
                        <option value="ems">Ambulance / Fire</option>
                        <option value="dot">Dépanneuse (DOT)</option>
                    </select>
                    
                    <div class="relative md:col-span-2">
                        <input type="text" list="streets" name="location" placeholder="Localisation (Rue)" class="glass-input w-full p-2 rounded-lg text-sm" required>
                        <datalist id="streets">
                            ${CONFIG.STREET_NAMES.map(s => `<option value="${s}">`).join('')}
                        </datalist>
                    </div>

                    <input type="text" name="description" placeholder="Description rapide..." class="glass-input p-2 rounded-lg text-sm" required>
                    
                    <button type="submit" class="glass-btn md:col-span-4 py-2 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-500">Envoyer Appel</button>
                </form>
            </div>
        `;

        content = `
            ${createCallForm}

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- ACTIVE ALERTS -->
                <div class="glass-panel p-6 rounded-2xl">
                    <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="siren" class="w-5 h-5 text-red-500 animate-pulse"></i> Alertes Prioritaires (Braquages)</h3>
                    <div class="space-y-3">
                        ${activeAlerts.length > 0 ? activeAlerts.map(h => {
                            const hData = HEIST_DATA.find(d => d.id === h.heist_type);
                            return `
                                <div class="bg-red-500/10 border-l-4 border-red-500 p-3 rounded-r-xl">
                                    <div class="font-bold text-red-200 text-sm uppercase mb-1">Braquage en cours</div>
                                    <div class="text-white font-bold">${hData ? hData.name : h.heist_type}</div>
                                    <div class="text-xs text-red-400 mt-1">Signalé il y a quelques instants</div>
                                </div>
                            `;
                        }).join('') : '<div class="text-gray-500 italic text-sm text-center py-4">Aucune alerte majeure.</div>'}
                    </div>
                </div>

                <!-- 911 CALLS LIST -->
                <div class="glass-panel p-6 rounded-2xl">
                    <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="list" class="w-5 h-5 text-blue-400"></i> Historique des Appels</h3>
                    <div class="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                        ${calls.map(c => `
                            <div class="bg-white/5 p-3 rounded-xl border border-white/5">
                                <div class="flex justify-between items-start mb-1">
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.service === 'police' ? 'bg-blue-500/20 text-blue-300' : c.service === 'ems' ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}">${c.service}</span>
                                    <span class="text-[10px] text-gray-500">${new Date(c.created_at).toLocaleTimeString()}</span>
                                </div>
                                <div class="font-bold text-white text-sm mb-0.5">${c.location}</div>
                                <div class="text-xs text-gray-300">"${c.description}"</div>
                                <div class="text-[10px] text-gray-500 mt-1">Appelant: ${c.caller_id}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // --- TAB 3: MAP / VEHICLES ---
    else if (state.activeServicesTab === 'map') {
        const vehicles = state.erlcData.vehicles || [];

        content = `
            <div class="glass-panel p-6 rounded-2xl h-full flex flex-col">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-white flex items-center gap-2"><i data-lucide="car" class="w-5 h-5 text-indigo-400"></i> Véhicules détectés sur zone</h3>
                    <div class="text-xs text-gray-500">Données Live ERLC</div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar flex-1">
                    ${vehicles.length > 0 ? vehicles.map(v => `
                        <div class="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                            <div class="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                                <i data-lucide="car-front" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <div class="text-xs text-gray-400 uppercase tracking-wide">Conducteur</div>
                                <div class="font-bold text-white">${v.owner}</div>
                                <div class="text-xs text-indigo-300 mt-1 flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i> ${v.location}</div>
                            </div>
                        </div>
                    `).join('') : '<div class="col-span-3 text-center text-gray-500 py-10">Aucun véhicule tracké pour le moment.</div>'}
                </div>
            </div>
        `;
    }

    return `
        <div class="animate-fade-in max-w-6xl mx-auto h-full flex flex-col">
            <!-- HEADER NAV -->
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl font-bold text-white">Services Publics</h2>
                    <p class="text-gray-400 text-sm">Centre de dispatch et informations citoyennes.</p>
                </div>
                <div class="flex gap-2 bg-white/5 p-1 rounded-xl">
                    ${tabs.map(t => `
                        <button onclick="actions.setServicesTab('${t.id}')" 
                            class="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${state.activeServicesTab === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}">
                            <i data-lucide="${t.icon}" class="w-4 h-4"></i> ${t.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex-1 overflow-hidden">
                ${content}
            </div>
        </div>
    `;
};