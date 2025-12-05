

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
    fetchAllCharacters,
    fetchStaffProfiles,
    searchProfiles,
    fetchInventory
} from './modules/services.js';
import { HEIST_DATA } from './modules/views/illicit.js';

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
        // Stop any heist timer
        if(state.heistTimerInterval) clearInterval(state.heistTimerInterval);
        state.activeHeist = null;
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
        
        // Data Fetching based on panel
        if (panel === 'bank' && state.activeCharacter) {
            state.selectedRecipient = null;
            state.filteredRecipients = [];
            await fetchBankData(state.activeCharacter.id);
        } else if (panel === 'assets' && state.activeCharacter) {
            state.inventoryFilter = '';
            await fetchInventory(state.activeCharacter.id);
        } else if (panel === 'illicit' && state.activeCharacter) {
            await fetchBankData(state.activeCharacter.id);
        } else if (panel === 'staff') {
            state.staffSearchQuery = ''; // Reset search
            
            // Default tab based on permission priority
            if (hasPermission('can_approve_characters')) state.activeStaffTab = 'applications';
            else if (hasPermission('can_manage_economy')) state.activeStaffTab = 'economy';
            else if (hasPermission('can_manage_staff')) state.activeStaffTab = 'permissions';
            else state.activeStaffTab = 'database'; 
            
            await Promise.all([
                fetchPendingApplications(), 
                fetchAllCharacters(),
                fetchStaffProfiles()
            ]);
        }
        render();
    },

    // Inventory / Assets Actions
    filterAssets: (query) => {
        state.inventoryFilter = query;
        render();
    },

    // Illicit / Black Market Actions
    setIllicitTab: (tab) => {
        state.activeIllicitTab = tab;
        render();
    },

    buyIllegalItem: async (itemName, price) => {
        if (!confirm(`Acheter ${itemName} pour $${price} en espèces ?`)) return;

        const charId = state.activeCharacter.id;
        const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', charId).single();
        
        if (!bank || bank.cash_balance < price) {
            alert("Erreur: Pas assez d'argent liquide.");
            return;
        }

        const { error: bankError } = await state.supabase
            .from('bank_accounts')
            .update({ cash_balance: bank.cash_balance - price })
            .eq('character_id', charId);

        if (bankError) { alert("Erreur transaction bancaire."); return; }

        const { data: existingItem } = await state.supabase.from('inventory').select('*').eq('character_id', charId).eq('name', itemName).maybeSingle();

        if (existingItem) {
            await state.supabase.from('inventory').update({ quantity: existingItem.quantity + 1 }).eq('id', existingItem.id);
        } else {
            await state.supabase.from('inventory').insert({
                character_id: charId,
                name: itemName,
                quantity: 1,
                estimated_value: price 
            });
        }

        await state.supabase.from('transactions').insert({
            sender_id: charId,
            amount: price,
            type: 'withdraw',
            description: `Achat Marché Noir: ${itemName}`
        });

        await fetchBankData(charId);
        alert(`Vous avez acheté: ${itemName}`);
        render();
    },

    // HEIST ACTIONS
    startHeist: (heistId, e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const groupSize = parseInt(data.get('group_size')) || 1;
        const heist = HEIST_DATA.find(h => h.id === heistId);
        
        if (!heist) return;
        if (!confirm(`Lancer le braquage : ${heist.name} ?\nDurée: ${heist.time/60} min\nGroupe: ${groupSize} personne(s)\n\nAttention: Ne fermez pas l'onglet.`)) return;

        const startTime = Math.floor(Date.now() / 1000);
        const endTime = startTime + heist.time;

        state.activeHeist = {
            id: heistId,
            name: heist.name,
            startTime,
            endTime,
            totalTime: heist.time,
            groupSize,
            rate: heist.rate,
            min: heist.min,
            max: heist.max
        };

        // Start local timer loop
        state.heistTimerInterval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            if (now >= state.activeHeist.endTime) {
                clearInterval(state.heistTimerInterval);
                render(); // Trigger "Finished" view
            } else {
                render(); // Update UI progress
            }
        }, 1000);

        render();
    },

    finishHeist: async () => {
        if (!state.activeHeist) return;
        
        const h = state.activeHeist;
        
        // Logic de réussite
        const roll = Math.random() * 100;
        const success = roll <= h.rate;
        
        let message = '';
        
        if (success) {
            // Calculate Loot
            const rawLoot = Math.floor(Math.random() * (h.max - h.min + 1)) + h.min;
            const myShare = Math.floor(rawLoot / h.groupSize);
            
            message = `RÉUSSITE !\n\nL'équipe a sécurisé $${rawLoot.toLocaleString()}.\nVotre part (${h.groupSize} pers) : $${myShare.toLocaleString()}`;
            
            // Add Cash
            const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', state.activeCharacter.id).single();
            await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance + myShare }).eq('character_id', state.activeCharacter.id);
            
            // Log
            await state.supabase.from('transactions').insert({
                sender_id: state.activeCharacter.id,
                amount: myShare,
                type: 'deposit',
                description: `Gain Braquage: ${h.name}`
            });

        } else {
            message = `ÉCHEC !\n\nL'opération a mal tourné. La police est intervenue et vous avez dû fuir sans le butin.`;
        }
        
        alert(message);
        
        // Reset
        state.activeHeist = null;
        if (state.heistTimerInterval) clearInterval(state.heistTimerInterval);
        
        await fetchBankData(state.activeCharacter.id);
        render();
    },

    // Staff Actions
    setStaffTab: (tab) => {
        state.activeStaffTab = tab;
        state.staffSearchQuery = ''; // Clear search when changing tabs
        render();
    },
    
    staffSearch: (query) => {
        state.staffSearchQuery = query;
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
        if (!hasPermission('can_manage_characters') && !state.user.isFounder) {
            alert("Permission manquante: Gérer Personnages");
            return;
        }
        if (!confirm(`ADMIN: Supprimer définitivement "${name}" ?`)) return;
        const { error } = await state.supabase.from('characters').delete().eq('id', id);
        if (!error) { await fetchAllCharacters(); await fetchPendingApplications(); render(); }
    },

    // INVENTORY MANAGEMENT ADMIN
    openInventoryModal: async (charId, charName) => {
        if (!hasPermission('can_manage_inventory')) return;
        
        // Fetch inventory
        await fetchInventory(charId); // Updates state.inventory
        
        state.inventoryModal = {
            isOpen: true,
            targetId: charId,
            targetName: charName,
            items: state.inventory
        };
        render();
    },

    closeInventoryModal: () => {
        state.inventoryModal.isOpen = false;
        render();
    },

    manageInventoryItem: async (action, itemId, itemName, event = null) => {
        if (event) event.preventDefault();
        
        const targetId = state.inventoryModal.targetId;
        
        if (action === 'remove') {
            if(!confirm("Supprimer l'objet ?")) return;
            // itemId is the row ID in inventory table
            await state.supabase.from('inventory').delete().eq('id', itemId);
        } else if (action === 'add') {
            const formData = new FormData(event.target);
            const name = formData.get('item_name');
            const qty = parseInt(formData.get('quantity'));
            const value = parseInt(formData.get('value'));
            
            await state.supabase.from('inventory').insert({
                character_id: targetId,
                name: name,
                quantity: qty,
                estimated_value: value
            });
        }
        
        // Refresh local inventory data
        await fetchInventory(targetId);
        state.inventoryModal.items = state.inventory;
        render();
    },

    // Permission Management
    // Updated to Banking Style Search
    searchProfilesForPerms: async (query) => {
        const container = document.getElementById('perm-search-dropdown');
        if (!container) return;
        
        if (!query) {
            container.classList.add('hidden');
            container.innerHTML = '';
            return;
        }

        const results = await searchProfiles(query);
        state.staffPermissionSearchResults = results;
        
        if (results.length > 0) {
             container.innerHTML = results.map(p => `
                <div onclick="actions.selectUserForPerms('${p.id}')" class="p-3 hover:bg-white/10 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0">
                    <img src="${p.avatar_url || ''}" class="w-8 h-8 rounded-full bg-gray-700">
                    <div>
                        <div class="font-bold text-sm text-white">${p.username}</div>
                        <div class="text-[10px] text-gray-500">${p.id}</div>
                    </div>
                </div>
            `).join('');
            container.classList.remove('hidden');
        } else {
             container.innerHTML = '<div class="p-3 text-xs text-gray-500 italic">Aucun résultat</div>';
             container.classList.remove('hidden');
        }
    },

    selectUserForPerms: async (userId) => {
        // Find profile in search results or fetch it
        let profile = state.staffPermissionSearchResults.find(p => p.id === userId);
        if(!profile) {
            // Try staff list
            profile = state.staffMembers.find(p => p.id === userId);
        }
        if(!profile) {
            const { data } = await state.supabase.from('profiles').select('*').eq('id', userId).single();
            profile = data;
        }
        
        if (!profile) return;
        
        // Hide dropdown
        const dropdown = document.getElementById('perm-search-dropdown');
        if(dropdown) dropdown.classList.add('hidden');

        actions.renderPermEditor(profile);
    },

    renderPermEditor: (profile) => {
        const container = document.getElementById('perm-editor-container');
        if (!container) return;

        const currentPerms = profile.permissions || {};
        const isSelf = profile.id === state.user.id;
        const isTargetFounder = CONFIG.ADMIN_IDS.includes(profile.id);
        const isDisabled = isSelf || isTargetFounder;
        
        let warningMsg = '';
        if (isSelf) warningMsg = '<div class="text-xs text-red-400 mt-2 bg-red-500/10 p-2 rounded">Vous ne pouvez pas modifier vos propres permissions.</div>';
        if (isTargetFounder) warningMsg = '<div class="text-xs text-red-400 mt-2 bg-red-500/10 p-2 rounded">Vous ne pouvez pas modifier les permissions de la Fondation.</div>';

        const checkboxes = [
            { k: 'can_approve_characters', l: 'Valider Fiches' },
            { k: 'can_manage_characters', l: 'Gérer Personnages (Suppr.)' },
            { k: 'can_manage_economy', l: 'Gérer Économie' },
            { k: 'can_manage_staff', l: 'Gérer Staff' },
            { k: 'can_manage_inventory', l: 'Gérer Inventaires' }
        ].map(p => `
            <label class="flex items-center gap-3 p-3 bg-white/5 rounded-lg ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'} transition-colors">
                <input type="checkbox" onchange="actions.updatePermission('${profile.id}', '${p.k}', this.checked)" 
                ${currentPerms[p.k] ? 'checked' : ''} 
                ${isDisabled ? 'disabled' : ''}
                class="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-700">
                <span class="text-white text-sm font-medium">${p.l}</span>
            </label>
        `).join('');

        container.innerHTML = `
            <div class="animate-fade-in bg-white/5 border border-white/5 p-4 rounded-xl mt-4">
                <div class="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                    <div class="flex items-center gap-3">
                        <img src="${profile.avatar_url || ''}" class="w-12 h-12 rounded-full border border-white/10">
                        <div>
                            <div class="font-bold text-white text-lg">${profile.username}</div>
                            <div class="text-xs text-gray-500">Modification des droits</div>
                        </div>
                    </div>
                    <button onclick="document.getElementById('perm-editor-container').innerHTML = ''" class="text-gray-500 hover:text-white"><i data-lucide="x" class="w-5 h-5"></i></button>
                </div>
                ${warningMsg}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    ${checkboxes}
                </div>
            </div>
        `;
    },

    updatePermission: async (userId, permKey, value) => {
        if (!hasPermission('can_manage_staff')) return;
        if (userId === state.user.id) return alert("Interdit: Modification de soi-même.");
        if (CONFIG.ADMIN_IDS.includes(userId)) return alert("Interdit: Modification fondateur.");

        const { data: profile } = await state.supabase.from('profiles').select('permissions').eq('id', userId).single();
        const newPerms = { ...(profile.permissions || {}) };
        if (value) newPerms[permKey] = true; else delete newPerms[permKey];
        
        await state.supabase.from('profiles').update({ permissions: newPerms }).eq('id', userId);
        
        await fetchStaffProfiles();
        render(); 
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