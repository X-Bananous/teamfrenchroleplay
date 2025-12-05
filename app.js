
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
    user: null, // Données Discord + Permissions
    accessToken: null,
    
    // Character Data
    characters: [],
    activeCharacter: null, // The currently played character
    
    // Staff Data
    pendingApplications: [],
    allCharactersAdmin: [],
    economyModal: { // New state for economy management
        isOpen: false,
        targetId: null, // ID character or 'ALL'
        targetName: null
    },
    
    // Economy Data
    bankAccount: null,
    transactions: [],
    recipientList: [], // For transfers
    filteredRecipients: [], // For search bar
    selectedRecipient: null, // {id, name}
    
    // UI State
    currentView: 'login', // login, select, create, hub, access_denied
    activeHubPanel: 'main', // main, bank, services, illicit, staff
    activeStaffTab: 'applications', // applications, database, economy, permissions
    isLoggingIn: false, // UI state for popup login
    
    supabase: null,
    queueCount: Math.floor(Math.random() * 8) + 1
};

// --- Helpers ---
const hasPermission = (perm) => {
    if (!state.user) return false;
    if (state.user.isFounder) return true;
    return state.user.permissions && state.user.permissions[perm] === true;
};

// --- View Templates (Components) ---
const Views = {
    Login: () => `
        <div class="flex-1 flex flex-col relative overflow-hidden h-full w-full">
            <div class="landing-gradient-bg"></div>
            
            <nav class="relative z-10 w-full p-8 flex justify-between items-center animate-fade-in">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <i data-lucide="shield-check" class="w-5 h-5 text-white"></i>
                    </div>
                    <span class="font-bold text-xl tracking-tight">TFRP</span>
                </div>
                <a href="${CONFIG.INVITE_URL}" target="_blank" class="glass-btn-secondary px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer">
                    <i data-lucide="users" class="w-4 h-4"></i>
                    Rejoindre Discord
                </a>
            </nav>

            <div class="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 animate-slide-up">
                <div class="mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md inline-flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span class="text-xs font-medium text-gray-300 tracking-wide uppercase">Serveur Ouvert • ERLC Roblox</span>
                </div>
                
                <h1 class="landing-hero-text mb-6">
                    Team French<br>RolePlay
                </h1>
                
                <p class="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
                    L'expérience de jeu de rôle ultime à Los Angeles. <br class="hidden md:block">
                    Rejoignez une communauté passionnée, créez votre histoire et gravissez les échelons.
                </p>

                <div class="flex flex-col md:flex-row gap-4 w-full max-w-md md:max-w-none justify-center">
                    ${state.isLoggingIn ? `
                        <button disabled class="glass-btn h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 w-64">
                            <div class="loader-spinner w-5 h-5 border-2"></div>
                            Connexion...
                        </button>
                    ` : `
                        <button onclick="actions.login()" class="glass-btn h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-transform hover:scale-105 cursor-pointer shadow-[0_0_40px_rgba(10,132,255,0.3)]">
                            <i data-lucide="gamepad-2" class="w-6 h-6"></i>
                            Connexion Citoyen
                        </button>
                    `}
                    <a href="${CONFIG.INVITE_URL}" target="_blank" class="glass-btn-secondary h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-transform hover:scale-105 cursor-pointer bg-white/5 hover:bg-white/10">
                        <i data-lucide="message-circle" class="w-6 h-6"></i>
                        Communauté
                    </a>
                </div>
            </div>

            <div class="relative z-10 p-8 flex justify-center gap-12 text-center animate-fade-in opacity-60">
                <div>
                    <div class="text-2xl font-bold text-white">40+</div>
                    <div class="text-xs text-gray-500 uppercase tracking-widest">Joueurs</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-white">LA</div>
                    <div class="text-xs text-gray-500 uppercase tracking-widest">Map</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-white">RP</div>
                    <div class="text-xs text-gray-500 uppercase tracking-widest">Strict</div>
                </div>
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

            let btnHtml = '';
            
            if (isRejected) {
                btnHtml = `
                    <button onclick="actions.deleteCharacter('${char.id}')" class="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg">
                        <i data-lucide="trash-2" class="w-4 h-4"></i> Supprimer / Recommencer
                    </button>
                `;
            } else {
                const btnClass = isAccepted ? 'glass-btn' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5';
                const btnText = isAccepted ? 'Accéder au Hub' : 'Dossier en cours';

                btnHtml = `
                    <button 
                        ${isAccepted ? `onclick="actions.selectCharacter('${char.id}')"` : 'disabled'} 
                        class="${btnClass} w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                    >
                        <i data-lucide="${isAccepted ? 'play' : 'lock'}" class="w-4 h-4 ${isAccepted ? 'fill-current' : ''}"></i> 
                        ${btnText}
                    </button>
                `;
            }

            return `
                <div class="glass-card group p-6 rounded-[30px] w-full md:w-[340px] relative overflow-hidden flex flex-col h-[380px] hover:border-blue-500/30 transition-all">
                    <div class="absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${statusColor} border border-white/5">
                        <i data-lucide="${statusIcon}" class="w-3 h-3"></i>
                        ${char.status}
                    </div>

                    <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 mb-6 flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-500">
                        <span class="text-2xl font-bold text-gray-500">${char.first_name[0]}</span>
                    </div>

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

        const foundationCard = hasPermission('can_bypass_login') ? `
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
        ` : '';

        return `
            <div class="flex-1 flex flex-col p-8 animate-fade-in overflow-hidden relative h-full">
                <div class="flex justify-between items-center mb-10 z-10 px-4">
                    <div>
                        <h2 class="text-3xl font-bold text-white tracking-tight">Mes Citoyens</h2>
                        <p class="text-gray-400 text-sm mt-1">Gérez vos identités pour le serveur Roblox ERLC.</p>
                    </div>
                    <div class="flex items-center gap-4">
                         ${Object.keys(state.user.permissions || {}).length > 0 ? `
                            <div class="px-4 py-2 badge-staff rounded-xl text-xs font-bold flex items-center gap-2">
                                <i data-lucide="shield" class="w-4 h-4"></i> Staff
                            </div>
                        ` : ''}
                        <button onclick="actions.confirmLogout()" class="glass-btn-secondary p-3 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer">
                            <i data-lucide="log-out" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto pb-20 custom-scrollbar">
                    <div class="flex flex-wrap gap-8 justify-center items-center min-h-[50vh]">
                        ${foundationCard}
                        ${charsHtml}
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

    // --- Sub-Views for Hub Area ---
    
    Bank: () => {
        if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full"><div class="loader-spinner mb-4"></div>Création du compte bancaire en cours...</div>';
        
        const historyHtml = state.transactions.length > 0 
            ? state.transactions.map(t => {
                let icon, color, label, sign;
                const desc = t.description ? `<div class="text-[10px] text-gray-500 italic mt-0.5">"${t.description}"</div>` : '';

                if (t.type === 'deposit') {
                    icon = 'arrow-down-left';
                    color = 'text-emerald-400';
                    label = 'Dépôt d\'espèces';
                    sign = '+';
                } else if (t.type === 'withdraw') {
                    icon = 'arrow-up-right';
                    color = 'text-white';
                    label = 'Retrait d\'espèces';
                    sign = '-';
                } else if (t.type === 'transfer') {
                    if (t.receiver_id === state.activeCharacter.id) {
                        icon = 'arrow-down-left';
                        color = 'text-emerald-400';
                        label = 'Virement Reçu';
                        sign = '+';
                    } else {
                        icon = 'send';
                        color = 'text-red-400';
                        label = 'Virement Envoyé';
                        sign = '-';
                    }
                } else if (t.type === 'admin_adjustment') {
                    icon = 'shield-alert';
                    label = 'Ajustement Admin';
                    if (t.amount >= 0) {
                        color = 'text-emerald-400';
                        sign = '+';
                    } else {
                        color = 'text-red-400';
                        sign = '-';
                    }
                }

                return `
                    <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                                <i data-lucide="${icon}" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <div class="font-medium text-white">${label}</div>
                                <div class="text-xs text-gray-500">${new Date(t.created_at).toLocaleString()}</div>
                                ${desc}
                            </div>
                        </div>
                        <div class="font-mono font-bold ${color}">
                            ${sign} $${Math.abs(t.amount).toLocaleString()}
                        </div>
                    </div>
                `;
            }).join('') 
            : '<div class="text-center text-gray-500 py-8 italic">Aucune transaction récente.</div>';

        // NOTE: We don't render the results directly here to avoid re-render flicker. 
        // We render an empty container that JS updates.
        
        return `
            <div class="animate-fade-in space-y-8 max-w-5xl mx-auto">
                <!-- Header Balance -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="glass-card p-6 rounded-[30px] bg-gradient-to-br from-emerald-900/40 to-black border-emerald-500/20 relative overflow-hidden">
                        <div class="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
                        <div class="flex items-center gap-3 mb-2">
                            <i data-lucide="landmark" class="w-5 h-5 text-emerald-400"></i>
                            <span class="text-sm font-bold text-emerald-400 uppercase tracking-wider">Solde Bancaire</span>
                        </div>
                        <div class="text-4xl font-bold text-white tracking-tight">$ ${state.bankAccount.bank_balance.toLocaleString()}</div>
                        <p class="text-emerald-500/60 text-xs mt-2 font-mono">IBAN: TFRP-${state.activeCharacter.id.substring(0,6).toUpperCase()}</p>
                    </div>

                    <div class="glass-card p-6 rounded-[30px] border-white/10">
                         <div class="flex items-center gap-3 mb-2">
                            <i data-lucide="wallet" class="w-5 h-5 text-gray-400"></i>
                            <span class="text-sm font-bold text-gray-400 uppercase tracking-wider">Espèces (Poches)</span>
                        </div>
                        <div class="text-4xl font-bold text-white tracking-tight">$ ${state.bankAccount.cash_balance.toLocaleString()}</div>
                        <p class="text-gray-600 text-xs mt-2">Disponible pour dépôt</p>
                    </div>
                </div>

                <!-- Actions -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Deposit -->
                    <form onsubmit="actions.bankDeposit(event)" class="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                        <div class="flex items-center gap-2 text-white font-bold">
                            <i data-lucide="arrow-down-left" class="w-5 h-5 text-emerald-400"></i> Dépôt
                        </div>
                        <p class="text-xs text-gray-400">Espèces -> Banque</p>
                        <input type="number" name="amount" placeholder="Montant" min="1" max="${state.bankAccount.cash_balance}" class="glass-input p-3 rounded-lg w-full" required>
                        <button type="submit" class="glass-btn-secondary bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 py-2 rounded-lg font-semibold text-sm cursor-pointer transition-colors">Déposer</button>
                    </form>

                    <!-- Withdraw -->
                    <form onsubmit="actions.bankWithdraw(event)" class="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                        <div class="flex items-center gap-2 text-white font-bold">
                            <i data-lucide="arrow-up-right" class="w-5 h-5 text-white"></i> Retrait
                        </div>
                        <p class="text-xs text-gray-400">Banque -> Espèces</p>
                        <input type="number" name="amount" placeholder="Montant" min="1" max="${state.bankAccount.bank_balance}" class="glass-input p-3 rounded-lg w-full" required>
                        <button type="submit" class="glass-btn-secondary bg-white/5 hover:bg-white/10 py-2 rounded-lg font-semibold text-sm cursor-pointer transition-colors">Retirer</button>
                    </form>

                    <!-- Transfer (New Design) -->
                    <form onsubmit="actions.bankTransfer(event)" class="glass-panel p-6 rounded-2xl flex flex-col gap-4 relative" autocomplete="off">
                        <div class="flex items-center gap-2 text-white font-bold">
                            <i data-lucide="send" class="w-5 h-5 text-blue-400"></i> Virement
                        </div>
                        <p class="text-xs text-gray-400">Banque -> Autre Joueur</p>
                        
                        <!-- Search Bar Container -->
                        <div class="relative">
                            <input type="hidden" name="target_id" id="target_id" value="${state.selectedRecipient ? state.selectedRecipient.id : ''}" required>
                            <div class="relative">
                                <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                                <input type="text" 
                                       id="recipient_search"
                                       placeholder="Rechercher un citoyen..." 
                                       value="${state.selectedRecipient ? state.selectedRecipient.name : ''}"
                                       oninput="actions.searchRecipients(this.value)"
                                       class="glass-input p-3 pl-10 rounded-lg w-full text-sm placeholder-gray-500" autocomplete="off">
                                ${state.selectedRecipient ? `
                                    <button type="button" onclick="actions.clearRecipient()" class="absolute right-3 top-3 text-gray-500 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
                                ` : ''}
                            </div>
                            <!-- Container for dynamic results -->
                            <div id="search-results-container" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar hidden">
                                <!-- JS inserts content here -->
                            </div>
                        </div>

                        <input type="text" name="description" placeholder="Motif (ex: Achat véhicule)" maxlength="50" class="glass-input p-3 rounded-lg w-full text-sm">
                        <input type="number" name="amount" placeholder="Montant" min="1" max="${state.bankAccount.bank_balance}" class="glass-input p-3 rounded-lg w-full" required>
                        <button type="submit" class="glass-btn bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-blue-500/20 cursor-pointer transition-colors">Envoyer</button>
                    </form>
                </div>

                <!-- History -->
                <div class="glass-panel rounded-2xl p-6">
                    <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <i data-lucide="history" class="w-5 h-5 text-gray-400"></i> Historique des Transactions
                    </h3>
                    <div class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        ${historyHtml}
                    </div>
                </div>
            </div>
        `;
    },

    Staff: () => {
        const hasAnyPerm = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;
        if (!hasAnyPerm) return `<div class="p-8 text-red-500">Accès interdit.</div>`;

        let content = '';

        // TABS NAVIGATION
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

        // CONTENT
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
             content = `
                <div class="mb-8">
                    <div class="glass-card p-6 rounded-2xl border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 class="text-xl font-bold text-white flex items-center gap-2">
                                <i data-lucide="globe" class="w-5 h-5 text-emerald-400"></i>
                                Économie Globale
                            </h3>
                            <p class="text-sm text-gray-400 mt-1">
                                Appliquer un ajustement financier (Bonus ou Impôt) à <strong>tous les joueurs</strong> du serveur.
                            </p>
                        </div>
                        <button onclick="actions.openEconomyModal('ALL')" class="glass-btn bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 whitespace-nowrap">
                            <i data-lucide="settings-2" class="w-4 h-4"></i>
                            Gérer l'Économie Globale
                        </button>
                    </div>
                </div>

                <div class="glass-panel overflow-hidden rounded-xl">
                    <div class="p-4 border-b border-white/5 bg-white/5">
                        <h4 class="font-bold text-white text-sm uppercase tracking-wide">Gestion Individuelle</h4>
                    </div>
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-white/5 text-xs uppercase text-gray-400 font-semibold tracking-wider">
                            <tr>
                                <th class="p-4 border-b border-white/10">Citoyen</th>
                                <th class="p-4 border-b border-white/10">Propriétaire</th>
                                <th class="p-4 border-b border-white/10 text-right">Gérer</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm divide-y divide-white/5">
                            ${allChars.map(c => `
                                <tr class="hover:bg-white/5 transition-colors">
                                    <td class="p-4 font-medium text-white">${c.first_name} ${c.last_name}</td>
                                    <td class="p-4 text-blue-300">@${c.discord_username}</td>
                                    <td class="p-4 text-right">
                                        <button onclick="actions.openEconomyModal('${c.id}', '${c.first_name} ${c.last_name}')" class="glass-btn-secondary px-3 py-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20 text-xs font-bold inline-flex items-center gap-2 transition-all">
                                            <i data-lucide="coins" class="w-3 h-3"></i> Modifier
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
    },

    Hub: () => {
