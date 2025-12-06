

import { state } from '../state.js';
import { createHeistLobby, startHeistSync } from '../services.js';
import { showToast, showModal } from '../ui.js';

// CATALOGUES CONSTANTS
export const BLACK_MARKET_CATALOG = {
    light: [
        { name: "Beretta M9", price: 2800, icon: "target" },
        { name: "Revolver", price: 3000, icon: "circle-dot" },
        { name: "Colt M1911", price: 3500, icon: "target" },
        { name: "Colt Python", price: 4200, icon: "circle-dot" },
        { name: "Desert Eagle", price: 4500, icon: "triangle" },
        { name: "Lampe Torche", price: 20, icon: "flashlight" },
        { name: "Marteau", price: 20, icon: "hammer" },
        { name: "Lockpick", price: 50, icon: "key" },
        { name: "Sac", price: 100, icon: "shopping-bag" },
        { name: "Coupe Verre", price: 350, icon: "scissors" },
        { name: "Puce ATM", price: 2300, icon: "cpu" }
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

export const DRUG_DATA = {
    coke: {
        name: 'Cocaïne',
        harvest: { 100: 5, 500: 7, 1000: 35 }, // Minutes
        process: { 100: 5, 500: 10, 1000: 30 },
        sell: { 100: 7, 500: 13, 1000: 25 },
        pricePerG: 60
    },
    weed: {
        name: 'Cannabis',
        harvest: { 100: 3, 500: 5, 1000: 25 },
        process: { 100: 5, 500: 7, 1000: 25 },
        sell: { 100: 5, 500: 10, 1000: 25 },
        pricePerG: 20
    }
};

export const IllicitView = () => {
    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500"><div class="loader-spinner mb-4 mx-auto"></div>Chargement du réseau crypté...</div>';

    // 1. MENU PRINCIPAL ILLÉGAL
    if (state.activeIllicitTab === 'menu') {
        return `
            <div class="animate-fade-in max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
                <div class="text-center mb-10">
                    <div class="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                        <i data-lucide="ghost" class="w-10 h-10 text-red-500"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-white tracking-tight">Réseau Souterrain</h2>
                    <p class="text-gray-400 mt-2">Choisissez votre activité criminelle.</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <!-- Marché Noir -->
                    <button onclick="actions.setIllicitTab('market')" class="glass-card group p-8 rounded-[30px] text-left relative overflow-hidden hover:border-red-500/50 transition-all">
                        <div class="absolute inset-0 bg-gradient-to-br from-red-900/20 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <i data-lucide="crosshair" class="w-12 h-12 text-red-500 mb-6 relative z-10 group-hover:scale-110 transition-transform"></i>
                        <h3 class="text-xl font-bold text-white relative z-10">Marché Noir</h3>
                        <p class="text-sm text-gray-400 mt-2 relative z-10">Armement lourd et équipements tactiques illégaux.</p>
                    </button>

                    <!-- Braquages -->
                    <button onclick="actions.setIllicitTab('heists')" class="glass-card group p-8 rounded-[30px] text-left relative overflow-hidden hover:border-orange-500/50 transition-all">
                        <div class="absolute inset-0 bg-gradient-to-br from-orange-900/20 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <i data-lucide="timer" class="w-12 h-12 text-orange-500 mb-6 relative z-10 group-hover:scale-110 transition-transform"></i>
                        <h3 class="text-xl font-bold text-white relative z-10">Braquages</h3>
                        <p class="text-sm text-gray-400 mt-2 relative z-10">Opérations organisées en équipe. Gros risques, gros gains.</p>
                    </button>

                    <!-- Drogue -->
                    <button onclick="actions.setIllicitTab('drugs')" class="glass-card group p-8 rounded-[30px] text-left relative overflow-hidden hover:border-emerald-500/50 transition-all">
                        <div class="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <i data-lucide="flask-conical" class="w-12 h-12 text-emerald-500 mb-6 relative z-10 group-hover:scale-110 transition-transform"></i>
                        <h3 class="text-xl font-bold text-white relative z-10">Laboratoire</h3>
                        <p class="text-sm text-gray-400 mt-2 relative z-10">Production et vente de stupéfiants.</p>
                    </button>
                </div>
            </div>
        `;
    }

    // 2. DROGUE
    if (state.activeIllicitTab === 'drugs') {
        const lab = state.drugLab || {};
        const hasBuilding = lab.has_building;
        const hasEquipment = lab.has_equipment;

        // --- SHOP VIEW (Si pas de batiment ou equip) ---
        if (!hasBuilding || !hasEquipment) {
             return `
                <div class="animate-fade-in max-w-4xl mx-auto">
                    <button onclick="actions.setIllicitTab('menu')" class="mb-6 glass-btn-secondary px-4 py-2 rounded-xl flex items-center gap-2">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                    </button>
                    
                    <div class="text-center mb-8">
                        <h2 class="text-2xl font-bold text-white">Installation Laboratoire</h2>
                        <p class="text-gray-400">Pour produire, vous devez investir dans l'immobilier et le matériel.</p>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- Batiment -->
                        <div class="glass-panel p-6 rounded-2xl border ${hasBuilding ? 'border-emerald-500/50' : 'border-white/10'}">
                            <div class="flex justify-between items-start mb-4">
                                <div class="w-12 h-12 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                    <i data-lucide="warehouse" class="w-6 h-6"></i>
                                </div>
                                <div class="text-right">
                                    <div class="text-2xl font-mono font-bold text-white">$30,000</div>
                                </div>
                            </div>
                            <h3 class="text-xl font-bold text-white mb-2">Entrepôt Sécurisé</h3>
                            <p class="text-sm text-gray-400 mb-6">Un lieu discret à l'abri des regards indiscrets pour vos opérations.</p>
                            
                            ${hasBuilding ? `
                                <button disabled class="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center gap-2 border border-emerald-500/30">
                                    <i data-lucide="check" class="w-4 h-4"></i> Acquis
                                </button>
                            ` : `
                                <button onclick="actions.buyLabComponent('building', 30000)" class="glass-btn w-full py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors">
                                    Acheter Local
                                </button>
                            `}
                        </div>

                        <!-- Equipement -->
                        <div class="glass-panel p-6 rounded-2xl border ${hasEquipment ? 'border-emerald-500/50' : 'border-white/10'} ${!hasBuilding ? 'opacity-50 pointer-events-none' : ''}">
                            <div class="flex justify-between items-start mb-4">
                                <div class="w-12 h-12 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                    <i data-lucide="flask-conical" class="w-6 h-6"></i>
                                </div>
                                <div class="text-right">
                                    <div class="text-2xl font-mono font-bold text-white">$15,000</div>
                                </div>
                            </div>
                            <h3 class="text-xl font-bold text-white mb-2">Matériel de Chimie</h3>
                            <p class="text-sm text-gray-400 mb-6">Extracteurs, lampes UV et équipements de transformation avancés.</p>
                            
                            ${hasEquipment ? `
                                <button disabled class="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center gap-2 border border-emerald-500/30">
                                    <i data-lucide="check" class="w-4 h-4"></i> Acquis
                                </button>
                            ` : `
                                <button onclick="actions.buyLabComponent('equipment', 15000)" class="glass-btn w-full py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors">
                                    Acheter Matériel
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
        }

        // --- DASHBOARD VIEW (PRODUCTION) ---
        const currentBatch = lab.current_batch; // { type, stage, amount, end_time }
        let timerHtml = '';
        
        if (currentBatch) {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((currentBatch.end_time - now) / 1000));
            const isFinished = remaining <= 0;
            
            const stageLabels = { 'harvest': 'Récolte', 'process': 'Traitement', 'sell': 'Vente' };
            const typeLabels = { 'coke': 'Cocaïne', 'weed': 'Cannabis' };

            timerHtml = `
                <div class="glass-panel p-6 rounded-2xl bg-gradient-to-r from-emerald-900/30 to-black border-emerald-500/30 relative overflow-hidden text-center mb-8">
                    <div class="relative z-10">
                         <div class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Opération en cours</div>
                         <h3 class="text-2xl font-bold text-white mb-4">
                            ${stageLabels[currentBatch.stage]} : ${currentBatch.amount}g ${typeLabels[currentBatch.type]}
                         </h3>
                         
                         ${!isFinished ? `
                             <div class="text-4xl font-mono font-bold text-white mb-2 animate-pulse">
                                ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}
                             </div>
                             <p class="text-xs text-gray-400">Ne quittez pas le panel pour assurer la synchro.</p>
                         ` : `
                             <div class="text-2xl font-bold text-emerald-400 mb-4 flex items-center justify-center gap-2">
                                <i data-lucide="check-circle" class="w-6 h-6"></i> Terminée
                             </div>
                             <button onclick="actions.collectProduction()" class="glass-btn px-8 py-3 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 animate-bounce">
                                ${currentBatch.stage === 'sell' ? 'Récupérer l\'argent' : 'Récupérer le stock'}
                             </button>
                         `}
                    </div>
                </div>
            `;
        }

        return `
            <div class="animate-fade-in max-w-5xl mx-auto">
                 <div class="flex items-center justify-between mb-6">
                    <button onclick="actions.setIllicitTab('menu')" class="glass-btn-secondary px-4 py-2 rounded-xl flex items-center gap-2">
                        <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour
                    </button>
                    <div class="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                         <i data-lucide="warehouse" class="w-4 h-4 text-emerald-400"></i>
                         <span class="text-sm font-bold text-emerald-100">Labo Actif</span>
                    </div>
                </div>

                ${timerHtml}

                ${!currentBatch ? `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- ACTION PANELS -->
                    <div class="space-y-6">
                        <!-- Harvest -->
                        <div class="glass-panel p-6 rounded-2xl">
                             <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="sprout" class="w-5 h-5 text-emerald-400"></i> Production (1x / Semaine)</h3>
                             <form onsubmit="actions.startDrugAction('harvest', event)" class="space-y-4">
                                <div class="grid grid-cols-2 gap-4">
                                    <label class="cursor-pointer">
                                        <input type="radio" name="drug_type" value="coke" class="peer sr-only" checked>
                                        <div class="p-3 bg-white/5 rounded-xl border border-white/5 peer-checked:bg-white/10 peer-checked:border-white text-center">Cocaïne</div>
                                    </label>
                                    <label class="cursor-pointer">
                                        <input type="radio" name="drug_type" value="weed" class="peer sr-only">
                                        <div class="p-3 bg-white/5 rounded-xl border border-white/5 peer-checked:bg-white/10 peer-checked:border-white text-center">Cannabis</div>
                                    </label>
                                </div>
                                <select name="amount" class="glass-input w-full p-3 rounded-xl">
                                    <option value="100">100g</option>
                                    <option value="500">500g</option>
                                    <option value="1000">1000g</option>
                                </select>
                                <button type="submit" class="glass-btn w-full py-3 rounded-xl font-bold">Lancer Production</button>
                             </form>
                             <p class="text-[10px] text-gray-500 mt-2 text-center">Attention: La production est limitée à une fois par semaine par personnage.</p>
                        </div>

                        <!-- Process -->
                         <div class="glass-panel p-6 rounded-2xl">
                             <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="flask-conical" class="w-5 h-5 text-blue-400"></i> Traitement</h3>
                             <form onsubmit="actions.startDrugAction('process', event)" class="flex gap-4">
                                <select name="drug_type" class="glass-input flex-1 p-3 rounded-xl">
                                    <option value="coke">Cocaïne (Stock: ${lab.stock_coke_raw || 0}g)</option>
                                    <option value="weed">Cannabis (Stock: ${lab.stock_weed_raw || 0}g)</option>
                                </select>
                                <select name="amount" class="glass-input w-24 p-3 rounded-xl">
                                    <option value="100">100g</option>
                                    <option value="500">500g</option>
                                    <option value="1000">1000g</option>
                                </select>
                                <button type="submit" class="glass-btn px-4 rounded-xl"><i data-lucide="play" class="w-5 h-5"></i></button>
                             </form>
                        </div>

                        <!-- Sell -->
                         <div class="glass-panel p-6 rounded-2xl">
                             <h3 class="font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="banknote" class="w-5 h-5 text-green-400"></i> Vente</h3>
                             <form onsubmit="actions.startDrugAction('sell', event)" class="flex gap-4">
                                <select name="drug_type" class="glass-input flex-1 p-3 rounded-xl">
                                    <option value="coke">Cocaïne Pure (Stock: ${lab.stock_coke_pure || 0}g)</option>
                                    <option value="weed">Cannabis Sec (Stock: ${lab.stock_weed_pure || 0}g)</option>
                                </select>
                                <select name="amount" class="glass-input w-24 p-3 rounded-xl">
                                    <option value="100">100g</option>
                                    <option value="500">500g</option>
                                    <option value="1000">1000g</option>
                                </select>
                                <button type="submit" class="glass-btn px-4 rounded-xl"><i data-lucide="play" class="w-5 h-5"></i></button>
                             </form>
                        </div>
                    </div>
                    
                    <!-- INFO PANEL -->
                    <div class="glass-panel p-6 rounded-2xl h-fit">
                        <h3 class="font-bold text-white mb-4">Stocks Actuels</h3>
                        <div class="space-y-4">
                            <div class="flex justify-between p-3 bg-white/5 rounded-xl">
                                <span>Cocaïne Brute</span>
                                <span class="font-mono text-gray-300">${lab.stock_coke_raw || 0}g</span>
                            </div>
                            <div class="flex justify-between p-3 bg-white/5 rounded-xl">
                                <span>Cocaïne Pure</span>
                                <span class="font-mono text-emerald-400 font-bold">${lab.stock_coke_pure || 0}g</span>
                            </div>
                            <div class="w-full border-t border-white/5 my-2"></div>
                            <div class="flex justify-between p-3 bg-white/5 rounded-xl">
                                <span>Cannabis Brut</span>
                                <span class="font-mono text-gray-300">${lab.stock_weed_raw || 0}g</span>
                            </div>
                            <div class="flex justify-between p-3 bg-white/5 rounded-xl">
                                <span>Cannabis Sec</span>
                                <span class="font-mono text-emerald-400 font-bold">${lab.stock_weed_pure || 0}g</span>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    // 3. BRAQUAGES (HEISTS) - Code inchangé, repris du bloc précédent
    if (state.activeIllicitTab === 'heists') {
        // --- LOBBY ACTIF ---
        if (state.activeHeistLobby) {
             const lobby = state.activeHeistLobby;
            const heistInfo = HEIST_DATA.find(h => h.id === lobby.heist_type);
            const amHost = lobby.host_id === state.activeCharacter.id;

            // STATUS: SETUP
            if (lobby.status === 'setup') {
                const pendingMembers = state.heistMembers.filter(m => m.status === 'pending');
                const acceptedMembers = state.heistMembers.filter(m => m.status === 'accepted');

                return `
                    <div class="animate-fade-in max-w-3xl mx-auto mt-6">
                        <button onclick="actions.setIllicitTab('menu')" class="mb-6 text-gray-500 hover:text-white flex items-center gap-2 transition-colors">
                            <i data-lucide="arrow-left" class="w-4 h-4"></i> Retour au Menu
                        </button>

                        <div class="glass-panel p-8 rounded-2xl relative overflow-hidden">
                            <div class="absolute top-0 right-0 p-6 opacity-5"><i data-lucide="${heistInfo.icon}" class="w-32 h-32 text-white"></i></div>
                            <div class="relative z-10 mb-6 border-b border-white/10 pb-6 flex justify-between items-start">
                                <div>
                                    <h2 class="text-2xl font-bold text-white flex items-center gap-3">
                                        <span class="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span>
                                        Lobby: ${heistInfo.name}
                                    </h2>
                                    <p class="text-gray-400 text-sm mt-1">Chef d'opération: ${amHost ? 'Vous' : 'Inconnu'}</p>
                                </div>
                                <div class="text-right">
                                    <div class="text-3xl font-bold text-emerald-400 font-mono">$${(heistInfo.max/1000).toFixed(0)}k</div>
                                    <div class="text-[10px] text-gray-500 uppercase">Gain Max</div>
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 class="text-xs uppercase text-emerald-500 font-bold tracking-wider mb-3 flex items-center gap-2"><i data-lucide="users" class="w-3 h-3"></i> Équipe Confirmée</h3>
                                    <div class="space-y-2">
                                        ${acceptedMembers.map(m => `<div class="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5"><div class="flex items-center gap-3"><div class="w-8 h-8 rounded bg-gray-700 flex items-center justify-center font-bold text-xs">${m.characters?.first_name[0]}</div><div class="font-bold text-white text-sm">${m.characters?.first_name} ${m.characters?.last_name}</div></div>${m.character_id === lobby.host_id ? '<span class="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Chef</span>' : ''}</div>`).join('')}
                                    </div>
                                </div>
                                <div>
                                    <h3 class="text-xs uppercase text-amber-500 font-bold tracking-wider mb-3 flex items-center gap-2"><i data-lucide="user-plus" class="w-3 h-3"></i> Demandes en attente</h3>
                                    ${pendingMembers.length === 0 ? '<div class="text-gray-600 text-sm italic">Aucune demande.</div>' : ''}
                                    <div class="space-y-2">
                                        ${pendingMembers.map(m => `<div class="flex items-center justify-between bg-amber-500/5 p-3 rounded-lg border border-amber-500/10"><div class="text-sm text-gray-300">${m.characters?.first_name} ${m.characters?.last_name}</div>${amHost ? `<div class="flex gap-1"><button onclick="actions.acceptHeistApplicant('${m.character_id}')" class="p-1.5 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/40"><i data-lucide="check" class="w-3 h-3"></i></button><button onclick="actions.rejectHeistApplicant('${m.character_id}')" class="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40"><i data-lucide="x" class="w-3 h-3"></i></button></div>` : '<span class="text-[10px] text-amber-500">En attente</span>'}</div>`).join('')}
                                    </div>
                                </div>
                            </div>
                            <div class="mt-8 pt-6 border-t border-white/10">
                                ${amHost ? `<button onclick="actions.startHeistLobby('${heistInfo.time}')" class="glass-btn w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 hover:scale-[1.01] transition-transform shadow-lg shadow-red-900/20"><i data-lucide="play" class="w-5 h-5"></i> LANCER L'OPÉRATION</button>` : `<div class="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center text-orange-200 text-sm animate-pulse flex items-center justify-center gap-2"><i data-lucide="loader" class="w-4 h-4 animate-spin"></i> En attente du chef d'équipe...</div>`}
                                <button onclick="actions.leaveLobby()" class="mt-4 text-xs text-gray-500 hover:text-white w-full text-center">Abandonner l'équipe</button>
                            </div>
                        </div>
                    </div>`;
            }

            // STATUS: ACTIVE
             if (lobby.status === 'active') {
                const now = Date.now();
                let remaining = Math.max(0, Math.ceil((lobby.end_time - now) / 1000));
                const totalDuration = (lobby.end_time - lobby.start_time) / 1000;
                const progress = ((totalDuration - remaining) / totalDuration) * 100;
                if (remaining <= 0) {
                     return `<div class="animate-fade-in flex items-center justify-center h-full"><div class="glass-panel p-8 text-center max-w-md w-full"><div class="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-6 animate-bounce"><i data-lucide="check" class="w-10 h-10"></i></div><h2 class="text-2xl font-bold text-white mb-2">Opération Terminée</h2><p class="text-gray-400 mb-6">L'équipe est de retour au QG.</p>${amHost ? `<button onclick="actions.finishHeist()" class="glass-btn w-full py-3 rounded-xl font-bold">Voir le résultat et Partager</button>` : `<p class="text-sm text-gray-500 italic">En attente du chef pour le partage...</p>`}</div></div>`;
                }
                return `<div class="animate-fade-in flex items-center justify-center h-full"><div class="glass-panel p-10 text-center max-w-lg w-full relative overflow-hidden"><div class="absolute inset-0 bg-red-500/5 animate-pulse"></div><div class="relative z-10"><div class="w-20 h-20 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center mb-6"><i data-lucide="timer" class="w-10 h-10 animate-spin"></i></div><h2 class="text-2xl font-bold text-white mb-2">Braquage en cours...</h2><div class="text-xs text-gray-500 uppercase tracking-widest mb-6">${heistInfo.name}</div><div class="text-5xl font-mono font-bold text-white mb-8 tracking-wider">${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}</div><div class="h-2 w-full bg-gray-800 rounded-full overflow-hidden mb-4"><div class="h-full bg-red-500 transition-all duration-1000" style="width: ${progress}%"></div></div><p class="text-xs text-gray-500 mt-4">Restez connectés. La police est en route.</p></div></div></div>`;
            }
        }
        
        // --- LISTE ---
        return `
            <div class="animate-fade-in max-w-6xl mx-auto space-y-6">
                <div class="flex items-center justify-between">
                    <button onclick="actions.setIllicitTab('menu')" class="glass-btn-secondary px-4 py-2 rounded-xl flex items-center gap-2"><i data-lucide="arrow-left" class="w-4 h-4"></i> Retour</button>
                    <div class="text-right"><h2 class="text-xl font-bold text-white">Opérations Disponibles</h2><p class="text-xs text-gray-400">Créez votre équipe ou rejoignez-en une.</p></div>
                </div>
                ${state.availableHeistLobbies.length > 0 ? `<div class="glass-panel p-6 rounded-2xl border-orange-500/20"><h3 class="text-sm font-bold text-white mb-4 flex items-center gap-2"><i data-lucide="users" class="w-4 h-4 text-orange-400"></i> Équipes en recrutement</h3><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">${state.availableHeistLobbies.map(lobby => { const info = HEIST_DATA.find(h => h.id === lobby.heist_type); return `<div class="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all"><div class="flex justify-between items-start mb-2"><div class="font-bold text-white">${info.name}</div><div class="text-xs text-gray-500">Chef: ${lobby.host_name}</div></div><div class="text-xs text-gray-400 mb-3">Statut: Préparation</div><button onclick="actions.requestJoinLobby('${lobby.id}')" class="glass-btn-secondary w-full py-2 rounded-lg text-xs font-bold hover:bg-orange-500/20 hover:text-orange-400">Postuler</button></div>`; }).join('')}</div></div>` : ''}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${HEIST_DATA.map(h => `<div class="glass-panel p-6 rounded-2xl flex flex-col relative overflow-hidden group hover:border-orange-500/30 transition-all"><div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><i data-lucide="${h.icon}" class="w-24 h-24 text-white"></i></div><div class="flex items-center gap-4 mb-4 relative z-10"><div class="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center"><i data-lucide="${h.icon}" class="w-6 h-6"></i></div><div><h3 class="font-bold text-white text-lg">${h.name}</h3><div class="text-xs text-gray-400">Difficulté: <span class="${h.rate < 30 ? 'text-red-400' : 'text-emerald-400'}">${100 - h.rate}/100</span></div></div></div><div class="space-y-3 mb-6 relative z-10"><div class="flex justify-between text-sm border-b border-white/5 pb-2"><span class="text-gray-500">Gain Estimé</span><span class="text-emerald-400 font-mono font-bold">$${(h.min/1000).toFixed(0)}k - ${(h.max/1000).toFixed(0)}k</span></div><div class="flex justify-between text-sm border-b border-white/5 pb-2"><span class="text-gray-500">Durée</span><span class="text-white">${Math.floor(h.time / 60)} min ${(h.time % 60) > 0 ? (h.time % 60)+'s' : ''}</span></div></div><button onclick="actions.createLobby('${h.id}')" class="mt-auto glass-btn w-full py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform"><i data-lucide="plus-circle" class="w-4 h-4 mr-2"></i> Monter une équipe</button></div>`).join('')}</div>
            </div>`;
    }

    // 4. MARCHÉ NOIR
    const catTabs = [
        { id: 'light', label: 'Légères / Outils', icon: 'target' },
        { id: 'medium', label: 'Moyennes', icon: 'zap' },
        { id: 'heavy', label: 'Lourdes', icon: 'flame' },
        { id: 'sniper', label: 'Snipers', icon: 'crosshair' }
    ];

    let currentSubTab = state.activeIllicitTab;
    if (currentSubTab === 'market') currentSubTab = 'light';
    else if (currentSubTab.startsWith('market-')) currentSubTab = currentSubTab.replace('market-', '');

    // Filter Items Logic
    let currentItems = BLACK_MARKET_CATALOG[currentSubTab] || [];
    if (state.blackMarketSearch) {
        const q = state.blackMarketSearch.toLowerCase();
        currentItems = currentItems.filter(i => i.name.toLowerCase().includes(q));
    }

    return `
        <div class="animate-fade-in max-w-6xl mx-auto space-y-6">
            <!-- Header -->
             <div class="glass-card p-6 rounded-[30px] bg-gradient-to-r from-red-900/40 to-black border-red-500/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="absolute -left-10 -top-10 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]"></div>
                <div class="relative z-10 flex items-center gap-4 w-full md:w-auto">
                     <button onclick="actions.setIllicitTab('menu')" class="glass-btn-secondary p-2 rounded-lg hover:bg-white/10">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    </button>
                    <h2 class="text-3xl font-bold text-white whitespace-nowrap">Marché Noir</h2>
                </div>
                
                <div class="relative z-10 w-full md:w-96">
                    <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                    <input type="text" 
                        oninput="actions.searchBlackMarket(this.value)" 
                        value="${state.blackMarketSearch}"
                        placeholder="Rechercher arme, outil..." 
                        class="glass-input pl-10 pr-4 py-3 rounded-xl w-full text-sm">
                </div>

                <div class="text-right z-10 hidden lg:block whitespace-nowrap">
                    <div class="text-[10px] text-gray-400 uppercase tracking-widest">Argent Liquide</div>
                    <div class="text-3xl font-mono font-bold text-emerald-400">$ ${state.bankAccount.cash_balance.toLocaleString()}</div>
                </div>
            </div>

             <!-- Navigation Tabs -->
            <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                ${catTabs.map(tab => `
                    <button onclick="actions.setIllicitTab('market-${tab.id}')" 
                        class="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all border ${currentSubTab === tab.id 
                            ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/20' 
                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}">
                        <i data-lucide="${tab.icon}" class="w-4 h-4"></i>
                        ${tab.label}
                    </button>
                `).join('')}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${currentItems.length === 0 ? '<div class="col-span-3 text-center text-gray-500 py-10">Aucun article trouvé.</div>' : ''}
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