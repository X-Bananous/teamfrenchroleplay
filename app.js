/**
 * TFRP Core Logic
 * Modularized Structure
 */

import { CONFIG } from './modules/config.js';
import { state } from './modules/state.js';
import { router, render, hasPermission } from './modules/utils.js';
import { 
    loadCharacters, 
    fetchBankData, 
    fetchPendingApplications, 
    fetchAllCharacters 
} from './modules/services.js';

// Views
import { LoginView, AccessDeniedView } from './modules/views/login.js';
import { CharacterSelectView } from './modules/views/select.js';
import { CharacterCreateView } from './modules/views/create.js';
import { HubView } from './modules/views/hub.js';

// --- Global Actions (Attached to Window) ---
// We need these global because HTML onclick attributes reference them
window.actions = {
    login: async () => {
        state.isLoggingIn = true;
        render();

        const scope = encodeURIComponent('identify guilds');
        const url = `https://discord.com/api/oauth2/authorize?client_id=${CONFIG.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(CONFIG.REDIRECT_URI)}&response_type=token&scope=${scope}`;
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

    cancelCreate: () => router('select'),

    setHubPanel: async (panel) => {
        state.activeHubPanel = panel;
        if (panel === 'bank' && state.activeCharacter) {
            state.selectedRecipient = null;
            state.filteredRecipients = [];
            await fetchBankData(state.activeCharacter.id);
        } else if (panel === 'staff') {
            state.activeStaffTab = 'applications';
            await Promise.all([fetchPendingApplications(), fetchAllCharacters()]);
        }
        render();
    },

    // Staff Actions
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
            { k: 'can_manage_staff', l: 'Gérer Staff' }
            // Removed Bypass Login
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
        const { data: profile } = await state.supabase.from('profiles').select('permissions').eq('id', userId).single();
        const newPerms = { ...(profile.permissions || {}) };
        if (value) newPerms[permKey] = true; else delete newPerms[permKey];
        await state.supabase.from('profiles').update({ permissions: newPerms }).eq('id', userId);
    },

    // Banking Actions
    searchRecipients: (query) => {
        const container = document.getElementById('search-results-container');
        if (!container) return;
        if (!query) {
            state.filteredRecipients = [];
            container.classList.add('hidden');
            container.innerHTML = '';
            return;
        }
        const lower = query.toLowerCase();
        state.filteredRecipients = state.recipientList.filter(r => 
            r.first_name.toLowerCase().includes(lower) || 
            r.last_name.toLowerCase().includes(lower)
        );
        if (state.filteredRecipients.length > 0) {
            container.innerHTML = state.filteredRecipients.map(r => `
                <div onclick="actions.selectRecipient('${r.id}', '${r.first_name} ${r.last_name}')" class="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0">
                    <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">${r.first_name[0]}</div>
                    <div class="text-sm text-gray-200">${r.first_name} ${r.last_name}</div>
                </div>
            `).join('');
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
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
        const { error } = await state.supabase.from('bank_accounts').update({
            bank_balance: state.bankAccount.bank_balance + amount,
            cash_balance: state.bankAccount.cash_balance - amount
        }).eq('character_id', charId);
        if (error) { alert("Erreur dépôt"); return; }
        await state.supabase.from('transactions').insert({ sender_id: charId, amount: amount, type: 'deposit' });
        await fetchBankData(charId);
        render();
    },

    bankWithdraw: async (e) => {
        e.preventDefault();
        const amount = parseInt(new FormData(e.target).get('amount'));
        if (amount <= 0 || amount > state.bankAccount.bank_balance) return;
        const charId = state.activeCharacter.id;
        const { error } = await state.supabase.from('bank_accounts').update({
            bank_balance: state.bankAccount.bank_balance - amount,
            cash_balance: state.bankAccount.cash_balance + amount
        }).eq('character_id', charId);
        if (error) { alert("Erreur retrait"); return; }
        await state.supabase.from('transactions').insert({ sender_id: charId, amount: amount, type: 'withdraw' });
        await fetchBankData(charId);
        render();
    },

    bankTransfer: async (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const amount = parseInt(data.get('amount'));
        const targetId = data.get('target_id');
        const description = data.get('description') || 'Virement';
        
        if (amount <= 0 || amount > state.bankAccount.bank_balance || !targetId) { alert("Erreur données"); return; }
        
        const rpcResult = await state.supabase.rpc('transfer_money', { 
            sender: state.activeCharacter.id, 
            receiver: targetId, 
            amt: amount
        });

        if (rpcResult.error) { alert("Erreur: " + rpcResult.error.message); return; }

        const { data: lastTx } = await state.supabase.from('transactions').select('id').eq('sender_id', state.activeCharacter.id).eq('type', 'transfer').order('created_at', { ascending: false }).limit(1).single();
        if (lastTx) await state.supabase.from('transactions').update({ description: description }).eq('id', lastTx.id);
        
        alert("Virement effectué.");
        state.selectedRecipient = null;
        await fetchBankData(state.activeCharacter.id);
        render();
    },

    // Economy Management
    openEconomyModal: (targetId, targetName = null) => {
        state.economyModal = { isOpen: true, targetId, targetName };
        render();
    },
    
    closeEconomyModal: () => {
        state.economyModal = { isOpen: false, targetId: null, targetName: null };
        render();
    },
    
    executeEconomyAction: async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const mode = formData.get('mode');
        const amountVal = parseFloat(formData.get('amount'));
        const action = e.submitter.value;
        
        if (isNaN(amountVal) || amountVal <= 0) return alert("Montant invalide.");

        const targetId = state.economyModal.targetId;
        const isGlobal = targetId === 'ALL';
        
        if (isGlobal && !confirm(`CONFIRMATION: Vous allez modifier l'économie de TOUS les joueurs (${action} ${amountVal}${mode === 'percent' ? '%' : '$'}). Continuer ?`)) return;

        let bankAccountsToUpdate = [];
        if (isGlobal) {
            const { data, error } = await state.supabase.from('bank_accounts').select('*');
            if (error) return alert("Erreur fetch: " + error.message);
            bankAccountsToUpdate = data;
        } else {
             const { data } = await state.supabase.from('bank_accounts').select('*').eq('character_id', targetId).maybeSingle();
             if (data) bankAccountsToUpdate = [data];
             else return alert("Compte introuvable.");
        }

        let updatedCount = 0;
        for (const account of bankAccountsToUpdate) {
            let newBalance = Number(account.bank_balance);
            if (mode === 'fixed') {
                if (action === 'add') newBalance += amountVal; else newBalance -= amountVal;
            } else {
                const delta = newBalance * (amountVal / 100);
                if (action === 'add') newBalance += delta; else newBalance -= delta;
            }
            newBalance = Math.round(newBalance);

            await state.supabase.from('transactions').insert({
                sender_id: null,
                receiver_id: account.character_id,
                amount: (action === 'remove' ? -1 : 1) * (mode === 'fixed' ? amountVal : 0),
                type: 'admin_adjustment',
                description: `Staff Global: ${action} ${amountVal} ${mode}`
            });
            
            const { error } = await state.supabase.from('bank_accounts').update({ bank_balance: newBalance }).eq('id', account.id);
            if (!error) updatedCount++;
        }

        alert(`Opération terminée. ${updatedCount} comptes mis à jour.`);
        actions.closeEconomyModal();
        await fetchAllCharacters();
        render();
    }
};

