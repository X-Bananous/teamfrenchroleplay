/**
 * TFRP Core Logic
 * Stack: HTML5, CSS3, Vanilla JS
 * Design: Apple Liquid Glass Dark
 */

// --- Configuration & Constants ---
const CONFIG = {
    SUPABASE_URL: 'https://nitlrwmgoddqabasavrg.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdGxyd21nb2RkcWFiYXNhdnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Mzg3NTIsImV4cCI6MjA3OTMxNDc1Mn0.Y5BFeTuv-dxLpf9ocqyhaWMLLCwlKf-bPDgpWq0o8oU',
    APP_NAME: 'TFRP',
    VERSION: '2.0.0 (Glass)'
};

// --- Global State ---
const state = {
    user: JSON.parse(localStorage.getItem('tfrp_user')) || null,
    characters: [], // Loaded from DB or Mock
    activeCharacter: null,
    currentView: 'login', // login, select, create, hub
    activeHubPanel: 'main',
    isLoading: false,
    supabase: null
};

// --- Initialization ---
const initApp = async () => {
    // Init Supabase if available
    if (window.supabase) {
        state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    } else {
        console.warn('Supabase SDK not loaded. Running in full Mock mode.');
    }

    // Load initial view
    const appEl = document.getElementById('app');
    
    // Check Auth State
    if (state.user) {
        await loadCharacters();
        if (state.activeCharacter) {
            router('hub');
        } else {
            router('select');
        }
    } else {
        router('login');
    }

    // Fade in app
    requestAnimationFrame(() => {
        appEl.classList.remove('opacity-0');
    });
};

// --- Routing ---
const router = (viewName) => {
    state.currentView = viewName;
    render();
};

// --- Data Service (Supabase + Mock Fallback) ---
const loadCharacters = async () => {
    if (!state.user) return;
    
    setLoading(true);
    
    if (state.supabase) {
        try {
            const { data, error } = await state.supabase
                .from('characters')
                .select('*')
                .eq('user_id', state.user.id);
            
            if (!error && data) {
                state.characters = data;
            } else {
                console.log('Supabase fetch failed/empty, using mock data for demo');
                useMockCharacters();
            }
        } catch (e) {
            console.error(e);
            useMockCharacters();
        }
    } else {
        useMockCharacters();
    }
    
    setLoading(false);
    render(); // Re-render with data
};

const useMockCharacters = () => {
    // Only add mocks if empty
    if (state.characters.length === 0) {
        state.characters = [
            {
                id: 'char_mock_1',
                first_name: 'Tommy',
                last_name: 'Angelo',
                birth_date: '1985-04-12',
                birth_place: 'Lost Heaven',
                age: 38,
                status: 'accepted',
                user_id: state.user.id
            },
            {
                id: 'char_mock_2',
                first_name: 'Vito',
                last_name: 'Scaletta',
                birth_date: '1990-08-25',
                birth_place: 'Empire Bay',
                age: 33,
                status: 'pending',
                user_id: state.user.id
            }
        ];
    }
};

const createCharacter = async (formData) => {
    setLoading(true);
    
    const newChar = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        birth_date: formData.birth_date,
        birth_place: formData.birth_place,
        age: calculateAge(formData.birth_date),
        status: 'pending',
        user_id: state.user.id
    };

    if (state.supabase) {
        await state.supabase.from('characters').insert([newChar]);
    }
    
    // Add to local state for instant feedback (or mock mode)
    state.characters.push({ ...newChar, id: `temp_${Date.now()}` });
    
    setLoading(false);
    router('select');
};

const calculateAge = (dateString) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

// --- Actions ---
window.actions = {
    login: (type) => {
        // Simulating Auth
        state.user = {
            id: 'user_dev_001',
            username: type === 'discord' ? 'DiscordUser' : 'DevAdmin',
            avatar: 'https://ui-avatars.com/api/?name=User&background=0A84FF&color=fff',
            isStaff: true // Force staff for demo
        };
        localStorage.setItem('tfrp_user', JSON.stringify(state.user));
        loadCharacters().then(() => router('select'));
    },
    
    logout: () => {
        state.user = null;
        state.characters = [];
        state.activeCharacter = null;
        localStorage.removeItem('tfrp_user');
        router('login');
    },

    selectCharacter: (charId) => {
        const char = state.characters.find(c => c.id === charId);
        if (char && char.status === 'accepted') {
            state.activeCharacter = char;
            router('hub');
        }
    },

    goToCreate: () => {
        router('create');
    },

    submitCharacter: (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        
        if (calculateAge(data.birth_date) < 18) {
            alert('Votre personnage doit être majeur (18+).');
            return;
        }
        createCharacter(data);
    },

    setHubPanel: (panel) => {
        state.activeHubPanel = panel;
        render();
    },
    
    cancelCreate: () => {
        router('select');
    },

    // Staff Actions
    decideApplication: (id, status) => {
        const char = state.characters.find(c => c.id === id);
        if (char) {
            char.status = status;
            render(); // Refresh UI
            // In real app, sync to DB here
        }
    }
};

