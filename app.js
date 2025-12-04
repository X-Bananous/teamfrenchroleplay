/**
 * TFRP App Logic
 * Vanilla JS - No Frameworks
 */

// --- State Management ---
const state = {
    user: JSON.parse(localStorage.getItem('tfrp_user')) || null,
    characters: JSON.parse(localStorage.getItem('tfrp_characters')) || [],
    selectedChar: null,
    view: 'login', // login, select, create, hub
    activePanel: 'main' // main, services, illicit, court, staff
};

// --- Mock Data Generator ---
const initMockData = () => {
    if (state.characters.length === 0) {
        state.characters = [
            {
                id: 'char_1',
                first_name: 'Thomas',
                last_name: 'Shelby',
                birth_date: '1890-01-01',
                birth_place: 'Birmingham',
                age: 35,
                status: 'accepted'
            },
            {
                id: 'char_2',
                first_name: 'Jean',
                last_name: 'Valjean',
                birth_date: '1970-09-07',
                birth_place: 'Paris',
                age: 50,
                status: 'pending'
            }
        ];
        saveState();
    }
};

const saveState = () => {
    localStorage.setItem('tfrp_user', JSON.stringify(state.user));
    localStorage.setItem('tfrp_characters', JSON.stringify(state.characters));
};

// --- DOM References ---
const appContainer = document.getElementById('view-container');

// --- Render Functions ---

const renderIcons = () => {
    if (window.lucide) lucide.createIcons();
};

const setView = (viewName) => {
    state.view = viewName;
    render();
};

// 1. Login View
const renderLogin = () => {
    return `
        <div class="view-animate min-h-screen flex items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1480796927426-f609979314bd?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            
            <div class="glass-panel w-full max-w-md p-10 rounded-[32px] text-center relative overflow-hidden z-10 shadow-2xl">
                <!-- Top Decoration -->
                <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1.5 bg-gray-500/30 rounded-b-xl"></div>
                
                <div class="mb-10">
                    <h1 class="text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white via-gray-200 to-gray-500 tracking-tight drop-shadow-sm">TFRP</h1>
                    <p class="text-blue-400/90 text-sm tracking-[0.2em] uppercase font-semibold">Team French RolePlay</p>
                </div>

                <div class="space-y-5">
                    <button onclick="handleDiscordLogin()" class="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(88,101,242,0.3)] hover:shadow-[0_0_30px_rgba(88,101,242,0.5)] group">
                        <i data-lucide="gamepad-2" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
                        Connexion via Discord
                    </button>

                    <div class="relative py-4">
                        <div class="absolute inset-0 flex items-center"><span class="w-full border-t border-white/10"></span></div>
                        <div class="relative flex justify-center"><span class="bg-[#242426] px-4 text-[10px] text-gray-500 rounded-full font-mono uppercase">Version Démo</span></div>
                    </div>

                    <button onclick="handleDevLogin()" class="glass-btn-secondary w-full py-3 px-6 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 group">
                        <i data-lucide="code" class="w-4 h-4 text-gray-400 group-hover:text-white transition-colors"></i>
                        Accès Développeur (Bypass)
                    </button>
                </div>
                
                <p class="mt-10 text-[10px] text-gray-500 leading-relaxed">
                    En accédant à nos services, vous acceptez le règlement intérieur et les CGU de TFRP.
                </p>
            </div>
        </div>
    `;
};

