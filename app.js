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
    // REDIRECT_URI is handled by Supabase Auth Settings
    REQUIRED_GUILD_ID: '1279455759414857759',
    INVITE_URL: 'https://discord.gg/eBU7KKKGD5',
    
    // Game Rules
    MAX_SLOTS: 42,
    MAX_CHARS: 2,
    
    // Hardcoded Admins (Discord IDs) - LA FONDATION
    FOUNDER_IDS: [
        '814950374283804762', // Admin 1
        '1121157707341254656' // Admin 2
    ],

    PERMISSIONS_LIST: {
        manage_chars: 'Gérer les Personnages',
        economy: 'Gestion Économie',
        manage_staff: 'Gérer le Staff',
        bypass_login: 'Bypass Connexion',
        delete_chars: 'Supprimer Citoyens'
    }
};

// --- Global State ---
const state = {
    session: null, // Supabase Session
    user: null, // Custom User Object (merged discord + db profile)
    characters: [], // My characters
    activeCharacter: null, // Currently selected character
    
    // Staff Data
    pendingApplications: [],
    allCharactersAdmin: [],
    allProfiles: [], // For staff management

    // Bank Data
    transactions: [],

    currentView: 'login', // login, select, create, hub, access_denied, bank
    activeHubPanel: 'main',
    supabase: null,
    queueCount: Math.floor(Math.random() * 8) + 1
};

// --- Utilities ---
const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
};