// --- Render Logic ---
const render = () => {
    const app = document.getElementById('app');
    
    // Loading overlay
    if (state.isLoading) {
        // Could add a spinner here
    }

    // View Switching
    switch (state.currentView) {
        case 'login':
            app.innerHTML = Views.Login();
            break;
        case 'select':
            app.innerHTML = Views.CharacterSelect();
            break;
        case 'create':
            app.innerHTML = Views.CharacterCreate();
            break;
        case 'hub':
            app.innerHTML = Views.Hub();
            break;
    }

    // Re-initialize icons
    if (window.lucide) lucide.createIcons();
};

const setLoading = (bool) => {
    state.isLoading = bool;
    // Optional: Global spinner toggle
};


// --- View Templates (Components) ---
const Views = {
    Login: () => `
        <div class="flex-1 flex items-center justify-center p-6 animate-fade-in relative overflow-hidden">
            <!-- Glass Container -->
            <div class="glass-panel w-full max-w-md p-10 rounded-[40px] flex flex-col items-center text-center relative z-10">
                
                <div class="mb-8 relative">
                    <div class="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-4 mx-auto">
                        <i data-lucide="gem" class="w-10 h-10 text-white"></i>
                    </div>
                    <h1 class="text-4xl font-bold tracking-tight text-white mb-2 text-glow">TFRP</h1>
                    <p class="text-blue-300/80 text-sm font-medium tracking-widest uppercase">Team French RolePlay</p>
                </div>

                <div class="w-full space-y-4">
                    <button onclick="actions.login('discord')" class="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white p-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg shadow-[#5865F2]/30">
                        <i data-lucide="gamepad-2" class="w-5 h-5"></i>
                        Connexion Discord
                    </button>
                    
                    <div class="relative py-2">
                        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-white/10"></div></div>
                        <div class="relative flex justify-center"><span class="bg-[#242426] px-3 text-xs text-gray-500 rounded-full">DEV MODE</span></div>
                    </div>

                    <button onclick="actions.login('dev')" class="glass-btn-secondary w-full p-3 rounded-2xl text-sm font-medium text-gray-400 hover:text-white flex items-center justify-center gap-2">
                        <i data-lucide="code" class="w-4 h-4"></i> Accès Rapide
                    </button>
                </div>

                <p class="mt-8 text-[10px] text-gray-600 max-w-[200px]">
                    En vous connectant, vous acceptez le règlement intérieur et les CGU de la communauté.
                </p>
            </div>
        </div>
    `,

    CharacterSelect: () => {
        const charsHtml = state.characters.map(char => {
            const isAccepted = char.status === 'accepted';
            const statusColor = isAccepted ? 'text-emerald-400 bg-emerald-500/10' : 
                                char.status === 'rejected' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10';
            const statusIcon = isAccepted ? 'check-circle' : char.status === 'rejected' ? 'x-circle' : 'clock';

            return `
                <div class="glass-card group p-6 rounded-[30px] w-full md:w-[340px] relative overflow-hidden flex flex-col h-[380px] hover:border-blue-500/30 transition-all">
                    <!-- Status Badge -->
                    <div class="absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusColor} border border-white/5">
                        <i data-lucide="${statusIcon}" class="w-3 h-3"></i>
                        ${char.status}
                    </div>

                    <!-- Avatar Placeholder -->
                    <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 mb-6 flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-500">
                        <span class="text-2xl font-bold text-gray-500">${char.first_name[0]}</span>
                    </div>

                    <!-- Info -->
                    <h3 class="text-2xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">${char.first_name} ${char.last_name}</h3>
                    <p class="text-gray-400 text-sm mb-6 flex items-center gap-2">
                        <i data-lucide="map-pin" class="w-3 h-3"></i> ${char.birth_place}
                    </p>

                    <div class="space-y-3 mt-auto">
                        <div class="flex justify-between text-xs text-gray-500 uppercase tracking-wider font-semibold px-1">
                            <span>Âge</span>
                            <span class="text-gray-300">${char.age} Ans</span>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 uppercase tracking-wider font-semibold px-1 border-t border-white/5 pt-3">
                            <span>Métier</span>
                            <span class="text-gray-300">Chômeur</span>
                        </div>
                    </div>

                    <div class="mt-6">
                        ${isAccepted ? 
                            `<button onclick="actions.selectCharacter('${char.id}')" class="glass-btn w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                                <i data-lucide="play" class="w-4 h-4 fill-current"></i> Jouer
                             </button>` : 
                            `<button disabled class="w-full py-3 rounded-xl bg-white/5 text-gray-500 text-sm font-semibold cursor-not-allowed border border-white/5">
                                Dossier en cours
                             </button>`
                        }
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="flex-1 flex flex-col p-8 animate-fade-in overflow-hidden relative">
                <div class="flex justify-between items-center mb-10 z-10 px-4">
                    <div>
                        <h2 class="text-3xl font-bold text-white tracking-tight">Mes Personnages</h2>
                        <p class="text-gray-400 text-sm mt-1">Sélectionnez une identité pour rejoindre Los Santos.</p>
                    </div>
                    <button onclick="actions.logout()" class="glass-btn-secondary p-3 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors">
                        <i data-lucide="log-out" class="w-5 h-5"></i>
                    </button>
                </div>

                <div class="flex-1 overflow-y-auto pb-20">
                    <div class="flex flex-wrap gap-8 justify-center items-center min-h-[50vh]">
                        ${charsHtml}
                        
                        <!-- Create New Button -->
                        ${state.characters.length < 3 ? `
                            <button onclick="actions.goToCreate()" class="group w-full md:w-[340px] h-[380px] rounded-[30px] border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 flex flex-col items-center justify-center transition-all cursor-pointer">
                                <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                                    <i data-lucide="plus" class="w-8 h-8 text-gray-400 group-hover:text-blue-400"></i>
                                </div>
                                <span class="text-gray-300 font-semibold group-hover:text-white">Créer un personnage</span>
                                <span class="text-xs text-gray-600 mt-1 uppercase tracking-widest">Slot Disponible</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    CharacterCreate: () => `
        <div class="flex-1 flex items-center justify-center p-6 animate-fade-in">
            <div class="glass-panel w-full max-w-2xl p-8 rounded-[40px] relative">
                <div class="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-white">Nouveau Citoyen</h2>
                        <p class="text-gray-400 text-xs uppercase tracking-widest mt-1">Formulaire d'immigration</p>
                    </div>
                    <button onclick="actions.cancelCreate()" class="glass-btn-secondary p-2 rounded-lg hover:bg-white/10">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <form onsubmit="actions.submitCharacter(event)" class="space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-gray-500 uppercase ml-1">Prénom</label>
                            <input type="text" name="first_name" required placeholder="John" class="glass-input w-full p-3 rounded-xl">
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-gray-500 uppercase ml-1">Nom</label>
                            <input type="text" name="last_name" required placeholder="Doe" class="glass-input w-full p-3 rounded-xl">
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-gray-500 uppercase ml-1">Date de naissance</label>
                            <input type="date" name="birth_date" required class="glass-input w-full p-3 rounded-xl text-gray-300">
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-gray-500 uppercase ml-1">Lieu de naissance</label>
                            <input type="text" name="birth_place" required placeholder="Los Santos Hospital" class="glass-input w-full p-3 rounded-xl">
                        </div>
                    </div>

                    <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start">
                        <i data-lucide="info" class="w-5 h-5 text-blue-400 shrink-0 mt-0.5"></i>
                        <p class="text-xs text-blue-100/80 leading-relaxed">
                            Vérifiez l'exactitude de vos informations. Le nom et le prénom ne pourront plus être modifiés après validation par le gouvernement (Staff).
                        </p>
                    </div>

                    <div class="pt-4 flex justify-end">
                        <button type="submit" class="glass-btn px-8 py-3 rounded-xl font-semibold flex items-center gap-2">
                            <i data-lucide="send" class="w-4 h-4"></i> Soumettre le dossier
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `,

    Hub: () => {
        // Sub-views for Hub
        let content = '';
        
        if (state.activeHubPanel === 'main') {
            content = `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                    <!-- Cards -->
                    <button onclick="actions.setHubPanel('services')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden">
                        <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            <i data-lucide="briefcase" class="w-6 h-6"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-xl font-bold text-white">Services Publics</h3>
                            <p class="text-sm text-gray-400 mt-1">LSPD, EMS, Gouvernement</p>
                        </div>
                    </button>

                    <button onclick="actions.setHubPanel('illicit')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden">
                        <div class="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div class="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 mb-4 group-hover:bg-red-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                            <i data-lucide="skull" class="w-6 h-6"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-xl font-bold text-white">Illégal</h3>
                            <p class="text-sm text-gray-400 mt-1">Darknet, Gangs, Marché Noir</p>
                        </div>
                    </button>

                    ${state.user.isStaff ? `
                    <button onclick="actions.setHubPanel('staff')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden border-purple-500/20">
                        <div class="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                            <i data-lucide="shield-alert" class="w-6 h-6"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-xl font-bold text-white">Administration</h3>
                            <p class="text-sm text-gray-400 mt-1">Gestion Joueurs & Tickets</p>
                        </div>
                    </button>
                    ` : ''}
                </div>
            `;
        } else if (state.activeHubPanel === 'staff') {
            const pending = state.characters.filter(c => c.status === 'pending');
            content = `
                <div class="animate-fade-in max-w-4xl mx-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold">Demandes en attente</h2>
                        <span class="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold">${pending.length}</span>
                    </div>
                    
                    <div class="space-y-4">
                        ${pending.length === 0 ? `<div class="p-8 text-center text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">Aucune demande.</div>` : ''}
                        
                        ${pending.map(p => `
                            <div class="glass-card p-4 rounded-xl flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-400">
                                        ${p.first_name[0]}
                                    </div>
                                    <div>
                                        <div class="font-bold text-white">${p.first_name} ${p.last_name}</div>
                                        <div class="text-xs text-gray-400">${p.age} ans • ${p.birth_place}</div>
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="actions.decideApplication('${p.id}', 'accepted')" class="bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 p-2 rounded-lg transition-colors"><i data-lucide="check" class="w-4 h-4"></i></button>
                                    <button onclick="actions.decideApplication('${p.id}', 'rejected')" class="bg-red-500/20 hover:bg-red-500/40 text-red-400 p-2 rounded-lg transition-colors"><i data-lucide="x" class="w-4 h-4"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
             content = `
                <div class="flex flex-col items-center justify-center h-[50vh] text-center animate-fade-in">
                    <div class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                        <i data-lucide="cone" class="w-10 h-10 text-gray-400"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">En Développement</h2>
                    <p class="text-gray-400 max-w-md">Le module <span class="text-blue-400 capitalize">${state.activeHubPanel}</span> est en cours de construction par l'équipe technique.</p>
                </div>
            `;
        }

        return `
            <div class="flex h-full w-full bg-[#050505]">
                <!-- Sidebar -->
                <aside class="w-80 glass-panel border-y-0 border-l-0 flex flex-col relative z-20">
                    <div class="p-6 border-b border-white/5">
                        <div class="flex items-center gap-3">
                            <img src="${state.user.avatar}" class="w-10 h-10 rounded-full border border-white/10">
                            <div class="overflow-hidden">
                                <h3 class="font-bold text-white truncate text-sm">${state.user.username}</h3>
                                <p class="text-xs text-blue-400 font-semibold uppercase tracking-wider">${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-4 space-y-2">
                        <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Navigation</div>
                        <button onclick="actions.setHubPanel('main')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm ${state.activeHubPanel === 'main' ? 'bg-white/10 text-white font-medium' : 'text-gray-400'} flex items-center gap-3">
                            <i data-lucide="layout-grid" class="w-4 h-4"></i> Tableau de bord
                        </button>
                    </div>

                    <div class="mt-auto p-4 border-t border-white/5 bg-black/20">
                         <div class="bg-gray-800/50 rounded-lg p-3 mb-4 border border-white/5">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs text-gray-400 font-medium">État Serveur</span>
                                <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                            </div>
                            <div class="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                                <div class="bg-blue-500 h-full w-[45%]"></div>
                            </div>
                            <div class="text-[10px] text-gray-500 mt-1 text-right">45 / 100 Joueurs</div>
                         </div>
                         <button onclick="actions.logout()" class="w-full glass-btn-secondary py-2 rounded-lg text-xs text-red-300 hover:bg-red-900/20 border-red-500/10">Déconnexion</button>
                    </div>
                </aside>

                <!-- Content -->
                <main class="flex-1 flex flex-col relative overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-br from-blue-900/5 to-purple-900/5 pointer-events-none"></div>
                    
                    <header class="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-md z-10">
                        <h1 class="text-xl font-bold text-white capitalize">
                            ${state.activeHubPanel === 'main' ? 'Los Santos' : state.activeHubPanel}
                        </h1>
                        <div class="flex items-center gap-4">
                            <div class="bg-black/40 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span class="text-xs font-mono text-gray-300">14:02 PM</span>
                            </div>
                        </div>
                    </header>

                    <div class="flex-1 overflow-y-auto p-8 relative z-0">
                        ${content}
                    </div>
                </main>
            </div>
        `;
    }
};

// Start App
window.addEventListener('DOMContentLoaded', initApp);