// 2. Character Select View
const renderCharSelect = () => {
    const charListHtml = state.characters.map(char => {
        const isAccepted = char.status === 'accepted';
        const isPending = char.status === 'pending';
        const statusColor = isAccepted ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                            isPending ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 
                            'text-red-400 bg-red-500/10 border-red-500/20';
        
        const statusLabel = isAccepted ? 'Citoyen' : isPending ? 'En attente' : 'Refusé';
        
        return `
            <div class="glass-card p-6 rounded-[24px] flex flex-col w-[320px] relative group overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-50">
                     <i data-lucide="${isAccepted ? 'check-circle' : 'clock'}" class="w-24 h-24 ${isAccepted ? 'text-emerald-500/10' : 'text-amber-500/10'} -mr-8 -mt-8"></i>
                </div>
                
                <div class="flex justify-between items-start mb-6 z-10">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-black flex items-center justify-center border border-white/10 shadow-lg">
                        <i data-lucide="user" class="w-8 h-8 text-gray-300"></i>
                    </div>
                    <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}">
                        ${statusLabel}
                    </span>
                </div>
                
                <div class="mb-6 z-10">
                    <h3 class="text-2xl font-bold text-white mb-1 tracking-tight">${char.first_name} ${char.last_name}</h3>
                    <p class="text-sm text-gray-400 flex items-center gap-2">
                        <i data-lucide="map-pin" class="w-3 h-3"></i> ${char.birth_place}
                    </p>
                    <p class="text-xs text-gray-500 mt-1 uppercase tracking-widest">${char.age} ANS</p>
                </div>
                
                <div class="mt-auto z-10">
                    ${isAccepted 
                        ? `<button onclick="handleSelectChar('${char.id}')" class="glass-btn w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/20">
                             <i data-lucide="play" class="w-4 h-4 fill-current"></i> Incarner
                           </button>` 
                        : `<button disabled class="w-full py-3 rounded-xl text-sm font-semibold bg-white/5 text-gray-500 cursor-not-allowed flex items-center justify-center gap-2 border border-white/5">
                             <i data-lucide="lock" class="w-4 h-4"></i> Dossier en cours
                           </button>`
                    }
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="view-animate min-h-screen flex flex-col items-center justify-center p-8 relative">
            <button onclick="handleLogout()" class="absolute top-8 right-8 glass-btn-secondary p-3 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors group" title="Déconnexion">
                <i data-lucide="log-out" class="w-5 h-5 group-hover:-translate-x-0.5 transition-transform"></i>
            </button>

            <div class="text-center mb-16">
                <h2 class="text-4xl font-bold text-white mb-3 tracking-tight">Identité</h2>
                <p class="text-gray-400 text-lg font-light">Qui serez-vous aujourd'hui ?</p>
            </div>

            <div class="flex flex-wrap gap-8 justify-center items-center w-full max-w-6xl">
                ${charListHtml}

                <!-- Create New Button -->
                ${state.characters.length < 2 ? `
                <button onclick="setView('create')" class="glass-card group p-6 rounded-[24px] flex flex-col items-center justify-center w-[320px] h-[280px] border-dashed border-2 border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer transition-all">
                    <div class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300">
                        <i data-lucide="plus" class="w-10 h-10 text-gray-400 group-hover:text-blue-400"></i>
                    </div>
                    <span class="text-lg font-semibold text-gray-300 group-hover:text-white transition-colors">Nouveau Personnage</span>
                    <span class="text-xs text-gray-500 mt-2 font-mono">SLOT DISPONIBLE</span>
                </button>
                ` : ''}
            </div>
        </div>
    `;
};

// 3. Create View
const renderCharCreate = () => {
    return `
        <div class="view-animate min-h-screen flex items-center justify-center p-6">
            <div class="glass-panel w-full max-w-3xl p-10 rounded-[32px] relative shadow-2xl">
                <div class="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
                    <div>
                        <h2 class="text-3xl font-bold text-white">Nouveau Dossier</h2>
                        <p class="text-gray-400 text-sm mt-1">Immigration Los Santos</p>
                    </div>
                    <button onclick="setView('select')" class="glass-btn-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-white/10">
                        <i data-lucide="x" class="w-4 h-4"></i> Annuler
                    </button>
                </div>

                <form onsubmit="handleCreateSubmit(event)" class="space-y-8">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-3">
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Prénom</label>
                            <input type="text" name="first_name" required class="glass-input w-full p-4 rounded-2xl text-lg" placeholder="Ex: Jean">
                        </div>
                        <div class="space-y-3">
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nom</label>
                            <input type="text" name="last_name" required class="glass-input w-full p-4 rounded-2xl text-lg" placeholder="Ex: Dupont">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-3">
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Date de naissance</label>
                            <input type="date" name="birth_date" required class="glass-input w-full p-4 rounded-2xl text-lg text-gray-300">
                        </div>
                        <div class="space-y-3">
                            <label class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Lieu de naissance</label>
                            <input type="text" name="birth_place" required class="glass-input w-full p-4 rounded-2xl text-lg" placeholder="Ex: Paris, France">
                        </div>
                    </div>
                    
                    <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4 items-start">
                        <i data-lucide="info" class="w-5 h-5 text-blue-400 mt-0.5 shrink-0"></i>
                        <p class="text-xs text-blue-100 leading-relaxed">
                            En soumettant ce dossier, vous certifiez que les informations sont correctes pour le RolePlay.
                            Tout personnage doit avoir au moins 18 ans.
                        </p>
                    </div>

                    <div class="flex justify-end pt-2">
                        <button type="submit" class="glass-btn px-10 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-lg shadow-blue-500/20">
                            <i data-lucide="send" class="w-5 h-5"></i>
                            Soumettre la demande
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
};

// 4. Hub View (Dashboard)
const renderHub = () => {
    // Mock Online List
    const onlineList = [
        { name: 'John Doe', job: 'police' },
        { name: 'Jane Smith', job: 'ems' },
        { name: 'Mike Ross', job: 'civilian' },
        { name: 'Harvey Specter', job: 'civilian' },
        { name: 'Rachel Zane', job: 'police' },
        { name: 'Louis Litt', job: 'justice' },
    ];

    const onlineHtml = onlineList.map(p => `
        <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-default group">
            <div class="relative">
                <div class="w-2.5 h-2.5 rounded-full ${
                    p.job === 'police' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' : 
                    p.job === 'ems' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 
                    p.job === 'justice' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 
                    'bg-gray-400'
                }"></div>
            </div>
            <span class="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">${p.name}</span>
        </div>
    `).join('');

    let contentHtml = '';
    
    // Router for internal hub panels
    if (state.activePanel === 'main') {
        contentHtml = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                <!-- Services Publics -->
                <button onclick="setPanel('services')" class="glass-card group p-8 rounded-[24px] flex flex-col items-start justify-between text-left h-64 relative overflow-hidden transition-all hover:scale-[1.02]">
                    <div class="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="bg-blue-500/20 p-4 rounded-2xl mb-4 group-hover:bg-blue-500/30 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                        <i data-lucide="briefcase" class="w-8 h-8 text-blue-400"></i>
                    </div>
                    <div class="relative z-10">
                        <h3 class="text-2xl font-bold text-white mb-1">Services Publics</h3>
                        <p class="text-sm text-gray-400">LSPD, EMS, Gouvernement</p>
                    </div>
                    <i data-lucide="arrow-right" class="absolute bottom-8 right-8 w-6 h-6 text-blue-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all"></i>
                </button>

                <!-- Illégal -->
                <button onclick="setPanel('illicit')" class="glass-card group p-8 rounded-[24px] flex flex-col items-start justify-between text-left h-64 relative overflow-hidden transition-all hover:scale-[1.02]">
                    <div class="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="bg-red-500/20 p-4 rounded-2xl mb-4 group-hover:bg-red-500/30 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <i data-lucide="skull" class="w-8 h-8 text-red-400"></i>
                    </div>
                    <div class="relative z-10">
                        <h3 class="text-2xl font-bold text-white mb-1">Réseau Souterrain</h3>
                        <p class="text-sm text-gray-400">Darknet, Organisations</p>
                    </div>
                    <i data-lucide="arrow-right" class="absolute bottom-8 right-8 w-6 h-6 text-red-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all"></i>
                </button>

                <!-- Justice -->
                <button onclick="setPanel('court')" class="glass-card group p-8 rounded-[24px] flex flex-col items-start justify-between text-left h-64 relative overflow-hidden transition-all hover:scale-[1.02]">
                    <div class="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="bg-amber-500/20 p-4 rounded-2xl mb-4 group-hover:bg-amber-500/30 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        <i data-lucide="scale" class="w-8 h-8 text-amber-400"></i>
                    </div>
                    <div class="relative z-10">
                        <h3 class="text-2xl font-bold text-white mb-1">Tribunal</h3>
                        <p class="text-sm text-gray-400">Dossiers et Jugements</p>
                    </div>
                    <i data-lucide="arrow-right" class="absolute bottom-8 right-8 w-6 h-6 text-amber-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all"></i>
                </button>
                
                <!-- Staff -->
                ${state.user.isStaff ? `
                <button onclick="setPanel('staff')" class="glass-card group p-8 rounded-[24px] flex flex-col items-start justify-between text-left h-64 relative overflow-hidden transition-all hover:scale-[1.02] border-purple-500/20">
                    <div class="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div class="bg-purple-500/20 p-4 rounded-2xl mb-4 group-hover:bg-purple-500/30 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                        <i data-lucide="shield-alert" class="w-8 h-8 text-purple-400"></i>
                    </div>
                    <div class="relative z-10">
                        <h3 class="text-2xl font-bold text-white mb-1">Administration</h3>
                        <p class="text-sm text-gray-400">Gestion et Tickets</p>
                    </div>
                    <i data-lucide="arrow-right" class="absolute bottom-8 right-8 w-6 h-6 text-purple-400 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all"></i>
                </button>
                ` : ''}
            </div>
        `;
    } else if (state.activePanel === 'staff') {
        contentHtml = renderStaffPanel();
    } else {
        contentHtml = `
            <div class="glass-card p-16 rounded-[32px] text-center flex flex-col items-center justify-center h-[500px]">
                <div class="bg-white/5 p-8 rounded-full mb-8 animate-pulse">
                    <i data-lucide="hammer" class="w-16 h-16 text-gray-400"></i>
                </div>
                <h2 class="text-3xl font-bold text-white mb-4">En Construction</h2>
                <p class="text-gray-400 mb-10 text-lg max-w-md">Cette section de Los Santos est actuellement en travaux par l'équipe de développement.</p>
                <button onclick="setPanel('main')" class="glass-btn-secondary px-8 py-3 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors">
                    <i data-lucide="arrow-left" class="w-5 h-5"></i> Retour au Dashboard
                </button>
            </div>
        `;
    }

    return `
        <div class="view-animate h-full flex overflow-hidden bg-black/40">
            <!-- Sidebar -->
            <aside class="w-80 glass-panel border-r-0 border-y-0 border-l-0 flex flex-col z-20 shadow-2xl relative">
                <!-- User Profile -->
                <div class="p-8 pb-6">
                    <div class="flex flex-col items-center text-center mb-8">
                        <div class="relative mb-4">
                            <img src="${state.user.avatar}" alt="User" class="w-20 h-20 rounded-full border-4 border-black shadow-[0_0_0_2px_#3b82f6]">
                            <div class="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#1c1c1e]"></div>
                        </div>
                        <h3 class="text-xl font-bold text-white tracking-tight">${state.selectedChar.first_name} ${state.selectedChar.last_name}</h3>
                        <p class="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1 opacity-80">
                             ID: ${state.selectedChar.id.split('_')[1] || '000'}
                        </p>
                    </div>
                    
                    <div class="bg-black/30 rounded-2xl p-5 border border-white/5 backdrop-blur-md">
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                État Serveur
                            </span>
                            <span class="text-xs font-mono text-gray-400">32 / 128</span>
                        </div>
                        <div class="w-full bg-gray-700/30 h-1.5 rounded-full overflow-hidden">
                            <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[25%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        </div>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto px-6 py-2 space-y-1">
                    <h4 class="px-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Citoyens en ville</h4>
                    ${onlineHtml}
                </div>

                <div class="p-6 mt-auto border-t border-white/5 bg-black/20">
                    <button onclick="handleLogout()" class="w-full glass-btn-secondary py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-medium">
                        <i data-lucide="power" class="w-4 h-4"></i> Déconnexion
                    </button>
                </div>
            </aside>

            <!-- Main Content -->
            <main class="flex-1 flex flex-col relative z-10 bg-[url('https://images.unsplash.com/photo-1550948537-130a1ce83314?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
                
                <header class="h-24 flex items-center justify-between px-10 relative z-20">
                    <div>
                        <h1 class="text-3xl font-bold text-white tracking-tight">
                            ${state.activePanel === 'main' ? 'Tableau de bord' : 
                              state.activePanel === 'staff' ? 'Administration' : 
                              state.activePanel === 'illicit' ? 'Réseau' : 
                              state.activePanel === 'court' ? 'Justice' : 'Services Publics'}
                        </h1>
                        <p class="text-sm text-gray-400 mt-0.5 font-light">Bienvenue à Los Santos, <span class="text-white font-medium">${state.user.username}</span></p>
                    </div>
                    
                    ${state.activePanel !== 'main' ? `
                        <button onclick="setPanel('main')" class="glass-btn-secondary p-3 rounded-xl hover:bg-white/20 transition-colors">
                            <i data-lucide="layout-grid" class="w-6 h-6"></i>
                        </button>
                    ` : ''}
                </header>

                <div class="flex-1 overflow-y-auto p-10 relative z-20">
                    ${contentHtml}
                </div>
            </main>
        </div>
    `;
};