// --- Core Renderer ---
const appRenderer = () => {
    const app = document.getElementById('app');
    if (!app) return;

    let htmlContent = '';
    switch (state.currentView) {
        case 'login': htmlContent = LoginView(); break;
        case 'access_denied': htmlContent = AccessDeniedView(); break;
        case 'select': htmlContent = CharacterSelectView(); break;
        case 'create': htmlContent = CharacterCreateView(); break;
        case 'hub': htmlContent = HubView(); break;
        default: htmlContent = LoginView();
    }

    app.innerHTML = htmlContent;

    if (window.lucide) {
        setTimeout(() => lucide.createIcons(), 50);
    }
};

// Listen for the custom event from router/utils
document.addEventListener('render-view', appRenderer);

// --- Initialization ---
const initApp = async () => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    if (window.supabase) {
        state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    }

    // Popup Handler
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const popupToken = fragment.get('access_token');
    if (popupToken && window.opener) {
        window.opener.postMessage({ 
            type: 'DISCORD_AUTH_SUCCESS', 
            token: popupToken, 
            tokenType: fragment.get('token_type'),
            expiresIn: fragment.get('expires_in') 
        }, window.location.origin);
        window.close();
        return;
    }

    // Main Auth Check
    const storedToken = localStorage.getItem('tfrp_access_token');
    const storedType = localStorage.getItem('tfrp_token_type');
    const storedExpiry = localStorage.getItem('tfrp_token_expiry');

    if (storedToken && storedExpiry && new Date().getTime() < parseInt(storedExpiry)) {
        console.log("Session restore...");
        state.accessToken = storedToken;
        await handleDiscordCallback(storedToken, storedType);
    } else {
        router('login');
        setTimeout(() => {
            if(loadingScreen) loadingScreen.style.opacity = '0';
            appEl.classList.remove('opacity-0');
            setTimeout(() => loadingScreen?.remove(), 700);
        }, 800);
    }

    // Listener for Popup
    window.addEventListener('message', async (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data.type === 'DISCORD_AUTH_SUCCESS') {
            const { token, tokenType, expiresIn } = event.data;
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
             localStorage.removeItem('tfrp_access_token');
             throw new Error('Discord User Fetch Failed');
        }
        
        const discordUser = await userRes.json();
        const guildsRes = await fetch('https://discord.com/api/users/@me/guilds', {
             headers: { Authorization: `${type} ${token}` }
        });
        const guilds = await guildsRes.json();
        
        if (!guilds.some(g => g.id === CONFIG.REQUIRED_GUILD_ID)) {
            router('access_denied');
            if(loadingScreen) loadingScreen.style.opacity = '0';
            appEl.classList.remove('opacity-0');
            setTimeout(() => loadingScreen?.remove(), 700);
            return;
        }

        let isFounder = CONFIG.ADMIN_IDS.includes(discordUser.id);
        await state.supabase.from('profiles').upsert({
            id: discordUser.id,
            username: discordUser.username,
            avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
            updated_at: new Date(),
        });
        
        const { data: profile } = await state.supabase.from('profiles').select('permissions').eq('id', discordUser.id).single();

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
        actions.logout();
    }
    
    if(loadingScreen) loadingScreen.style.opacity = '0';
    appEl.classList.remove('opacity-0');
    setTimeout(() => loadingScreen?.remove(), 700);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}