const checkPerm = (perm) => {
    if (!state.user) return false;
    // Founders have all permissions
    if (CONFIG.FOUNDER_IDS.includes(state.user.discord_id)) return true;
    // Check DB permissions
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
                    Rejoignez l'économie réaliste de Los Angeles. <br>
                    Banque, Services Publics et Organisations Criminelles.
                </p>

                <div class="flex flex-col md:flex-row gap-4 w-full max-w-md md:max-w-none justify-center">
                    <button onclick="actions.login()" class="glass-btn h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-transform hover:scale-105 cursor-pointer shadow-[0_0_40px_rgba(10,132,255,0.3)]">
                        <i data-lucide="discord" class="w-6 h-6"></i>
                        Connexion Discord
                    </button>
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
                    Pour accéder au panel, vous devez rejoindre notre communauté.
                </div>

                <a href="${CONFIG.INVITE_URL}" target="_blank" class="w-full bg-white text-black hover:bg-gray-200 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer mb-3">
                    <i data-lucide="user-plus" class="w-5 h-5"></i>
                    Rejoindre le Discord
                </a>
                
                <button onclick="window.open('${CONFIG.INVITE_URL}', '_blank')" class="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer">
                    <i data-lucide="shield-question" class="w-5 h-5"></i>
                    Demande de Débannissement
                </button>

                <button onclick="actions.logout()" class="text-gray-500 text-xs hover:text-white transition-colors mt-6">
                    Se déconnecter
                </button>
            </div>
        </div>
    `,

    CharacterSelect: () => {
        const charsHtml = state.characters.map(char => {
            const isAccepted = char.status === 'accepted';
            const isRejected = char.status === 'rejected';
            const canBypass = checkPerm('bypass_login');
            
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
                const canPlay = isAccepted || canBypass;
                const btnText = isAccepted ? 'Accéder au Hub' : (canBypass ? 'Bypass Staff' : 'Dossier en cours');
                const btnClass = isAccepted ? 'glass-btn' : (canBypass ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/30' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5');

                btnHtml = `
                    <button 
                        ${canPlay ? `onclick="actions.selectCharacter('${char.id}')"` : 'disabled'} 
                        class="${btnClass} w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
                    >
                        ${canBypass && !isAccepted ? '<i data-lucide="shield-alert" class="w-4 h-4"></i>' : '<i data-lucide="play" class="w-4 h-4 fill-current"></i>'} 
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
                        <i data-lucide="wallet" class="w-3 h-3"></i> $${char.bank_balance + char.cash_balance}
                    </p>

                    <div class="space-y-3 mt-auto">
                         <div class="flex justify-between text-xs text-gray-500 uppercase tracking-wider font-semibold px-1">
                            <span>Banque</span>
                            <span class="text-emerald-400">$${char.bank_balance}</span>
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
                        <p class="text-gray-400 text-sm mt-1">Sélectionnez une identité pour rejoindre Los Angeles.</p>
                    </div>
                    <div class="flex items-center gap-4">
                         ${checkPerm('bypass_login') ? `
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
                        <p class="text-gray-400 text-xs uppercase tracking-widest mt-1">Compte bancaire inclus ($5000)</p>
                    </div>
                    <button onclick="actions.cancelCreate()" class="glass-btn-secondary p-2 rounded-lg hover:bg-white/10 cursor-pointer">
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
                            <input type="text" name="birth_place" required value="Los Angeles" class="glass-input w-full p-3 rounded-xl">
                        </div>
                    </div>

                    <div class="pt-4 flex justify-end">
                        <button type="submit" class="glass-btn px-8 py-3 rounded-xl font-semibold flex items-center gap-2 cursor-pointer">
                            <i data-lucide="save" class="w-4 h-4"></i> Créer Identité
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `,

    Hub: () => {
        let content = '';
        
        if (state.activeHubPanel === 'main') {
            content = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    
                    <!-- Bank Card -->
                    <button onclick="actions.loadBankPanel()" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer border-emerald-500/20">
                        <div class="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <i data-lucide="landmark" class="w-6 h-6"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-xl font-bold text-white">Ma Banque</h3>
                            <p class="text-sm text-gray-400 mt-1 mb-2">Gérer vos finances</p>
                            <div class="text-2xl font-mono text-emerald-400">${formatMoney(state.activeCharacter.bank_balance)}</div>
                        </div>
                    </button>

                    <!-- Services -->
                    <button onclick="actions.setHubPanel('services')" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden cursor-pointer">
                         <div class="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                            <i data-lucide="siren" class="w-6 h-6"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-xl font-bold text-white">Services Publics</h3>
                            <p class="text-sm text-gray-400 mt-1">Police, Sheriff, Fire & DOT</p>
                        </div>
                    </button>

                    <!-- Staff -->
                    ${checkPerm('manage_chars') || checkPerm('manage_staff') ? `
                    <button onclick="actions.loadStaffPanel()" class="glass-card group text-left p-6 rounded-[24px] h-64 flex flex-col justify-between relative overflow-hidden border-purple-500/20 cursor-pointer">
                        <div class="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div class="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                            <i data-lucide="shield-alert" class="w-6 h-6"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-xl font-bold text-white">Administration</h3>
                            <p class="text-sm text-gray-400 mt-1">Gestion Joueurs & Staff</p>
                            ${state.pendingApplications.length > 0 ? `<div class="absolute top-0 right-0 mt-6 mr-6 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>` : ''}
                        </div>
                    </button>
                    ` : ''}
                </div>
            `;
        } else if (state.activeHubPanel === 'bank') {
            const char = state.activeCharacter;
            content = `
                <div class="animate-fade-in max-w-5xl mx-auto space-y-8">
                    <!-- Bank Header -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="glass-panel p-8 rounded-[30px] flex items-center justify-between relative overflow-hidden">
                            <div class="absolute right-0 top-0 p-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <div>
                                <p class="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Compte Courant</p>
                                <h2 class="text-4xl font-mono text-white font-bold">${formatMoney(char.bank_balance)}</h2>
                            </div>
                            <div class="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                                <i data-lucide="landmark" class="w-8 h-8"></i>
                            </div>
                        </div>

                        <div class="glass-panel p-8 rounded-[30px] flex items-center justify-between">
                            <div>
                                <p class="text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Espèces (Poche)</p>
                                <h2 class="text-4xl font-mono text-white font-bold">${formatMoney(char.cash_balance)}</h2>
                            </div>
                            <div class="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                                <i data-lucide="wallet" class="w-8 h-8"></i>
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div class="glass-card p-6 rounded-2xl space-y-4">
                            <h3 class="font-bold flex items-center gap-2"><i data-lucide="arrow-down-circle" class="text-emerald-400"></i> Dépôt</h3>
                            <input type="number" id="deposit-amount" placeholder="Montant" class="glass-input w-full p-2 rounded-lg text-sm">
                            <button onclick="actions.bankDeposit()" class="glass-btn w-full py-2 rounded-lg text-sm font-bold">Déposer</button>
                        </div>
                        
                        <div class="glass-card p-6 rounded-2xl space-y-4">
                            <h3 class="font-bold flex items-center gap-2"><i data-lucide="arrow-up-circle" class="text-red-400"></i> Retrait</h3>
                            <input type="number" id="withdraw-amount" placeholder="Montant" class="glass-input w-full p-2 rounded-lg text-sm">
                            <button onclick="actions.bankWithdraw()" class="glass-btn-secondary w-full py-2 rounded-lg text-sm font-bold">Retirer</button>
                        </div>

                        <div class="glass-card p-6 rounded-2xl space-y-4 border-blue-500/20">
                            <h3 class="font-bold flex items-center gap-2"><i data-lucide="send" class="text-blue-400"></i> Virement</h3>
                            <select id="transfer-target" class="glass-input w-full p-2 rounded-lg text-sm">
                                <option value="">Choisir un bénéficiaire...</option>
                                ${state.allCharactersAdmin.filter(c => c.id !== char.id && c.status === 'accepted').map(c => `
                                    <option value="${c.id}">${c.first_name} ${c.last_name}</option>
                                `).join('')}
                            </select>
                            <input type="number" id="transfer-amount" placeholder="Montant" class="glass-input w-full p-2 rounded-lg text-sm">
                            <button onclick="actions.bankTransfer()" class="bg-blue-600 hover:bg-blue-500 text-white w-full py-2 rounded-lg text-sm font-bold transition-colors">Envoyer</button>
                        </div>
                    </div>

                    <!-- Transactions -->
                    <div class="glass-panel rounded-[24px] overflow-hidden">
                        <div class="p-6 border-b border-white/5">
                            <h3 class="font-bold text-white">Historique des transactions</h3>
                        </div>
                        <div class="max-h-64 overflow-y-auto custom-scrollbar">
                            <table class="w-full text-left">
                                <tbody class="divide-y divide-white/5 text-sm">
                                    ${state.transactions.map(t => {
                                        const isPos = t.type === 'deposit' || t.type === 'transfer_in';
                                        return `
                                            <tr class="hover:bg-white/5">
                                                <td class="p-4 text-gray-300">
                                                    <div class="font-medium text-white">${t.description}</div>
                                                    <div class="text-xs text-gray-500">${new Date(t.created_at).toLocaleString()}</div>
                                                </td>
                                                <td class="p-4 text-right font-mono font-bold ${isPos ? 'text-money-pos' : 'text-money-neg'}">
                                                    ${isPos ? '+' : '-'}${formatMoney(t.amount)}
                                                </td>
                                            </tr>
                                        `;
                                    }).join('')}
                                    ${state.transactions.length === 0 ? '<tr><td colspan="2" class="p-6 text-center text-gray-500">Aucune transaction récente.</td></tr>' : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } else if (state.activeHubPanel === 'staff') {
            if (!state.user.isStaff) return '';
            
            // Tab Logic for Staff
            const pending = state.pendingApplications || [];
            const allChars = state.allCharactersAdmin || [];
            
            content = `
                <div class="animate-fade-in max-w-6xl mx-auto space-y-12">
                    
                    ${checkPerm('manage_staff') ? `
                        <div class="glass-panel p-6 rounded-2xl border-purple-500/30">
                            <h2 class="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2"><i data-lucide="crown" class="w-5 h-5"></i> Gestion Staff (Fondateur)</h2>
                            <div class="overflow-x-auto">
                                <table class="w-full text-sm text-left">
                                    <thead><tr class="text-gray-500 border-b border-white/10"><th class="pb-2">Utilisateur</th><th class="pb-2">Permissions</th><th class="pb-2 text-right">Action</th></tr></thead>
                                    <tbody class="divide-y divide-white/5">
                                        ${state.allProfiles.filter(p => p.id !== state.user.id).map(p => `
                                            <tr>
                                                <td class="py-3 flex items-center gap-2">
                                                    <img src="${p.avatar_url}" class="w-6 h-6 rounded-full">
                                                    <span class="text-white font-medium">${p.username}</span>
                                                    ${CONFIG.FOUNDER_IDS.includes(p.discord_id) ? '<span class="badge-foundation text-[10px] px-2 rounded">FONDATION</span>' : ''}
                                                </td>
                                                <td class="py-3">
                                                    <div class="flex flex-wrap gap-1">
                                                        ${Object.entries(p.staff_permissions || {}).filter(([k,v]) => v).map(([k,v]) => `
                                                            <span class="badge-perm active">${k}</span>
                                                        `).join('')}
                                                    </div>
                                                </td>
                                                <td class="py-3 text-right">
                                                    ${!CONFIG.FOUNDER_IDS.includes(p.discord_id) ? `
                                                    <button onclick="actions.openPermsModal('${p.id}')" class="text-blue-400 hover:text-white text-xs underline cursor-pointer">Modifier Perms</button>
                                                    ` : ''}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `: ''}

                    <!-- Chars Management -->
                     <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="font-bold text-white">En Attente</h3>
                                <span class="bg-amber-500/20 text-amber-300 px-2 rounded-md text-xs font-bold">${pending.length}</span>
                            </div>
                            <div class="space-y-3">
                                ${pending.map(p => `
                                    <div class="glass-card p-4 rounded-xl flex items-center justify-between border-l-4 border-l-amber-500/50">
                                        <div>
                                            <div class="font-bold text-white">${p.first_name} ${p.last_name}</div>
                                            <div class="text-xs text-gray-400">@${p.discord_username}</div>
                                        </div>
                                        ${checkPerm('manage_chars') ? `
                                        <div class="flex gap-2">
                                            <button onclick="actions.decideApplication('${p.id}', 'accepted')" class="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white p-2 rounded transition"><i data-lucide="check" class="w-4 h-4"></i></button>
                                            <button onclick="actions.decideApplication('${p.id}', 'rejected')" class="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-2 rounded transition"><i data-lucide="x" class="w-4 h-4"></i></button>
                                        </div>` : ''}
                                    </div>
                                `).join('')}
                                ${pending.length === 0 ? '<p class="text-gray-500 text-sm">Rien à valider.</p>' : ''}
                            </div>
                        </div>

                        <div>
                            <h3 class="font-bold text-white mb-4">Base Citoyenne</h3>
                             <div class="glass-panel max-h-[500px] overflow-y-auto rounded-xl custom-scrollbar">
                                <table class="w-full text-left text-xs">
                                    <thead class="bg-white/5 sticky top-0"><tr><th class="p-3">Nom</th><th class="p-3">Argent</th><th class="p-3 text-right">Actions</th></tr></thead>
                                    <tbody class="divide-y divide-white/5">
                                        ${allChars.map(c => `
                                            <tr class="hover:bg-white/5">
                                                <td class="p-3">
                                                    <div class="font-medium text-white">${c.first_name} ${c.last_name}</div>
                                                    <div class="text-[10px] text-gray-500">@${c.discord_username}</div>
                                                </td>
                                                <td class="p-3 font-mono text-emerald-400">${formatMoney(c.bank_balance + c.cash_balance)}</td>
                                                <td class="p-3 text-right flex justify-end gap-2">
                                                    ${checkPerm('delete_chars') ? `
                                                    <button onclick="actions.adminDeleteCharacter('${c.id}', '${c.first_name}')" class="text-red-400 hover:text-white"><i data-lucide="trash-2" class="w-3 h-3"></i></button>
                                                    `:''}
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
             content = `
                <div class="flex flex-col items-center justify-center h-[50vh] text-center animate-fade-in">
                    <h2 class="text-2xl font-bold text-white mb-2">En Développement</h2>
                    <button onclick="actions.setHubPanel('main')" class="mt-8 glass-btn-secondary px-6 py-2 rounded-xl text-sm">Retour</button>
                </div>
            `;
        }

        return `
            <div class="flex h-full w-full bg-[#050505]">
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
                        <button onclick="actions.setHubPanel('main')" class="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm ${state.activeHubPanel === 'main' ? 'bg-white/10 text-white font-medium' : 'text-gray-400'} flex items-center gap-3 cursor-pointer">
                            <i data-lucide="layout-grid" class="w-4 h-4"></i> Tableau de bord
                        </button>
                        <button onclick="actions.loadBankPanel()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm ${state.activeHubPanel === 'bank' ? 'bg-white/10 text-white font-medium' : 'text-gray-400'} flex items-center gap-3 cursor-pointer">
                            <i data-lucide="landmark" class="w-4 h-4"></i> Banque & Espèces
                        </button>
                        ${state.user.isStaff ? `
                        <button onclick="actions.loadStaffPanel()" class="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-sm ${state.activeHubPanel === 'staff' ? 'bg-purple-500/10 text-purple-300 font-medium' : 'text-gray-400'} flex items-center gap-3 cursor-pointer">
                            <i data-lucide="shield" class="w-4 h-4"></i> Panel Staff
                        </button>
                        ` : ''}
                    </div>

                    <div class="mt-auto p-4 border-t border-white/5 bg-black/20">
                         <div class="grid grid-cols-2 gap-2">
                             <button onclick="actions.backToSelect()" class="w-full glass-btn-secondary py-2 rounded-lg text-xs text-gray-300 hover:bg-white/10 cursor-pointer flex items-center justify-center gap-1" title="Changer de personnage">
                                <i data-lucide="users" class="w-3 h-3"></i> Menu
                             </button>
                             <button onclick="actions.confirmLogout()" class="w-full glass-btn-secondary py-2 rounded-lg text-xs text-red-300 hover:bg-red-900/20 border-red-500/10 cursor-pointer flex items-center justify-center gap-1">
                                <i data-lucide="log-out" class="w-3 h-3"></i> Sortir
                             </button>
                         </div>
                    </div>
                </aside>

                <main class="flex-1 flex flex-col relative overflow-hidden">
                    <header class="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-md z-10">
                        <h1 class="text-xl font-bold text-white capitalize">
                            ${state.activeHubPanel === 'main' ? 'Los Angeles' : state.activeHubPanel}
                        </h1>
                        <div class="flex items-center gap-4">
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

// --- Logic ---
const initApp = async () => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    if (window.supabase) {
        state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        
        // Listen to Auth State
        state.supabase.auth.onAuthStateChange(async (event, session) => {
            state.session = session;
            if (session) {
                await handleAuthenticatedUser(session);
            } else {
                state.currentView = 'login';
                render();
                if(loadingScreen) loadingScreen.style.display = 'none';
                appEl.classList.remove('opacity-0');
            }
        });
    }
};

const handleAuthenticatedUser = async (session) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    try {
        const { user } = session;
        // Provider token to check guilds
        const providerToken = session.provider_token; 
        
        // 1. Check Guild Membership
        if (providerToken) {
            const guildRes = await fetch('https://discord.com/api/users/@me/guilds', {
                headers: { Authorization: `Bearer ${providerToken}` }
            });
            if (guildRes.ok) {
                const guilds = await guildRes.json();
                const isMember = guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID);
                if (!isMember) {
                    state.currentView = 'access_denied';
                    render();
                    if(loadingScreen) loadingScreen.style.display = 'none';
                    appEl.classList.remove('opacity-0');
                    return;
                }
            }
        }

        // 2. Fetch/Upsert Profile in DB
        const discordId = user.user_metadata.provider_id; // Usually available in meta
        const username = user.user_metadata.full_name || user.user_metadata.name;
        const avatar = user.user_metadata.avatar_url;

        // Upsert Profile
        await state.supabase.from('profiles').upsert({
            id: user.id, // Supabase UUID
            discord_id: discordId,
            username: username,
            avatar_url: avatar,
            updated_at: new Date()
        });

        // 3. Fetch Full Profile (Permissions)
        const { data: profile } = await state.supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        state.user = {
            id: user.id,
            discord_id: discordId,
            username: username,
            avatar: avatar,
            permissions: profile?.staff_permissions || {},
            isStaff: CONFIG.FOUNDER_IDS.includes(discordId) || (profile?.staff_permissions && Object.keys(profile.staff_permissions).length > 0)
        };

        await loadCharacters();
        router(state.characters.length > 0 ? 'select' : 'create');

    } catch (e) {
        console.error("Auth Error", e);
        actions.logout();
    }

    if(loadingScreen) loadingScreen.style.display = 'none';
    appEl.classList.remove('opacity-0');
};

const loadCharacters = async () => {
    if (!state.user) return;
    const { data } = await state.supabase.from('characters').select('*').eq('user_id', state.user.id);
    state.characters = data || [];
};

const loadTransactions = async (charId) => {
    const { data } = await state.supabase
        .from('transactions')
        .select('*')
        .eq('character_id', charId)
        .order('created_at', { ascending: false })
        .limit(20);
    state.transactions = data || [];
};

const fetchStaffData = async () => {
    // 1. Pending Characters
    const { data: pending } = await state.supabase.from('characters').select('*').eq('status', 'pending');
    // Enrich with usernames
    if(pending) {
        state.pendingApplications = await enrichCharacters(pending);
    }

    // 2. All Characters (for list)
    const { data: all } = await state.supabase.from('characters').select('*');
    if(all) {
        state.allCharactersAdmin = await enrichCharacters(all);
    }

    // 3. All Profiles (for permission management)
    if(checkPerm('manage_staff')) {
        const { data: profiles } = await state.supabase.from('profiles').select('*');
        state.allProfiles = profiles || [];
    }
};

const enrichCharacters = async (chars) => {
    if(!chars.length) return [];
    const userIds = [...new Set(chars.map(c => c.user_id))];
    const { data: profiles } = await state.supabase.from('profiles').select('id, username').in('id', userIds);
    return chars.map(c => ({
        ...c,
        discord_username: profiles.find(p => p.id === c.user_id)?.username || 'Unknown'
    }));
};

const router = (view) => {
    state.currentView = view;
    render();
};

const render = () => {
    const app = document.getElementById('app');
    if (!app) return;
    
    let html = '';
    switch(state.currentView) {
        case 'login': html = Views.Login(); break;
        case 'access_denied': html = Views.AccessDenied(); break;
        case 'select': html = Views.CharacterSelect(); break;
        case 'create': html = Views.CharacterCreate(); break;
        case 'hub': html = Views.Hub(); break;
        default: html = Views.Login();
    }
    app.innerHTML = html;
    if (window.lucide) lucide.createIcons();
};

// --- Actions ---
window.actions = {
    login: async () => {
        const { error } = await state.supabase.auth.signInWithOAuth({
            provider: 'discord',
            options: { scopes: 'guilds' }
        });
        if (error) alert(error.message);
    },
    logout: async () => {
        await state.supabase.auth.signOut();
    },
    confirmLogout: () => {
        if(confirm("Déconnexion ?")) actions.logout();
    },
    backToSelect: () => {
        state.activeCharacter = null;
        router('select');
    },
    goToCreate: () => {
        if(state.characters.length >= CONFIG.MAX_CHARS) return alert("Limite atteinte");
        router('create');
    },
    cancelCreate: () => router('select'),
    
    selectCharacter: (id) => {
        const char = state.characters.find(c => c.id === id);
        if(char) {
            state.activeCharacter = char;
            state.activeHubPanel = 'main';
            router('hub');
        }
    },

    submitCharacter: async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const age = new Date().getFullYear() - new Date(fd.get('birth_date')).getFullYear();
        if(age < 13) return alert("Personnage trop jeune.");

        const { error } = await state.supabase.from('characters').insert({
            user_id: state.user.id,
            first_name: fd.get('first_name'),
            last_name: fd.get('last_name'),
            birth_date: fd.get('birth_date'),
            birth_place: fd.get('birth_place'),
            age: age,
            status: 'pending'
        });

        if(!error) {
            await loadCharacters();
            router('select');
        } else {
            alert(error.message);
        }
    },

    deleteCharacter: async (id) => {
        if(confirm("Supprimer ce personnage ?")) {
            await state.supabase.from('characters').delete().eq('id', id);
            await loadCharacters();
            render();
        }
    },

    // Hub Navigation
    setHubPanel: (panel) => {
        state.activeHubPanel = panel;
        render();
    },

    loadBankPanel: async () => {
        state.activeHubPanel = 'bank';
        await fetchAllCharacters(); // To populate transfer list
        await loadTransactions(state.activeCharacter.id);
        render();
    },

    loadStaffPanel: async () => {
        state.activeHubPanel = 'staff';
        await fetchStaffData();
        render();
    },

    // Bank Actions
    bankDeposit: async () => {
        const amount = parseInt(document.getElementById('deposit-amount').value);
        if(!amount || amount <= 0 || amount > state.activeCharacter.cash_balance) return alert("Montant invalide");

        const char = state.activeCharacter;
        const newCash = char.cash_balance - amount;
        const newBank = char.bank_balance + amount;

        // Optimistic update
        char.cash_balance = newCash;
        char.bank_balance = newBank;

        await state.supabase.from('characters').update({ cash_balance: newCash, bank_balance: newBank }).eq('id', char.id);
        await state.supabase.from('transactions').insert({ character_id: char.id, type: 'deposit', amount: amount, description: 'Dépôt Espèces' });
        
        await loadTransactions(char.id);
        render();
    },

    bankWithdraw: async () => {
        const amount = parseInt(document.getElementById('withdraw-amount').value);
        if(!amount || amount <= 0 || amount > state.activeCharacter.bank_balance) return alert("Montant invalide");

        const char = state.activeCharacter;
        const newCash = char.cash_balance + amount;
        const newBank = char.bank_balance - amount;

        char.cash_balance = newCash;
        char.bank_balance = newBank;

        await state.supabase.from('characters').update({ cash_balance: newCash, bank_balance: newBank }).eq('id', char.id);
        await state.supabase.from('transactions').insert({ character_id: char.id, type: 'withdraw', amount: amount, description: 'Retrait Banque' });
        
        await loadTransactions(char.id);
        render();
    },

    bankTransfer: async () => {
        const targetId = document.getElementById('transfer-target').value;
        const amount = parseInt(document.getElementById('transfer-amount').value);
        if(!targetId || !amount || amount <= 0 || amount > state.activeCharacter.bank_balance) return alert("Virement invalide");

        const source = state.activeCharacter;
        const targetName = document.getElementById('transfer-target').selectedOptions[0].text;

        // Update Source
        source.bank_balance -= amount;
        await state.supabase.from('characters').update({ bank_balance: source.bank_balance }).eq('id', source.id);
        await state.supabase.from('transactions').insert({ character_id: source.id, type: 'transfer_out', amount: amount, description: `Virement vers ${targetName}`, target_name: targetName });

        // Update Target (Blind write, assumes existence)
        // Note: Real world app should use RPC for atomicity
        const { data: tChar } = await state.supabase.from('characters').select('bank_balance').eq('id', targetId).single();
        if(tChar) {
            await state.supabase.from('characters').update({ bank_balance: tChar.bank_balance + amount }).eq('id', targetId);
            await state.supabase.from('transactions').insert({ character_id: targetId, type: 'transfer_in', amount: amount, description: `Virement de ${source.first_name} ${source.last_name}`, target_name: `${source.first_name} ${source.last_name}` });
        }

        await loadTransactions(source.id);
        render();
    },

    // Staff Actions
    decideApplication: async (id, status) => {
        if(!checkPerm('manage_chars')) return;
        await state.supabase.from('characters').update({ status: status }).eq('id', id);
        actions.loadStaffPanel();
    },

    adminDeleteCharacter: async (id, name) => {
        if(!checkPerm('delete_chars')) return;
        if(confirm(`Supprimer ${name} définitivement ?`)) {
            await state.supabase.from('characters').delete().eq('id', id);
            actions.loadStaffPanel();
        }
    },

    openPermsModal: async (profileId) => {
        if(!checkPerm('manage_staff')) return;
        
        const perms = prompt("Permissions JSON (manage_chars, economy, manage_staff, bypass_login, delete_chars):", '{"manage_chars": true}');
        if(perms) {
            try {
                const json = JSON.parse(perms);
                await state.supabase.from('profiles').update({ staff_permissions: json }).eq('id', profileId);
                actions.loadStaffPanel();
            } catch(e) {
                alert("JSON invalide");
            }
        }
    }
};

// Init
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
else initApp();