// 4.1 Staff Panel Helper
const renderStaffPanel = () => {
    const pendingApps = state.characters.filter(c => c.status === 'pending');

    if (pendingApps.length === 0) {
        return `
            <div class="flex flex-col items-center justify-center h-full text-gray-500">
                <div class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <i data-lucide="check" class="w-10 h-10 opacity-30"></i>
                </div>
                <p class="text-lg">Aucune demande en attente.</p>
                <button onclick="setPanel('main')" class="mt-6 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">Retour au menu</button>
            </div>
        `;
    }

    return `
        <div class="space-y-6 animate-fadeIn max-w-4xl mx-auto">
            <div class="flex justify-between items-center mb-8">
                <h2 class="text-xl font-semibold text-white">Demandes de Visa (${pendingApps.length})</h2>
                <div class="glass-tabs flex text-xs">
                    <div class="glass-tab-active px-4 py-1.5 rounded-md font-medium">En attente</div>
                    <div class="px-4 py-1.5 text-gray-400 cursor-pointer hover:text-white transition-colors">Historique</div>
                </div>
            </div>

            <div class="grid gap-4">
                ${pendingApps.map(app => `
                    <div class="glass-card p-6 rounded-2xl border-l-4 border-l-yellow-500 flex justify-between items-center group hover:bg-white/5 transition-all">
                        <div class="flex items-center gap-5">
                            <div class="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-bold text-lg">
                                ${app.first_name[0]}${app.last_name[0]}
                            </div>
                            <div>
                                <h3 class="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">${app.first_name} ${app.last_name}</h3>
                                <div class="flex gap-4 text-xs text-gray-400 mt-1.5 uppercase tracking-wide font-medium">
                                    <span class="flex items-center gap-1.5"><i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${app.age} ans</span>
                                    <span class="flex items-center gap-1.5"><i data-lucide="map-pin" class="w-3.5 h-3.5"></i> ${app.birth_place}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="handleStaffDecision('${app.id}', 'accepted')" class="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-medium text-sm hover:scale-105" title="Accepter">
                                <i data-lucide="check" class="w-4 h-4"></i> Accepter
                            </button>
                            <button onclick="handleStaffDecision('${app.id}', 'rejected')" class="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-medium text-sm hover:scale-105" title="Refuser">
                                <i data-lucide="x" class="w-4 h-4"></i> Refuser
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
};

