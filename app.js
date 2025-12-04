/**
 * TFRP Core Logic
 * Stack: HTML5, CSS3, Vanilla JS
 * Design: Apple Liquid Glass Dark
 */

// --- Configuration & Constants ---
const CONFIG = {
    SUPABASE_URL: 'https://nitlrwmgoddqabasavrg.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pdGxyd21nb2RkcWFiYXNhdnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Mzg3NTIsImV4cCI6MjA3OTMxNDc1Mn0.Y5BFeTuv-dxLpf9ocqyhaWMLLCwlKf-bPDgpWq0o8oU',
    
    // Discord Configuration
    DISCORD_CLIENT_ID: '1442491338552512584',
    REDIRECT_URI: 'https://x-bananous.github.io/teamfrenchroleplay/',
    REQUIRED_GUILD_ID: '1279455759414857759',
    INVITE_URL: 'https://discord.gg/eBU7KKKGD5',
    
    // Game Rules
    MAX_SLOTS: 42,
    MAX_CHARS: 2,
    
    // Hardcoded Admins (Discord IDs) - LA FONDATION
    ADMIN_IDS: [
        '814950374283804762', // Admin 1
        '1121157707341254656' // Admin 2
    ]
};

// --- Global State ---
const state = {
    user: null, // Données Discord + Metadata
    accessToken: null,
    characters: [],
    pendingApplications: [], // Liste pour le staff
    activeCharacter: null,
    currentView: 'login', // login, select, create, hub, access_denied
    activeHubPanel: 'main',
    supabase: null,
    queueCount: Math.floor(Math.random() * 8) + 1 // Simulation file d'attente
};

