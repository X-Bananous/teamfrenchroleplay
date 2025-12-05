
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
    
    // Economy Data
    bankAccount: null,
    transactions: [],
    recipientList: [], // For transfers
    filteredRecipients: [], // For search bar
    selectedRecipient: null, // {id, name}
    
    // UI State
    currentView: 'login', // login, select, create, hub, access_denied
    activeHubPanel: 'main', // main, bank, services, illicit, staff
    activeStaffTab: 'applications', // applications, database, permissions
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

        // Search Bar Logic HTML
        const searchResultsHtml = state.filteredRecipients.length > 0 ? `
            <div class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar">
                ${state.filteredRecipients.map(r => `
                    <div onclick="actions.selectRecipient('${r.id}', '${r.first_name} ${r.last_name}')" class="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0">
                        <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">${r.first_name[0]}</div>
                        <div class="text-sm text-gray-200">${r.first_name} ${r.last_name}</div>
                    </div>
                `).join('')}
            </div>
        ` : '';

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
                            ${searchResultsHtml}
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
        // Only render if some staff permission exists
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
                ${hasPermission('can_manage_staff') ? `
                    <button onclick="actions.setStaffTab('permissions')" class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${state.activeStaffTab === 'permissions' ? 'bg-white/10 text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}">
                        Permissions
                    </button>
                ` : ''}
            </div>
        `;

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
                                        ${hasPermission('can_manage_economy') ? `
                                            <button onclick="actions.adminMoneyAdjust('${c.id}')" class="text-gray-500 hover:text-green-400 p-1" title="Eco Mod">
                                                <i data-lucide="dollar-sign" class="w-4 h-4"></i>
                                            </button>
                                        ` : ''}
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
            <div class="animate-fade-in max-w-5xl mx-auto">
                <div class="flex items-center gap-3 mb-6">
                    <div class="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                        <i data-lucide="shield-alert" class="w-6 h-6"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white">Administration</h2>
                </div>
                ${tabsHtml}
                ${content}
            </div>
        `;
    },

    Hub: () => {
        let content = '';
        
        if (state.activeHubPanel === 'main') {
            const showStaffCard = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;

            content = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    <!-- Bank Card -->
                    <button onclick="actions.setHubPanel('bank')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-emerald-500/20">
                        <div class="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <i data-lucide="landmark" class="w-6 h-6"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-xl font-bold text-white">Ma Banque</h3>
                            <p class="text-sm text-gray-400 mt-1">Solde, Retraits & Virements</p>
                        </div>
                    </button>

                    <!-- Services -->
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

                    <!-- Illicit -->
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

                    <!-- Staff Card (Conditional) -->
                    ${showStaffCard ? `
                    <button onclick="actions.setHubPanel('staff')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden border-purple-500/20 cursor-pointer">
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
        } else if (state.activeHubPanel === 'bank') {
            content = Views.Bank();
        } else if (state.activeHubPanel === 'staff') {
            content = Views.Staff();
        } else {
             content = `
                <div class="flex flex-col items-center justify-center h-[50vh] text-center animate-fade-in">
                    <div class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-pulse">
                        <i data-lucide="cone" class="w-10 h-10 text-gray-400"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-white mb-2">En Développement</h2>
                    <p class="text-gray-400 max-w-md">Le module <span class="text-blue-400 capitalize">${state.activeHubPanel}</span> est en cours de construction.</p>
                    <button onclick="actions.setHubPanel('main')" class="mt-8 glass-btn-secondary px-6 py-2 rounded-xl text-sm">Retour</button>
                </div>
            `;
        }

        // Sidebar Navigation Logic
        const navItem = (panel, icon, label, color = 'text-white') => {
            const isActive = state.activeHubPanel === panel;
            const bgClass = isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white';
            return `
                <button onclick="actions.setHubPanel('${panel}')" class="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3 cursor-pointer ${bgClass}">
                    <i data-lucide="${icon}" class="w-5 h-5 ${isActive ? color : ''}"></i>
                    ${label}
                </button>
            `;
        };

        const hasStaffAccess = Object.keys(state.user.permissions || {}).length > 0 || state.user.isFounder;

        return `
            <div class="flex h-full w-full bg-[#050505]">
                <!-- Updated Sidebar -->
                <aside class="w-72 glass-panel border-y-0 border-l-0 flex flex-col relative z-20">
                    <div class="p-6 border-b border-white/5">
                        <div class="flex items-center gap-3">
                            <img src="${state.user.avatar}" class="w-10 h-10 rounded-full border border-white/10">
                            <div class="overflow-hidden">
                                <h3 class="font-bold text-white truncate text-sm">${state.user.username}</h3>
                                <p class="text-xs text-blue-400 font-semibold uppercase tracking-wider">${state.activeCharacter.first_name} ${state.activeCharacter.last_name}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-4 space-y-2 flex-1">
                        <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Menu Principal</div>
                        ${navItem('main', 'layout-grid', 'Tableau de bord', 'text-blue-400')}
                        ${navItem('bank', 'landmark', 'Ma Banque', 'text-emerald-400')}
                        ${navItem('services', 'siren', 'Services Publics', 'text-blue-400')}
                        ${navItem('illicit', 'skull', 'Illégal', 'text-red-400')}
                        
                        ${hasStaffAccess ? `
                            <div class="my-4 border-t border-white/5"></div>
                            <div class="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Staff</div>
                            ${navItem('staff', 'shield-alert', 'Administration', 'text-purple-400')}
                        ` : ''}
                    </div>

                    <div class="p-4 bg-black/20 border-t border-white/5">
                         <div class="grid grid-cols-2 gap-2">
                             <button onclick="actions.backToSelect()" class="w-full glass-btn-secondary py-2 rounded-lg text-xs text-gray-300 hover:bg-white/10 cursor-pointer flex items-center justify-center gap-1" title="Changer de personnage">
                                <i data-lucide="users" class="w-3 h-3"></i> Persos
                             </button>
                             <button onclick="actions.confirmLogout()" class="w-full glass-btn-secondary py-2 rounded-lg text-xs text-red-300 hover:bg-red-900/20 border-red-500/10 cursor-pointer flex items-center justify-center gap-1">
                                <i data-lucide="log-out" class="w-3 h-3"></i> Sortir
                             </button>
                         </div>
                    </div>
                </aside>

                <!-- Content -->
                <main class="flex-1 flex flex-col relative overflow-hidden">
                    <header class="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-md z-10">
                        <h1 class="text-xl font-bold text-white capitalize">
                            ${state.activeHubPanel === 'main' ? 'Los Angeles' : state.activeHubPanel === 'bank' ? 'Banque Nationale' : state.activeHubPanel}
                        </h1>
                        <div class="flex items-center gap-4">
                            ${hasPermission('can_bypass_login') ? `
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

// --- Logic & Init ---
const initApp = async () => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    if (!appEl) return;

    if (window.supabase) {
        state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    } else {
        console.error("Supabase lib not loaded");
        return;
    }

    // --- POPUP HANDLER Logic ---
    // If this is the popup window receiving the callback
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const popupToken = fragment.get('access_token');
    const popupType = fragment.get('token_type');
    const expiresIn = fragment.get('expires_in');

    if (popupToken && window.opener) {
        // Send data back to main window
        window.opener.postMessage({ 
            type: 'DISCORD_AUTH_SUCCESS', 
            token: popupToken, 
            tokenType: popupType,
            expiresIn: expiresIn 
        }, window.location.origin);
        window.close();
        return;
    }

    // --- MAIN WINDOW Logic ---
    
    // Check Local Storage first (Persistence)
    const storedToken = localStorage.getItem('tfrp_access_token');
    const storedType = localStorage.getItem('tfrp_token_type');
    const storedExpiry = localStorage.getItem('tfrp_token_expiry');

    if (storedToken && storedExpiry && new Date().getTime() < parseInt(storedExpiry)) {
        console.log("Restoring session...");
        state.accessToken = storedToken;
        await handleDiscordCallback(storedToken, storedType);
    } else {
        // No valid session, show login
        state.currentView = 'login';
        render();
        setTimeout(() => {
            if(loadingScreen) loadingScreen.style.opacity = '0';
            appEl.classList.remove('opacity-0');
            setTimeout(() => loadingScreen?.remove(), 700);
        }, 800);
    }

    // Listener for Popup Message
    window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
            const { token, tokenType, expiresIn } = event.data;
            
            // Save to LocalStorage (7 days or discord expiry)
            const expiryTime = new Date().getTime() + (parseInt(expiresIn) * 1000);
            localStorage.setItem('tfrp_access_token', token);
            localStorage.setItem('tfrp_token_type', tokenType);
            localStorage.setItem('tfrp_token_expiry', expiryTime.toString());

            state.accessToken = token;
            state.isLoggingIn = false;
            await handleDiscordCallback(token, tokenType);
        }
    });
};

const handleDiscordCallback = async (token, type) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    try {
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `${type} ${token}` }
        });
        
        if (!userRes.ok) {
             // Token invalid/expired
             localStorage.removeItem('tfrp_access_token');
             throw new Error('Discord User Fetch Failed');
        }
        
        const discordUser = await userRes.json();

        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
             headers: { Authorization: `${type} ${token}` }
        });
        if (!guildsRes.ok) throw new Error('Discord Guilds Fetch Failed');
        const guilds = await guildsRes.json();
        
        const isMember = guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID);

        if (!isMember) {
            state.currentView = 'access_denied';
            render();
            if(loadingScreen) loadingScreen.style.opacity = '0';
            appEl.classList.remove('opacity-0');
            setTimeout(() => loadingScreen?.remove(), 700);
            return;
        }

        // Founders check
        let isFounder = CONFIG.ADMIN_IDS.includes(discordUser.id);

        const updates = {
            id: discordUser.id,
            username: discordUser.username,
            avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
            updated_at: new Date(),
        };

        await state.supabase.from('profiles').upsert(updates);
        
        // Fetch extended profile for permissions
        const { data: profile } = await state.supabase
            .from('profiles')
            .select('permissions')
            .eq('id', discordUser.id)
            .single();

        state.user = {
            id: discordUser.id,
            username: discordUser.global_name || discordUser.username,
            avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
            permissions: profile?.permissions || {},
            isFounder: isFounder
        };

        await loadCharacters();
        router(state.characters.length > 0 ? 'select' : 'create');

    } catch (e) {
        console.error("Auth Error:", e);
        actions.logout(); // Clear storage and reset
    }
    
    if(loadingScreen) loadingScreen.style.opacity = '0';
    appEl.classList.remove('opacity-0');
    setTimeout(() => loadingScreen?.remove(), 700);
};

const router = (viewName) => {
    state.currentView = viewName;
    render();
};

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
    
    // Focus search if it was active
    if (state.activeHubPanel === 'bank' && document.getElementById('recipient_search')) {
        const input = document.getElementById('recipient_search');
        if (state.filteredRecipients.length > 0 || (input && input.value)) {
           input.focus();
        }
    }
};

// --- Data Services ---

const loadCharacters = async () => {
    if (!state.user || !state.supabase) return;
    const { data, error } = await state.supabase
        .from('characters')
        .select('*')
        .eq('user_id', state.user.id);
    state.characters = error ? [] : data;
};

// Staff Data Fetchers
const fetchCharactersWithProfiles = async (statusFilter = null) => {
    if (!state.user || !state.supabase) return [];
    let query = state.supabase.from('characters').select('*');
    if (statusFilter) query = query.eq('status', statusFilter);
    const { data: chars } = await query;
    if (!chars || chars.length === 0) return [];

    const userIds = [...new Set(chars.map(c => c.user_id))];
    const { data: profiles } = await state.supabase.from('profiles').select('id, username, avatar_url').in('id', userIds);

    return chars.map(char => {
        const profile = profiles?.find(p => p.id === char.user_id);
        return {
            ...char,
            discord_username: profile ? profile.username : 'Unknown',
            discord_avatar: profile ? profile.avatar_url : null
        };
    });
};

const fetchPendingApplications = async () => {
    state.pendingApplications = await fetchCharactersWithProfiles('pending');
};

const fetchAllCharacters = async () => {
    state.allCharactersAdmin = await fetchCharactersWithProfiles(null);
};

// Economy Services
const fetchBankData = async (charId) => {
    // 1. Get Account
    // Use maybeSingle to prevent error on 0 rows
    let { data: bank, error } = await state.supabase
        .from('bank_accounts')
        .select('*')
        .eq('character_id', charId)
        .maybeSingle(); 
    
    // Create if doesn't exist (First time login)
    if (!bank) {
        const { data: newBank } = await state.supabase.from('bank_accounts').insert([{ character_id: charId, bank_balance: 5000, cash_balance: 500 }]).select().single();
        bank = newBank;
    }
    state.bankAccount = bank;

    // 2. Get Transactions (Sender OR Receiver)
    const { data: txs } = await state.supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${charId},receiver_id.eq.${charId}`)
        .order('created_at', { ascending: false })
        .limit(20);
    
    state.transactions = txs || [];

    // 3. Get Potential Recipients (All accepted characters, except myself)
    const { data: recipients } = await state.supabase
        .from('characters')
        .select('id, first_name, last_name')
        .eq('status', 'accepted')
        .neq('id', charId);
        
    state.recipientList = recipients || [];
};

// --- Actions ---
window.actions = {
    login: async () => {
        // Open Popup logic
        state.isLoggingIn = true;
        render();

        const scope = encodeURIComponent('identify guilds');
        const url = `https://discord.com/api/oauth2/authorize?client_id=${CONFIG.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(CONFIG.REDIRECT_URI)}&response_type=token&scope=${scope}`;
        
        // Open popup
        window.open(url, 'DiscordAuth', 'width=500,height=800,left=200,top=200');
    },
    
    confirmLogout: () => {
        if(confirm("Voulez-vous vraiment vous déconnecter ?")) {
            window.actions.logout();
        }
    },

    logout: async () => {
        state.user = null;
        state.accessToken = null;
        state.characters = [];
        localStorage.removeItem('tfrp_access_token');
        localStorage.removeItem('tfrp_token_type');
        localStorage.removeItem('tfrp_token_expiry');
        window.location.hash = '';
        router('login');
    },

    backToSelect: async () => {
        state.activeCharacter = null;
        state.bankAccount = null;
        // Refresh characters to check for deletions/edits
        await loadCharacters();
        router('select');
    },

    selectCharacter: async (charId) => {
        const char = state.characters.find(c => c.id === charId);
        if (char && char.status === 'accepted') {
            state.activeCharacter = char;
            state.activeHubPanel = 'main';
            router('hub');
        }
    },

    enterAsFoundation: () => {
        if (!hasPermission('can_bypass_login')) return;
        state.activeCharacter = {
            id: 'foundation-001',
            first_name: 'La',
            last_name: 'Fondation',
            age: 99,
            birth_place: 'Classified',
            status: 'accepted'
        };
        // Mock Bank for Foundation
        state.bankAccount = { bank_balance: 999999999, cash_balance: 999999999 };
        state.transactions = [];
        state.activeHubPanel = 'main';
        router('hub');
    },

    goToCreate: () => {
        if (state.characters.length >= CONFIG.MAX_CHARS) return;
        router('create');
    },

    submitCharacter: async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const today = new Date();
        const birthDate = new Date(data.birth_date);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

        if (age < 13) { alert('Personnage trop jeune (13+).'); return; }

        const newChar = {
            first_name: data.first_name,
            last_name: data.last_name,
            birth_date: data.birth_date,
            birth_place: data.birth_place,
            age: age,
            status: 'pending',
            user_id: state.user.id
        };

        const { error } = await state.supabase.from('characters').insert([newChar]);
        if (!error) {
            await loadCharacters();
            router('select');
        } else {
            alert("Erreur création: " + error.message);
        }
    },

    deleteCharacter: async (charId) => {
        if(!confirm("Supprimer ce personnage ?")) return;
        const { error } = await state.supabase.from('characters').delete().eq('id', charId).eq('user_id', state.user.id);
        if (!error) { await loadCharacters(); router('select'); }
    },

    setHubPanel: async (panel) => {
        state.activeHubPanel = panel;
        if (panel === 'bank' && state.activeCharacter) {
            // Reset search
            state.selectedRecipient = null;
            state.filteredRecipients = [];
            await fetchBankData(state.activeCharacter.id);
        } else if (panel === 'staff') {
            await actions.loadStaffPanel();
        }
        render();
    },

    loadStaffPanel: async () => {
        state.activeStaffTab = 'applications';
        await Promise.all([
            fetchPendingApplications(),
            fetchAllCharacters()
        ]);
        render();
    },
    
    setStaffTab: (tab) => {
        state.activeStaffTab = tab;
        render();
    },

    decideApplication: async (id, status) => {
        if (!hasPermission('can_approve_characters')) return;
        const { error } = await state.supabase.from('characters').update({ status: status }).eq('id', id);
        if (!error) {
            await fetchPendingApplications();
            await fetchAllCharacters();
            render(); 
        }
    },

    adminDeleteCharacter: async (id, name) => {
        if (!hasPermission('can_delete_characters')) return;
        if (!confirm(`ADMIN: Supprimer "${name}" ?`)) return;
        const { error } = await state.supabase.from('characters').delete().eq('id', id);
        if (!error) { await fetchAllCharacters(); await fetchPendingApplications(); render(); }
    },

    // --- Banking Actions ---
    
    searchRecipients: (query) => {
        if (!query) {
            state.filteredRecipients = [];
            render();
            return;
        }
        const lower = query.toLowerCase();
        state.filteredRecipients = state.recipientList.filter(r => 
            r.first_name.toLowerCase().includes(lower) || 
            r.last_name.toLowerCase().includes(lower)
        );
        render();
    },

    selectRecipient: (id, name) => {
        state.selectedRecipient = { id, name };
        state.filteredRecipients = [];
        render();
    },

    clearRecipient: () => {
        state.selectedRecipient = null;
        render();
    },

    bankDeposit: async (e) => {
        e.preventDefault();
        const amount = parseInt(new FormData(e.target).get('amount'));
        if (amount <= 0 || amount > state.bankAccount.cash_balance) return;

        const charId = state.activeCharacter.id;

        // DB Updates (Not transactional but sequential - okay for prototype)
        // 1. Update Account
        const { error } = await state.supabase
            .from('bank_accounts')
            .update({
                bank_balance: state.bankAccount.bank_balance + amount,
                cash_balance: state.bankAccount.cash_balance - amount
            })
            .eq('character_id', charId);
        
        if (error) { alert("Erreur dépôt"); return; }

        // 2. Log Transaction
        await state.supabase.from('transactions').insert({
            sender_id: charId,
            amount: amount,
            type: 'deposit'
        });

        await fetchBankData(charId);
        render();
    },

    bankWithdraw: async (e) => {
        e.preventDefault();
        const amount = parseInt(new FormData(e.target).get('amount'));
        if (amount <= 0 || amount > state.bankAccount.bank_balance) return;

        const charId = state.activeCharacter.id;

        // DB Updates
        const { error } = await state.supabase
            .from('bank_accounts')
            .update({
                bank_balance: state.bankAccount.bank_balance - amount,
                cash_balance: state.bankAccount.cash_balance + amount
            })
            .eq('character_id', charId);

        if (error) { alert("Erreur retrait"); return; }
        
        await state.supabase.from('transactions').insert({
            sender_id: charId,
            amount: amount,
            type: 'withdraw'
        });

        await fetchBankData(charId);
        render();
    },

    bankTransfer: async (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const amount = parseInt(data.get('amount'));
        const targetId = data.get('target_id');
        const description = data.get('description') || 'Virement';
        
        if (amount <= 0 || amount > state.bankAccount.bank_balance || !targetId) {
            alert("Montant invalide ou bénéficiaire manquant.");
            return;
        }

        // We use the RPC for money movement. 
        // NOTE: Standard 'transfer_money' RPC usually doesn't take description unless updated.
        // We will try to pass it, but if the SQL function signature doesn't match, it might error.
        // Ideally, update the SQL function to: transfer_money(sender, receiver, amt, desc)
        // For now, we will do the RPC then update the transaction row if possible, 
        // OR we just assume the SQL handles it if updated.
        
        // Strategy: Call RPC. If your SQL `transfer_money` takes 3 args, the 4th will be ignored or error.
        // If it errors, we fallback to 3 args.
        
        let error;
        
        // Attempt with description (Requires SQL update)
        /* 
        const rpcCall = await state.supabase.rpc('transfer_money', { 
            sender: state.activeCharacter.id, 
            receiver: targetId, 
            amt: amount,
            desc: description 
        });
        error = rpcCall.error;
        */

        // Since I cannot update your SQL here, I will use the standard 3-arg RPC to ensure safety,
        // BUT I will modify the JS to manually insert the transaction log with description 
        // instead of relying on the RPC to insert it.
        // Wait, the RPC inserts the transaction. That creates a problem for description.
        // BEST PRACTICE: Use the existing RPC. The description won't be saved until you update SQL.
        
        const rpcResult = await state.supabase.rpc('transfer_money', { 
            sender: state.activeCharacter.id, 
            receiver: targetId, 
            amt: amount
        });

        if (rpcResult.error) {
            alert("Erreur virement: " + rpcResult.error.message);
            return;
        }

        // HACK: Since we can't update SQL here to add description support to the RPC,
        // We will try to update the latest transaction for this user to add the description.
        // This is a race condition but sufficient for a prototype.
        const { data: lastTx } = await state.supabase
            .from('transactions')
            .select('id')
            .eq('sender_id', state.activeCharacter.id)
            .eq('type', 'transfer')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
        if (lastTx) {
            await state.supabase.from('transactions').update({ description: description }).eq('id', lastTx.id);
        }
        
        alert("Virement effectué avec succès.");
        state.selectedRecipient = null; // Clear selection
        await fetchBankData(state.activeCharacter.id);
        render();
    },

    // --- Staff Permission Logic ---

    adminLookupUser: async (e) => {
        e.preventDefault();
        const id = new FormData(e.target).get('discord_id');
        const container = document.getElementById('perm-editor-container');
        
        container.innerHTML = '<div class="loader-spinner w-6 h-6 border-2"></div>';

        const { data: profile } = await state.supabase.from('profiles').select('*').eq('id', id).single();
        
        if (!profile) {
            container.innerHTML = '<p class="text-red-400">Utilisateur introuvable.</p>';
            return;
        }

        const currentPerms = profile.permissions || {};

        const checkboxes = [
            { k: 'can_approve_characters', l: 'Valider Fiches' },
            { k: 'can_delete_characters', l: 'Supprimer Fiches' },
            { k: 'can_manage_economy', l: 'Gérer Économie' },
            { k: 'can_manage_staff', l: 'Gérer Staff' },
            { k: 'can_bypass_login', l: 'Bypass Login (Fondation)' }
        ].map(p => `
            <label class="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                <input type="checkbox" onchange="actions.updatePermission('${id}', '${p.k}', this.checked)" ${currentPerms[p.k] ? 'checked' : ''} class="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700">
                <span class="text-white text-sm font-medium">${p.l}</span>
            </label>
        `).join('');

        container.innerHTML = `
            <div class="flex items-center gap-4 mb-4">
                <img src="${profile.avatar_url || ''}" class="w-10 h-10 rounded-full">
                <span class="font-bold text-white">${profile.username}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                ${checkboxes}
            </div>
        `;
    },

    updatePermission: async (userId, permKey, value) => {
        if (!hasPermission('can_manage_staff')) return;

        // Fetch current to merge
        const { data: profile } = await state.supabase.from('profiles').select('permissions').eq('id', userId).single();
        const newPerms = { ...(profile.permissions || {}) };
        
        if (value) newPerms[permKey] = true;
        else delete newPerms[permKey];

        await state.supabase.from('profiles').update({ permissions: newPerms }).eq('id', userId);
    },

    cancelCreate: () => {
        router('select');
    },
    
    adminMoneyAdjust: async (charId) => {
        const amountStr = prompt("Montant à ajouter au compte (ou négatif pour retirer) :");
        if (!amountStr) return;
        const amount = parseInt(amountStr);
        if (isNaN(amount)) return;

        // 1. Get current bank
        const { data: bank, error: bankError } = await state.supabase
            .from('bank_accounts')
            .select('id, bank_balance')
            .eq('character_id', charId)
            .maybeSingle();

        if (!bank) {
            alert("Ce personnage n'a pas de compte bancaire actif.");
            return;
        }

        // 2. Update balance
        const newBalance = bank.bank_balance + amount;
        const { error: updateError } = await state.supabase
            .from('bank_accounts')
            .update({ bank_balance: newBalance })
            .eq('id', bank.id);

        if (updateError) {
            alert("Erreur update: " + updateError.message);
            return;
        }

        // 3. Log transaction
        await state.supabase.from('transactions').insert({
            sender_id: null,
            receiver_id: charId,
            amount: amount,
            type: 'admin_adjustment',
            description: 'Staff Intervention'
        });

        alert(`Solde mis à jour. Nouveau solde: $${newBalance}`);
        // Refresh view if needed
        if (state.activeStaffTab === 'database') {
             await fetchAllCharacters(); 
             render();
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