// --- Logic Handlers (Global scope for onclick) ---

window.handleDiscordLogin = () => {
    // Simulating OAuth redirect
    handleDevLogin();
};

window.handleDevLogin = () => {
    state.user = {
        id: 'dev_user_1',
        username: 'Admin_TFRP',
        avatar: 'https://ui-avatars.com/api/?name=Admin+TFRP&background=0A84FF&color=fff&bold=true',
        isStaff: true
    };
    initMockData(); // Ensure some chars exist
    saveState();
    setView('select');
};

window.handleLogout = () => {
    state.user = null;
    state.selectedChar = null;
    state.view = 'login';
    state.activePanel = 'main';
    localStorage.removeItem('tfrp_user'); 
    render();
};

window.handleSelectChar = (charId) => {
    const char = state.characters.find(c => c.id === charId);
    if (char && char.status === 'accepted') {
        state.selectedChar = char;
        setView('hub');
    }
};

window.handleCreateSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const birthDate = new Date(formData.get('birth_date'));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < 18) {
        alert("Le personnage doit avoir au moins 18 ans.");
        return;
    }

    const newChar = {
        id: 'char_' + Date.now(),
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        birth_date: formData.get('birth_date'),
        birth_place: formData.get('birth_place'),
        age: age,
        status: 'pending'
    };

    state.characters.push(newChar);
    saveState();
    setView('select');
};

window.setPanel = (panelName) => {
    state.activePanel = panelName;
    render();
};

window.handleStaffDecision = (charId, decision) => {
    const charIndex = state.characters.findIndex(c => c.id === charId);
    if (charIndex > -1) {
        state.characters[charIndex].status = decision;
        saveState();
        render(); // Re-render to update list
    }
};

// --- Main Loop ---

const render = () => {
    let html = '';
    switch (state.view) {
        case 'login': html = renderLogin(); break;
        case 'select': html = renderCharSelect(); break;
        case 'create': html = renderCharCreate(); break;
        case 'hub': html = renderHub(); break;
    }
    appContainer.innerHTML = html;
    renderIcons();
};

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    if (state.user) {
        if (state.selectedChar) {
            setView('hub');
        } else {
            setView('select');
        }
    } else {
        setView('login');
    }
});