// --- View Templates (Components) ---
const Views = {
    Login: () => `
        <div class="flex-1 flex items-center justify-center p-6 animate-fade-in relative overflow-hidden h-full">
            <!-- Glass Container -->
            <div class="glass-panel w-full max-w-md p-10 rounded-[40px] flex flex-col items-center text-center relative z-10">
                
                <div class="mb-8 relative">
                    <div class="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 mb-4 mx-auto">
                        <i data-lucide="shield-check" class="w-10 h-10 text-white"></i>
                    </div>
                    <h1 class="text-4xl font-bold tracking-tight text-white mb-2 text-glow">TFRP</h1>
                    <p class="text-blue-300/80 text-sm font-medium tracking-widest uppercase">Team French RolePlay</p>
                    <p class="text-gray-500 text-xs mt-2 font-mono">Los Angeles • ERLC Roblox</p>
                </div>

                <div class="w-full space-y-4">
                    <button onclick="actions.login()" class="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white p-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg shadow-[#5865F2]/30 cursor-pointer">
                        <i data-lucide="gamepad-2" class="w-5 h-5"></i>
                        Connexion via Discord
                    </button>
                </div>

                <p class="mt-8 text-[10px] text-gray-600 max-w-[200px]">
                    Connexion sécurisée via Discord.
                    Vérification de présence serveur requise.
                </p>
            </div>
        </div>
    `,

    AccessDenied: () => `
        <div class="flex-1 flex items-center justify-center p-6 animate-fade-in relative overflow-hidden h-full">
            <div class="glass-panel border-red-500/30 w-full max-w-md p-10 rounded-[40px] flex flex-col items-center text-center relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                
                <div class="mb-6 relative">
                    <div class="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/20 mb-4 mx-auto animate-pulse">
                        <i data-lucide="lock" class="w-10 h-10 text-red-500"></i>
                    </div>
                    <h1 class="text-2xl font-bold text-white mb-2">Accès Refusé</h1>
                    <p class="text-gray-400 text-sm">Vous n'êtes pas membre du serveur Discord TFRP.</p>
                </div>

                <div class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-200 mb-8 w-full">
                    Pour accéder au panel et créer votre personnage, vous devez rejoindre notre communauté Discord.
                </div>

                <a href="${CONFIG.INVITE_URL}" target="_blank" class="w-full bg-white text-black hover:bg-gray-200 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer mb-3">
                    <i data-lucide="user-plus" class="w-5 h-5"></i>
                    Rejoindre le Discord
                </a>
                
                <button onclick="actions.logout()" class="text-gray-500 text-xs hover:text-white transition-colors mt-4">
                    Retour à l'accueil
                </button>
            </div>
        </div>
    `,

    CharacterSelect: () => {
        const charsHtml = state.characters.map(char => {
            const isAccepted = char.status === 'accepted';
            const isRejected = char.status === 'rejected';
            
            const statusColor = isAccepted ? 'text-emerald-400 bg-emerald-500/10' : 
                                isRejected ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10';
            const statusIcon = isAccepted ? 'check-circle' : isRejected ? 'x-circle' : 'clock';

            // Logique Bouton Principal
            let btnHtml = '';
            
            if (isRejected) {
                // Bouton Supprimer si rejeté
                btnHtml = `
                    <button onclick="actions.deleteCharacter('${char.id}')" class="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg">
                        <i data-lucide="trash-2" class="w-4 h-4"></i> Supprimer / Recommencer
                    </button>
                `;
            } else {
                // Logique normale
                const canPlay = isAccepted || state.user.isStaff;
                const btnText = isAccepted ? 'Accéder au Hub' : (state.user.isStaff ? 'Accès Staff (Force)' : 'Dossier en cours');
                const btnClass = isAccepted ? 'glass-btn' : (state.user.isStaff ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/30' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5');

                btnHtml = `
                    <button 
                        ${canPlay ? `onclick="actions.selectCharacter('${char.id}')"` : 'disabled'} 
                        class="${btnClass} w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                    >
                        ${state.user.isStaff && !isAccepted ? '<i data-lucide="shield-alert" class="w-4 h-4"></i>' : '<i data-lucide="play" class="w-4 h-4 fill-current"></i>'} 
                        ${btnText}
                    </button>
                `;
            }

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
                            <span>Statut</span>
                            <span class="text-gray-300">Civil</span>
                        </div>
                    </div>

                    <div class="mt-6">
                        ${btnHtml}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="flex-1 flex flex-col p-8 animate-fade-in overflow-hidden relative h-full">
                <div class="flex justify-between items-center mb-10 z-10 px-4">
                    <div>
                        <h2 class="text-3xl font-bold text-white tracking-tight">Mes Citoyens</h2>
                        <p class="text-gray-400 text-sm mt-1">Gérez vos identités pour le serveur Roblox ERLC.</p>
                    </div>
                    <div class="flex items-center gap-4">
                         ${state.user.isStaff ? `
                            <div class="px-4 py-2 badge-staff rounded-xl text-xs font-bold flex items-center gap-2">
                                <i data-lucide="shield" class="w-4 h-4"></i> Mode Staff
                            </div>
                        ` : ''}
                        <button onclick="actions.logout()" class="glass-btn-secondary p-3 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer">
                            <i data-lucide="log-out" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                    <div class="flex flex-wrap gap-8 justify-center items-center min-h-[50vh]">
                        
                        <!-- Foundation / Bypass Card (For Configured Admins only) -->
                        ${state.user.isStaff ? `
                             <button onclick="actions.enterAsFoundation()" class="glass-card group w-full md:w-[340px] h-[380px] rounded-[30px] flex flex-col items-center justify-center relative overflow-hidden hover:border-amber-400/50 transition-all cursor-pointer">
                                <div class="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors"></div>
                                <div class="w-20 h-20 rounded-2xl badge-foundation flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-pulse-slow">
                                    <i data-lucide="eye" class="w-10 h-10"></i>
                                </div>
                                <h3 class="text-2xl font-bold text-amber-400 mb-2">Accès Fondation</h3>
                                <p class="text-gray-400 text-xs uppercase tracking-widest mb-6">Contournement de Sécurité</p>
                                <div class="glass-btn-secondary bg-amber-500/10 border-amber-500/30 text-amber-300 px-6 py-2 rounded-xl text-xs font-bold uppercase">
                                    Entrer Immédiatement
                                </div>
                            </button>
                        ` : ''}

                        ${charsHtml}
                        
                        <!-- Create New Button -->
                        ${state.characters.length < CONFIG.MAX_CHARS ? `
                            <button onclick="actions.goToCreate()" class="group w-full md:w-[340px] h-[380px] rounded-[30px] border-2 border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 flex flex-col items-center justify-center transition-all cursor-pointer">
                                <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                                    <i data-lucide="plus" class="w-8 h-8 text-gray-400 group-hover:text-blue-400"></i>
                                </div>
                                <span class="text-gray-300 font-semibold group-hover:text-white">Créer un citoyen</span>
                                <span class="text-xs text-gray-600 mt-1 uppercase tracking-widest">Slot Disponible (${state.characters.length}/${CONFIG.MAX_CHARS})</span>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    CharacterCreate: () => `
        <div class="flex-1 flex items-center justify-center p-6 animate-fade-in h-full">
            <div class="glass-panel w-full max-w-2xl p-8 rounded-[40px] relative">
                <div class="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-white">Nouveau Citoyen</h2>
                        <p class="text-gray-400 text-xs uppercase tracking-widest mt-1">Formulaire d'immigration Los Angeles</p>
                    </div>
                    <button onclick="actions.cancelCreate()" class="glass-btn-secondary p-2 rounded-lg hover:bg-white/10 cursor-pointer">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>

                <form onsubmit="actions.submitCharacter(event)" class="space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-gray-500 uppercase ml-1">Prénom RP</label>
                            <input type="text" name="first_name" required placeholder="John" class="glass-input w-full p-3 rounded-xl">
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs font-bold text-gray-500 uppercase ml-1">Nom RP</label>
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
                            <input type="text" name="birth_place" required value="Los Angeles" placeholder="Los Angeles" class="glass-input w-full p-3 rounded-xl">
                        </div>
                    </div>

                    <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start">
                        <i data-lucide="info" class="w-5 h-5 text-blue-400 shrink-0 mt-0.5"></i>
                        <p class="text-xs text-blue-100/80 leading-relaxed">
                            Respectez le Lore Realistic RP d'ERLC. Pas de noms troll ou célébrités.
                            Limite de ${CONFIG.MAX_CHARS} personnages.
                        </p>
                    </div>

                    <div class="pt-4 flex justify-end">
                        <button type="submit" class="glass-btn px-8 py-3 rounded-xl font-semibold flex items-center gap-2 cursor-pointer">
                            <i data-lucide="save" class="w-4 h-4"></i> Sauvegarder (Cloud)
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
                    <button onclick="actions.setHubPanel('services')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer">
                        <div class="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            <i data-lucide="siren" class="w-6 h-6"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-xl font-bold text-white">Urgence & Services</h3>
                            <p class="text-sm text-gray-400 mt-1">Police, Sheriff, Fire & DOT</p>
                        </div>
                    </button>

                    <button onclick="actions.setHubPanel('illicit')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer">
                        <div class="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div class="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 mb-4 group-hover:bg-red-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                            <i data-lucide="skull" class="w-6 h-6"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-xl font-bold text-white">Monde Criminel</h3>
                            <p class="text-sm text-gray-400 mt-1">Mafias, Gangs & Marché Noir</p>
                        </div>
                    </button>

                    ${state.user.isStaff ? `
                    <button onclick="actions.loadStaffPanel()" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden border-purple-500/20 cursor-pointer">
                        <div class="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                            <i data-lucide="shield-alert" class="w-6 h-6"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-xl font-bold text-white">Administration</h3>
                            <p class="text-sm text-gray-400 mt-1">Gestion Joueurs & Whitelist</p>
                            ${state.pendingApplications.length > 0 ? `<div class="absolute top-0 right-0 mt-6 mr-6 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>` : ''}
                        </div>
                    </button>
                    ` : ''}
                </div>
            `;
        } else if (state.activeHubPanel === 'staff') {
            if (!state.user.isStaff) {
                 actions.setHubPanel('main');
                 return '';
            }
            const pending = state.pendingApplications || [];
            
            content = `
                <div class="animate-fade-in max-w-4xl mx-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold">Demandes en attente</h2>
                        <span class="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold">${pending.length}</span>
                    </div>
                    
                    <div class="space-y-4">
                        ${pending.length === 0 ? `<div class="p-8 text-center text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">Aucune demande en attente.</div>` : ''}
                        
                        ${pending.map(p => `
                            <div class="glass-card p-4 rounded-xl flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-400 border border-white/10 overflow-hidden">
                                        ${p.discord_avatar ? `<img src="${p.discord_avatar}" class="w-full h-full object-cover">` : p.first_name[0]}
                                    </div>
                                    <div>
                                        <div class="font-bold text-white">${p.first_name} ${p.last_name}</div>
                                        <div class="text-xs text-gray-400 flex items-center gap-2">
                                            <i data-lucide="user" class="w-3 h-3"></i> 
                                            <span class="text-blue-300">${p.discord_username || 'Inconnu'}</span>
                                            <span class="text-gray-600">•</span>
                                            <span>${p.age} ans</span>
                                            <span class="text-gray-600">•</span>
                                            <span>${p.birth_place}</span>
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
                </div>
            `;
        } else {
             content = `
                <div class="flex flex-col items-center justify-center h-[50vh] text-center animate-fade-in">
                    <div class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                        <i data-lucide="cone" class="w-10 h-10 text-gray-400"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">En Développement</h2>
                    <p class="text-gray-400 max-w-md">Le module <span class="text-blue-400 capitalize">${state.activeHubPanel}</span> est en cours de construction pour TFRP ERLC.</p>
                    <button onclick="actions.setHubPanel('main')" class="mt-8 glass-btn-secondary px-6 py-2 rounded-xl text-sm">Retour</button>
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
                        <button onclick="actions.setHubPanel('main')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm ${state.activeHubPanel === 'main' ? 'bg-white/10 text-white font-medium' : 'text-gray-400'} flex items-center gap-3 cursor-pointer">
                            <i data-lucide="layout-grid" class="w-4 h-4"></i> Tableau de bord
                        </button>
                    </div>

                    <div class="mt-auto p-4 border-t border-white/5 bg-black/20">
                         <div class="bg-gray-800/50 rounded-lg p-3 mb-4 border border-white/5">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-xs text-gray-400 font-medium">Serveur ERLC</span>
                                <span class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"></span>
                            </div>
                            <div class="w-full bg-gray-700 h-1 rounded-full overflow-hidden mb-2">
                                <div class="bg-red-500 h-full w-full"></div>
                            </div>
                            <div class="flex justify-between text-[10px] text-gray-500 font-mono">
                                <span>Joueurs: ${CONFIG.MAX_SLOTS}/${CONFIG.MAX_SLOTS}</span>
                                <span class="text-orange-400">File: ${state.queueCount}</span>
                            </div>
                         </div>
                         <button onclick="actions.logout()" class="w-full glass-btn-secondary py-2 rounded-lg text-xs text-red-300 hover:bg-red-900/20 border-red-500/10 cursor-pointer">Déconnexion</button>
                    </div>
                </aside>

                <!-- Content -->
                <main class="flex-1 flex flex-col relative overflow-hidden">
                    
                    <header class="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-md z-10">
                        <h1 class="text-xl font-bold text-white capitalize">
                            ${state.activeHubPanel === 'main' ? 'Los Angeles' : state.activeHubPanel}
                        </h1>
                        <div class="flex items-center gap-4">
                            ${state.user.isStaff ? `
                                <div class="badge-foundation px-3 py-1 rounded-full border flex items-center gap-2 shadow-lg">
                                    <i data-lucide="eye" class="w-3 h-3"></i>
                                    <span class="text-xs font-bold">FONDATION</span>
                                </div>
                            `: ''}
                            <div class="bg-black/40 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                                <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span class="text-xs font-mono text-gray-300">En Ligne</span>
                            </div>
                        </div>
                    </header>

                    <div class="flex-1 overflow-y-auto p-8 relative z-0 custom-scrollbar">
                        ${content}
                    </div>
                </main>
            </div>
        `;
    }
};

// --- Initialization ---
const initApp = async () => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    if (!appEl) return;

    // Init Supabase Client
    if (window.supabase) {
        state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    } else {
        console.error("Supabase lib not loaded");
        return;
    }

    // Check for Discord Callback in URL Hash
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = fragment.get('access_token');
    const tokenType = fragment.get('token_type');

    if (accessToken) {
        // Clear hash to clean URL
        window.history.replaceState(null, null, ' ');
        state.accessToken = accessToken;
        await handleDiscordCallback(accessToken, tokenType);
    } else {
        // No session, show login
        state.currentView = 'login';
        render();
        // Hide loader immediately for login
        setTimeout(() => {
            if(loadingScreen) loadingScreen.style.opacity = '0';
            appEl.classList.remove('opacity-0');
            setTimeout(() => loadingScreen?.remove(), 700);
        }, 800);
    }
};

const handleDiscordCallback = async (token, type) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    try {
        // 1. Fetch User Data from Discord
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `${type} ${token}` }
        });
        
        if (!userRes.ok) throw new Error('Discord User Fetch Failed');
        const discordUser = await userRes.json();

        // 2. Fetch Guilds to verify server membership
        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
             headers: { Authorization: `${type} ${token}` }
        });
        
        if (!guildsRes.ok) throw new Error('Discord Guilds Fetch Failed');
        const guilds = await guildsRes.json();
        
        const isMember = guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID);

        if (!isMember) {
            state.currentView = 'access_denied';
            render();
            // Transition Loader
            if(loadingScreen) loadingScreen.style.opacity = '0';
            appEl.classList.remove('opacity-0');
            setTimeout(() => loadingScreen?.remove(), 700);
            return;
        }

        // 3. Admin Check (Hardcoded IDs + DB check)
        let isStaff = CONFIG.ADMIN_IDS.includes(discordUser.id);

        // 4. Sync Profile with Supabase (Upsert)
        const updates = {
            id: discordUser.id, // Using Discord ID as Key
            username: discordUser.username,
            avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
            updated_at: new Date(),
        };

        // Attempt Upsert
        await state.supabase.from('profiles').upsert(updates);
        
        // Also check DB for staff status
        const { data: profile } = await state.supabase
            .from('profiles')
            .select('is_staff')
            .eq('id', discordUser.id)
            .single();

        if (profile && profile.is_staff) {
            isStaff = true;
        }

        // Set App State
        state.user = {
            id: discordUser.id,
            username: discordUser.global_name || discordUser.username,
            avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
            isStaff: isStaff
        };

        await loadCharacters();
        router(state.characters.length > 0 ? 'select' : 'create');

    } catch (e) {
        console.error("Auth Error:", e);
        state.currentView = 'login';
        render();
    }
    
    // Transition Loader out
    if(loadingScreen) loadingScreen.style.opacity = '0';
    appEl.classList.remove('opacity-0');
    setTimeout(() => loadingScreen?.remove(), 700);
};

// --- Routing ---
const router = (viewName) => {
    state.currentView = viewName;
    render();
};

// --- Render Logic ---
const render = () => {
    const app = document.getElementById('app');
    if (!app) return;

    let htmlContent = '';
    switch (state.currentView) {
        case 'login': htmlContent = Views.Login(); break;
        case 'access_denied': htmlContent = Views.AccessDenied(); break;
        case 'select': htmlContent = Views.CharacterSelect(); break;
        case 'create': htmlContent = Views.CharacterCreate(); break;
        case 'hub': htmlContent = Views.Hub(); break;
        default: htmlContent = Views.Login();
    }

    app.innerHTML = htmlContent;

    if (window.lucide) {
        setTimeout(() => lucide.createIcons(), 50);
    }
};

// --- Data Service ---
const loadCharacters = async () => {
    if (!state.user || !state.supabase) return;
    
    // Fetch characters where user_id matches the Discord ID
    const { data, error } = await state.supabase
        .from('characters')
        .select('*')
        .eq('user_id', state.user.id);
    
    if (!error && data) {
        state.characters = data;
    } else {
        console.error("Fetch chars error:", error);
        state.characters = [];
    }
};

// Fetch Pending Applications AND Join with Discord Profile info
const fetchPendingApplications = async () => {
    if (!state.user || !state.supabase) return;

    // 1. Get Pending Characters
    const { data: chars, error: charError } = await state.supabase
        .from('characters')
        .select('*')
        .eq('status', 'pending');
    
    if (charError || !chars) {
        state.pendingApplications = [];
        return;
    }

    // 2. Get the unique user IDs from these characters
    const userIds = [...new Set(chars.map(c => c.user_id))];

    if (userIds.length === 0) {
        state.pendingApplications = [];
        return;
    }

    // 3. Fetch profiles matching these IDs
    const { data: profiles, error: profileError } = await state.supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

    if (profileError) {
        console.warn("Could not fetch profiles for apps", profileError);
        // Fallback: show chars without extra info
        state.pendingApplications = chars;
        return;
    }

    // 4. Merge Data manually
    const enrichedApps = chars.map(char => {
        const profile = profiles.find(p => p.id === char.user_id);
        return {
            ...char,
            discord_username: profile ? profile.username : 'Unknown',
            discord_avatar: profile ? profile.avatar_url : null
        };
    });

    state.pendingApplications = enrichedApps;
};

const createCharacter = async (formData) => {
    if (state.characters.length >= CONFIG.MAX_CHARS) {
        alert(`Limite de ${CONFIG.MAX_CHARS} personnages atteinte.`);
        return;
    }

    const newChar = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        birth_date: formData.birth_date,
        birth_place: formData.birth_place,
        age: calculateAge(formData.birth_date),
        status: 'pending',
        user_id: state.user.id // Discord ID
    };

    const { data, error } = await state.supabase
        .from('characters')
        .insert([newChar])
        .select();

    if (error) {
        console.error("Save failed:", error);
        alert("Erreur lors de la sauvegarde. Vérifiez que la base de données accepte l'ID Discord (Texte) et non UUID.");
        return;
    }
    
    await loadCharacters();
    router('select');
};

const deleteCharacter = async (charId) => {
    if(!confirm("Êtes-vous sûr de vouloir supprimer ce personnage ? Cette action est irréversible.")) return;

    const { error } = await state.supabase
        .from('characters')
        .delete()
        .eq('id', charId)
        .eq('user_id', state.user.id); // Security check

    if (!error) {
        await loadCharacters();
        router('select');
    } else {
        alert("Erreur lors de la suppression: " + error.message);
    }
}

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
    login: async () => {
        // Manual Discord OAuth Flow
        const scope = encodeURIComponent('identify guilds');
        const url = `https://discord.com/api/oauth2/authorize?client_id=${CONFIG.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(CONFIG.REDIRECT_URI)}&response_type=token&scope=${scope}`;
        window.location.href = url;
    },
    
    logout: async () => {
        state.user = null;
        state.accessToken = null;
        state.characters = [];
        window.location.hash = '';
        router('login');
    },

    selectCharacter: (charId) => {
        const char = state.characters.find(c => c.id === charId);
        // Logic: Accepted OR Staff Bypass
        if (char && (char.status === 'accepted' || state.user.isStaff)) {
            state.activeCharacter = char;
            router('hub');
        }
    },

    enterAsFoundation: () => {
        if (!state.user.isStaff) return;
        // Mock Character for Foundation Access
        state.activeCharacter = {
            first_name: 'La',
            last_name: 'Fondation',
            age: 99,
            birth_place: 'Classified',
            status: 'accepted'
        };
        router('hub');
    },

    goToCreate: () => {
        if (state.characters.length >= CONFIG.MAX_CHARS) {
            alert("Limite de personnages atteinte.");
            return;
        }
        router('create');
    },

    submitCharacter: (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        if (calculateAge(data.birth_date) < 13) {
            alert('Votre personnage doit avoir au moins 13 ans pour le RP.');
            return;
        }
        createCharacter(data);
    },

    deleteCharacter: (id) => {
        deleteCharacter(id);
    },

    setHubPanel: (panel) => {
        state.activeHubPanel = panel;
        render();
    },

    loadStaffPanel: async () => {
        state.activeHubPanel = 'staff';
        // Show loading state implicitly or explicit loader
        await fetchPendingApplications();
        render();
    },
    
    cancelCreate: () => {
        router('select');
    },

    decideApplication: async (id, status) => {
        if (!state.user.isStaff) return;
        
        const { error } = await state.supabase
            .from('characters')
            .update({ status: status })
            .eq('id', id);

        if (!error) {
            // Refresh list immediately
            await fetchPendingApplications();
            render(); 
        } else {
            alert("Erreur update: " + error.message);
        }
    }
};

// Start App when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}