







/**
 * TFRP Core Logic
 * Modularized Structure
 */

import { CONFIG } from './modules/config.js';
import { state } from './modules/state.js';
import { router, render, hasPermission } from './modules/utils.js';
import { ui } from './modules/ui.js'; 
import { 
    loadCharacters, 
    fetchBankData, 
    fetchPendingApplications, 
    fetchAllCharacters,
    fetchStaffProfiles,
    searchProfiles,
    fetchInventory,
    fetchActiveHeistLobby,
    fetchAvailableLobbies,
    createHeistLobby,
    inviteToLobby,
    joinLobbyRequest,
    acceptLobbyMember,
    startHeistSync,
    fetchDrugLab,
    updateDrugLab,
    fetchServerStats,
    fetchPendingHeistReviews,
    adminResolveHeist,
    fetchGlobalHeists
} from './modules/services.js';
import { HEIST_DATA, DRUG_DATA } from './modules/views/illicit.js';
import { generateInventoryRow } from './modules/views/assets.js';

// Views
import { LoginView, AccessDeniedView } from './modules/views/login.js';
import { CharacterSelectView } from './modules/views/select.js';
import { CharacterCreateView } from './modules/views/create.js';
import { HubView } from './modules/views/hub.js';

// --- Global Actions (Attached to Window) ---
window.actions = {
    login: async () => {
        state.isLoggingIn = true;
        render();

        const scope = encodeURIComponent('identify guilds');
        const url = `https://discord.com/api/oauth2/authorize?client_id=${CONFIG.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(CONFIG.REDIRECT_URI)}&response_type=token&scope=${scope}`;
        window.open(url, 'DiscordAuth', 'width=500,height=800,left=200,top=200');
    },
    
    // FOUNDATION BYPASS (Added back per request)
    bypassLogin: async () => {
        if (!state.user || !CONFIG.ADMIN_IDS.includes(state.user.id)) return;
        
        // Simuler un personnage "Staff"
        state.activeCharacter = {
            id: 'STAFF_BYPASS',
            user_id: state.user.id,
            first_name: 'Administrateur',
            last_name: 'Fondation',
            status: 'accepted',
            alignment: 'legal'
        };
        state.activeHubPanel = 'staff'; // On force direct staff
        router('hub');
    },
    
    confirmLogout: () => {
        ui.showModal({
            title: "Déconnexion",
            content: "Voulez-vous vraiment vous déconnecter et retourner à l'accueil ?",
            confirmText: "Déconnexion",
            type: "danger",
            onConfirm: () => window.actions.logout()
        });
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
        if(state.heistTimerInterval) clearInterval(state.heistTimerInterval);
        state.activeHeist = null;
        state.activeHeistLobby = null; // Reset lobby state
        await loadCharacters();
        router('select');
    },

    selectCharacter: async (charId) => {
        const char = state.characters.find(c => c.id === charId);
        if (char && char.status === 'accepted') {
            state.activeCharacter = char;
            state.activeHubPanel = 'main';
            state.alignmentModalShown = false; // Reset for missing alignment check
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

        if (age < 13) { 
            ui.showToast('Personnage trop jeune (13 ans minimum).', 'error');
            return; 
        }

        const newChar = {
            first_name: data.first_name,
            last_name: data.last_name,
            birth_date: data.birth_date,
            birth_place: data.birth_place,
            age: age,
            status: 'pending',
            user_id: state.user.id,
            alignment: data.alignment // New field
        };

        const { error } = await state.supabase.from('characters').insert([newChar]);
        if (!error) {
            ui.showToast("Dossier d'immigration envoyé.", 'success');
            await loadCharacters();
            router('select');
        } else {
            ui.showToast("Erreur lors de la création.", 'error');
        }
    },

    // Post-creation Alignment Set (for legacy characters)
    setAlignment: async (alignment) => {
        const charId = state.activeCharacter.id;
        await state.supabase.from('characters').update({ alignment: alignment }).eq('id', charId);
        state.activeCharacter.alignment = alignment;
        ui.closeModal();
        render(); // Re-render Hub to show correct cards
    },

    deleteCharacter: async (charId) => {
        ui.showModal({
            title: "Suppression Personnage",
            content: "Cette action est irréversible. Toutes les données (banque, véhicules) seront perdues.",
            confirmText: "Supprimer Définitivement",
            type: "danger",
            onConfirm: async () => {
                const { error } = await state.supabase.from('characters').delete().eq('id', charId).eq('user_id', state.user.id);
                if (!error) { 
                    ui.showToast("Personnage supprimé.", 'info');
                    await loadCharacters(); 
                    router('select'); 
                } else {
                    ui.showToast("Erreur suppression.", 'error');
                }
            }
        });
    },

    cancelCreate: () => router('select'),

    setHubPanel: async (panel) => {
        state.activeHubPanel = panel;
        
        // --- DATA SYNC ON PANEL CHANGE ---
        if (panel === 'main') {
            await fetchGlobalHeists();
        } else if (panel === 'bank' && state.activeCharacter) {
            state.selectedRecipient = null;
            state.filteredRecipients = [];
            ui.showToast('Connexion bancaire...', 'info');
            await fetchBankData(state.activeCharacter.id);
        } else if (panel === 'assets' && state.activeCharacter) {
            state.inventoryFilter = '';
            ui.showToast('Inventaire chargé.', 'info');
            await fetchInventory(state.activeCharacter.id);
        } else if (panel === 'illicit' && state.activeCharacter) {
            ui.showToast('Connexion réseau crypté...', 'warning');
            state.activeIllicitTab = 'menu'; // Reset to menu
            state.blackMarketSearch = ''; // Reset filter
            await fetchBankData(state.activeCharacter.id);
            // Fetch status for menu summary
            await fetchActiveHeistLobby(state.activeCharacter.id);
            await fetchDrugLab(state.activeCharacter.id);
        } else if (panel === 'staff') {
            state.staffSearchQuery = ''; 
            
            if (hasPermission('can_approve_characters')) state.activeStaffTab = 'applications';
            else if (hasPermission('can_manage_economy')) state.activeStaffTab = 'economy';
            else if (hasPermission('can_manage_illegal')) state.activeStaffTab = 'illegal';
            else if (hasPermission('can_manage_staff')) state.activeStaffTab = 'permissions';
            else state.activeStaffTab = 'database'; 
            
            // Initial data fetch based on tab
            const promises = [
                fetchPendingApplications(), 
                fetchAllCharacters(),
                fetchStaffProfiles()
            ];
            
            if(hasPermission('can_manage_economy') || hasPermission('can_manage_illegal')) {
                promises.push(fetchServerStats());
            }
            if(hasPermission('can_manage_illegal')) {
                promises.push(fetchPendingHeistReviews());
            }
            
            await Promise.all(promises);
        }
        render();
    },

    // Inventory / Assets Actions
    handleInventorySearch: (query) => {
        state.inventoryFilter = query;
        const container = document.getElementById('inventory-list-container');
        if(container) {
            let items = [...state.inventory];
            if(state.bankAccount.cash_balance > 0) items.push({
                id: 'cash', name: 'Espèces', quantity: state.bankAccount.cash_balance, is_cash:true, estimated_value:1
            });
            
            const lower = query.toLowerCase();
            const filtered = items.filter(i => i.name.toLowerCase().includes(lower));
            
            // USE SHARED RENDER HELPER TO AVOID BUGS
            container.innerHTML = filtered.length > 0 
                ? filtered.map(generateInventoryRow).join('') 
                : '<div class="text-center text-gray-500 py-10">Rien trouvé.</div>';
            
            if(window.lucide) lucide.createIcons();
        }
    },
    
    deleteInventoryItem: async (itemId, itemName) => {
         ui.showModal({
            title: "Jeter Objet",
            content: `Voulez-vous vraiment jeter <b>${itemName}</b> ? Cette action est définitive.`,
            confirmText: "Jeter à la poubelle",
            type: "danger",
            onConfirm: async () => {
                await state.supabase.from('inventory').delete().eq('id', itemId);
                ui.showToast("Objet jeté.", 'info');
                await fetchInventory(state.activeCharacter.id);
                render(); // Re-render to update list and total value
            }
        });
    },
    
    // ID CARD ACTIONS
    openIdCard: () => {
        state.idCardModalOpen = true;
        render();
    },
    closeIdCard: () => {
        state.idCardModalOpen = false;
        render();
    },

    // Illicit / Black Market Actions
    setIllicitTab: async (tab) => {
        state.activeIllicitTab = tab;
        if (tab === 'heists') {
             await fetchActiveHeistLobby(state.activeCharacter.id);
        } else if (tab === 'drugs') {
             await fetchDrugLab(state.activeCharacter.id);
        }
        render();
    },
    
    searchBlackMarket: (query) => {
        state.blackMarketSearch = query;
        render();
        // Restore focus hack
        setTimeout(() => {
            const input = document.querySelector('input[placeholder*="Rechercher arme"]');
            if(input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }, 0);
    },

    buyIllegalItem: async (itemName, price) => {
        ui.showModal({
            title: "Marché Noir",
            content: `Confirmer l'achat de : <b>${itemName}</b> pour <span class="text-emerald-400">$${price}</span> ?`,
            confirmText: "Acheter (Discret)",
            onConfirm: async () => {
                const charId = state.activeCharacter.id;
                const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', charId).single();
                
                if (!bank || bank.cash_balance < price) {
                    ui.showToast("Pas assez de liquide.", 'error');
                    return;
                }

                const { error: bankError } = await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance - price }).eq('character_id', charId);
                if (bankError) return;

                const { data: existingItem } = await state.supabase.from('inventory').select('*').eq('character_id', charId).eq('name', itemName).maybeSingle();

                if (existingItem) {
                    await state.supabase.from('inventory').update({ quantity: existingItem.quantity + 1 }).eq('id', existingItem.id);
                } else {
                    await state.supabase.from('inventory').insert({
                        character_id: charId, name: itemName, quantity: 1, estimated_value: price 
                    });
                }

                await state.supabase.from('transactions').insert({ sender_id: charId, amount: price, type: 'withdraw', description: `Achat Marché Noir: ${itemName}` });
                await fetchBankData(charId);
                ui.showToast(`Objet reçu : ${itemName}`, 'success');
                render();
            }
        });
    },
    
    // --- DRUG SYSTEM ACTIONS ---
    buyLabComponent: async (type, price) => {
        const charId = state.activeCharacter.id;
        const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', charId).single();
         if (!bank || bank.cash_balance < price) {
            ui.showToast("Pas assez de liquide.", 'error');
            return;
        }

        ui.showModal({
            title: "Investissement",
            content: `Acheter cet élément pour <b>$${price}</b> ?`,
            confirmText: "Payer",
            onConfirm: async () => {
                await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance - price }).eq('character_id', charId);
                
                const updates = {};
                if(type === 'building') updates.has_building = true;
                if(type === 'equipment') updates.has_equipment = true;
                
                await updateDrugLab(updates);
                ui.showToast("Installation acquise.", 'success');
                await fetchBankData(charId); // refresh cash
                render();
            }
        });
    },

    startDrugAction: async (stage, e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const type = formData.get('drug_type');
        const amount = parseInt(formData.get('amount'));
        const lab = state.drugLab;

        // Validation Rules
        if (stage === 'harvest') {
            // Weekly Check
            const lastProd = lab.last_production_date ? new Date(lab.last_production_date) : null;
            if (lastProd) {
                const diffTime = Math.abs(new Date() - lastProd);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                if (diffDays < 7) {
                    ui.showToast("Limite atteinte (1x / Semaine).", 'error');
                    return;
                }
            }
        } else if (stage === 'process') {
            const stockKey = type === 'coke' ? 'stock_coke_raw' : 'stock_weed_raw';
            if ((lab[stockKey] || 0) < amount) {
                ui.showToast("Stock insuffisant.", 'error');
                return;
            }
        } else if (stage === 'sell') {
            const stockKey = type === 'coke' ? 'stock_coke_pure' : 'stock_weed_pure';
             if ((lab[stockKey] || 0) < amount) {
                ui.showToast("Stock insuffisant.", 'error');
                return;
            }
        }

        // Calculate Time
        const durationMinutes = DRUG_DATA[type][stage][amount];
        const endTime = Date.now() + (durationMinutes * 60 * 1000);

        // Update DB
        const updates = {
            current_batch: { type, stage, amount, end_time: endTime }
        };
        
        // Remove stock immediately when starting process/sell to prevent dupes
        if (stage === 'process') {
            const stockKey = type === 'coke' ? 'stock_coke_raw' : 'stock_weed_raw';
            updates[stockKey] = lab[stockKey] - amount;
        } else if (stage === 'sell') {
            const stockKey = type === 'coke' ? 'stock_coke_pure' : 'stock_weed_pure';
            updates[stockKey] = lab[stockKey] - amount;
        } else if (stage === 'harvest') {
            updates.last_production_date = new Date().toISOString();
        }

        await updateDrugLab(updates);
        ui.showToast("Opération lancée.", 'success');
        render();
    },

    collectProduction: async () => {
        const lab = state.drugLab;
        if (!lab.current_batch) return;
        
        const { type, stage, amount } = lab.current_batch;
        const updates = { current_batch: null };
        let toastMsg = "";

        if (stage === 'harvest') {
            const stockKey = type === 'coke' ? 'stock_coke_raw' : 'stock_weed_raw';
            updates[stockKey] = (lab[stockKey] || 0) + amount;
            toastMsg = `Récolte terminée : +${amount}g`;
        } else if (stage === 'process') {
            const stockKey = type === 'coke' ? 'stock_coke_pure' : 'stock_weed_pure';
            updates[stockKey] = (lab[stockKey] || 0) + amount;
            toastMsg = `Traitement terminé : +${amount}g`;
        } else if (stage === 'sell') {
            const price = DRUG_DATA[type].pricePerG * amount;
            // Add cash directly
            const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', state.activeCharacter.id).single();
            await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance + price }).eq('character_id', state.activeCharacter.id);
            toastMsg = `Vente terminée : +$${price}`;
            await fetchBankData(state.activeCharacter.id);
        }

        await updateDrugLab(updates);
        ui.showToast(toastMsg, 'success');
        render();
    },

    // --- NEW HEIST SYSTEM (SYNC) ---
    createLobby: async (heistId) => {
        await createHeistLobby(heistId);
        render();
    },
    inviteToLobby: async (targetId) => {
        if(!targetId) return;
        await inviteToLobby(targetId); // Legacy logic, but functional
        render();
    },
    requestJoinLobby: async (lobbyId) => {
        await joinLobbyRequest(lobbyId);
        ui.showToast('Demande envoyée au chef.', 'success');
        // Refresh to show pending state if possible, or wait for host
    },
    acceptHeistApplicant: async (targetCharId) => {
        await acceptLobbyMember(targetCharId);
        ui.showToast('Membre accepté !', 'success');
        render();
    },
    rejectHeistApplicant: async (targetCharId) => {
        if(!state.activeHeistLobby) return;
        await state.supabase.from('heist_members').delete().eq('lobby_id', state.activeHeistLobby.id).eq('character_id', targetCharId);
        ui.showToast('Candidature rejetée.', 'info');
        await fetchActiveHeistLobby(state.activeCharacter.id);
        render();
    },
    startHeistLobby: async (timeSeconds) => {
        await startHeistSync(timeSeconds);
        // Timer update handled by polling
        render();
    },
    finishHeist: async () => {
        if(!state.activeHeistLobby) return;
        
        const lobby = state.activeHeistLobby;
        const heist = HEIST_DATA.find(h => h.id === lobby.heist_type);
        
        // CHECK IF NEEDS MANUAL VALIDATION
        if (heist.requiresValidation) {
            await state.supabase.from('heist_lobbies').update({ status: 'pending_review' }).eq('id', lobby.id);
            ui.showModal({
                title: "Validation Requise",
                content: "Braquage terminé. En attente de validation administrative (Staff) pour confirmer la réussite RP et distribuer les gains.",
                confirmText: "Fermer",
                type: "default",
                onConfirm: async () => {
                    await fetchActiveHeistLobby(state.activeCharacter.id);
                    render();
                }
            });
            return;
        }

        // AUTO SUCCESS (100% Rate for low tier)
        const success = true; // "on ne doit pas pouvoir ne pas reussir"
        const groupSize = state.heistMembers.length;
        
        const rawLoot = Math.floor(Math.random() * (heist.max - heist.min + 1)) + heist.min;
        const myShare = Math.floor(rawLoot / groupSize);
        
        const message = `Braquage RÉUSSI ! Butin total: $${rawLoot.toLocaleString()}. Votre part: $${myShare.toLocaleString()}.`;
        
        // Add Cash
        const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', state.activeCharacter.id).single();
        await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance + myShare }).eq('character_id', state.activeCharacter.id);
            await state.supabase.from('transactions').insert({ sender_id: state.activeCharacter.id, amount: myShare, type: 'deposit', description: `Gain Braquage: ${heist.name}` });

        // Close Lobby in DB
        await state.supabase.from('heist_lobbies').update({ status: 'finished' }).eq('id', lobby.id);
        
        ui.showModal({
            title: "Mission Accomplie",
            content: message,
            confirmText: "Fermer",
            type: 'default',
            onConfirm: async () => {
                await fetchActiveHeistLobby(state.activeCharacter.id);
                render();
            }
        });
    },
    leaveLobby: async () => {
        if(!state.activeHeistLobby) return;

        // Check if Host
        if (state.activeHeistLobby.host_id === state.activeCharacter.id) {
            // DELETE THE WHOLE LOBBY TO PREVENT ZOMBIE STATE
            await state.supabase.from('heist_lobbies').delete().eq('id', state.activeHeistLobby.id);
            ui.showToast('Équipe dissoute par le chef.', 'info');
        } else {
            // Just leave as member
            await state.supabase.from('heist_members').delete()
                .eq('lobby_id', state.activeHeistLobby.id)
                .eq('character_id', state.activeCharacter.id);
            ui.showToast('Vous avez quitté l\'équipe.', 'info');
        }

        // Clean state immediately
        state.activeHeistLobby = null;
        state.heistMembers = [];
        
        await fetchActiveHeistLobby(state.activeCharacter.id);
        state.activeIllicitTab = 'heists';
        render();
    },

    // Staff Actions
    setStaffTab: async (tab) => {
        state.activeStaffTab = tab;
        state.staffSearchQuery = ''; 
        
        // Refresh Stats if needed
        if (tab === 'economy' || tab === 'illegal') {
             await fetchServerStats();
        }
        if (tab === 'illegal') {
            await fetchPendingHeistReviews();
        }

        render();
    },
    
    // Optimized Staff Search (No re-render)
    staffSearch: (query) => {
        state.staffSearchQuery = query;
        render(); 
        // Restore focus hack
        setTimeout(() => {
            const input = document.querySelector('input[placeholder*="Rechercher"]');
            if(input) {
                input.focus();
                input.setSelectionRange(input.value.length, input.value.length);
            }
        }, 0);
    },

    decideApplication: async (id, status) => {
        if (!hasPermission('can_approve_characters')) return;
        const { error } = await state.supabase.from('characters').update({ status: status }).eq('id', id);
        if (!error) {
            ui.showToast(`Candidature ${status === 'accepted' ? 'Validée' : 'Refusée'}.`, status === 'accepted' ? 'success' : 'warning');
            await fetchPendingApplications();
            await fetchAllCharacters();
            render(); 
        }
    },

    adminDeleteCharacter: async (id, name) => {
        ui.showModal({
            title: "Suppression Administrative",
            content: `Supprimer définitivement le citoyen <b>${name}</b> ?`,
            confirmText: "Supprimer",
            type: "danger",
            onConfirm: async () => {
                const { error } = await state.supabase.from('characters').delete().eq('id', id);
                if (!error) { 
                    ui.showToast("Citoyen supprimé.", 'info');
                    await fetchAllCharacters(); 
                    await fetchPendingApplications(); 
                    render(); 
                }
            }
        });
    },

    adminSwitchTeam: async (id, currentAlignment) => {
        if (!hasPermission('can_change_team')) return;
        const newAlign = currentAlignment === 'legal' ? 'illegal' : 'legal';
        await state.supabase.from('characters').update({ alignment: newAlign }).eq('id', id);
        ui.showToast(`Équipe changée en ${newAlign}`, 'success');
        await fetchAllCharacters();
        render();
    },
    
    validateHeist: async (lobbyId, success) => {
        if (!hasPermission('can_manage_illegal')) return;
        await adminResolveHeist(lobbyId, success);
        ui.showToast(success ? "Braquage validé (Gains distribués)" : "Braquage marqué échoué", success ? 'success' : 'info');
        render();
    },

    // INVENTORY MANAGEMENT ADMIN
    openInventoryModal: async (charId, charName) => {
        if (!hasPermission('can_manage_inventory')) return;
        ui.showToast("Chargement inventaire...", 'info');
        await fetchInventory(charId); 
        state.inventoryModal = { isOpen: true, targetId: charId, targetName: charName, items: state.inventory };
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
            ui.showModal({
                title: "Confiscation",
                content: "Retirer cet objet de l'inventaire ?",
                confirmText: "Confisquer",
                type: "danger",
                onConfirm: async () => {
                    await state.supabase.from('inventory').delete().eq('id', itemId);
                    refreshInv();
                }
            });
        } else if (action === 'add') {
            const formData = new FormData(event.target);
            const name = formData.get('item_name');
            const qty = parseInt(formData.get('quantity'));
            const value = parseInt(formData.get('value'));
            
            await state.supabase.from('inventory').insert({
                character_id: targetId, name: name, quantity: qty, estimated_value: value
            });
            refreshInv();
        }
        
        async function refreshInv() {
            await fetchInventory(targetId);
            state.inventoryModal.items = state.inventory;
            render();
        }
    },

    // Permission Management
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
        let profile = state.staffPermissionSearchResults.find(p => p.id === userId);
        if(!profile) profile = state.staffMembers.find(p => p.id === userId);
        if(!profile) {
            const { data } = await state.supabase.from('profiles').select('*').eq('id', userId).single();
            profile = data;
        }
        if (!profile) return;
        
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
        if (isSelf) warningMsg = '<div class="text-xs text-red-400 mt-2 bg-red-500/10 p-2 rounded">Modification de soi-même interdite.</div>';
        if (isTargetFounder) warningMsg = '<div class="text-xs text-red-400 mt-2 bg-red-500/10 p-2 rounded">Admin Fondateur (Intouchable).</div>';

        const checkboxes = [
            { k: 'can_approve_characters', l: 'Valider Fiches' },
            { k: 'can_manage_characters', l: 'Gérer Personnages (Suppr.)' },
            { k: 'can_manage_economy', l: 'Gérer Économie' },
            { k: 'can_manage_illegal', l: 'Gérer Illégal (Stats/Braquages)' },
            { k: 'can_manage_staff', l: 'Gérer Staff' },
            { k: 'can_manage_inventory', l: 'Gérer Inventaires' },
            { k: 'can_change_team', l: 'Changer Équipe (Legal/Illegal)' }
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
        
        const { data: profile } = await state.supabase.from('profiles').select('permissions').eq('id', userId).single();
        const newPerms = { ...(profile.permissions || {}) };
        if (value) newPerms[permKey] = true; else delete newPerms[permKey];
        
        await state.supabase.from('profiles').update({ permissions: newPerms }).eq('id', userId);
        ui.showToast('Permissions mises à jour.', 'success');
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
            return;
        }
        const lower = query.toLowerCase();
        // Update data but DO NOT RENDER WHOLE PAGE
        const filtered = state.recipientList.filter(r => 
            r.first_name.toLowerCase().includes(lower) || 
            r.last_name.toLowerCase().includes(lower)
        );
        
        if (filtered.length > 0) {
            container.innerHTML = filtered.map(r => `
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
        render(); // Must render here to fill input value properly
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
        
        if (error) { ui.showToast("Erreur dépôt", 'error'); return; }
        await state.supabase.from('transactions').insert({ sender_id: charId, amount: amount, type: 'deposit' });
        await fetchBankData(charId);
        ui.showToast(`Dépôt effectué: +$${amount}`, 'success');
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
        
        if (error) { ui.showToast("Erreur retrait", 'error'); return; }
        await state.supabase.from('transactions').insert({ sender_id: charId, amount: amount, type: 'withdraw' });
        await fetchBankData(charId);
        ui.showToast(`Retrait effectué: -$${amount}`, 'success');
        render();
    },

    bankTransfer: async (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const amount = parseInt(data.get('amount'));
        const targetId = data.get('target_id');
        const description = data.get('description') || 'Virement';
        
        if (amount <= 0 || amount > state.bankAccount.bank_balance || !targetId) { ui.showToast("Données invalides", 'error'); return; }
        
        ui.showModal({
            title: "Confirmation Virement",
            content: `Envoyer <b>$${amount}</b> à <b>${state.selectedRecipient.name}</b> ?`,
            confirmText: "Envoyer",
            onConfirm: async () => {
                const rpcResult = await state.supabase.rpc('transfer_money', { 
                    sender: state.activeCharacter.id, receiver: targetId, amt: amount
                });

                if (rpcResult.error) { ui.showToast("Erreur: " + rpcResult.error.message, 'error'); return; }

                // Update Description (Optional hack as RPC sets default)
                const { data: lastTx } = await state.supabase.from('transactions').select('id').eq('sender_id', state.activeCharacter.id).eq('type', 'transfer').order('created_at', { ascending: false }).limit(1).single();
                if (lastTx) await state.supabase.from('transactions').update({ description: description }).eq('id', lastTx.id);
                
                ui.showToast("Virement envoyé avec succès.", 'success');
                state.selectedRecipient = null;
                await fetchBankData(state.activeCharacter.id);
                render();
            }
        });
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
        const targetId = state.economyModal.targetId;
        const isGlobal = targetId === 'ALL';
        
        // Prevent Adding Money by Percentage (Inflation Protection)
        if (action === 'add' && mode === 'percent') {
            ui.showToast("L'ajout par pourcentage (inflation) est interdit.", 'error');
            return;
        }

        ui.showModal({
            title: "Action Économique Critique",
            content: `Vous allez ${action === 'add' ? 'Ajouter' : 'Retirer'} <b>${amountVal}${mode === 'percent' ? '%' : '$'}</b> ${isGlobal ? 'à TOUS les joueurs' : 'au joueur cible'}.`,
            confirmText: "Exécuter",
            type: "danger",
            onConfirm: async () => {
                let bankAccountsToUpdate = [];
                if (isGlobal) {
                    const { data } = await state.supabase.from('bank_accounts').select('*');
                    bankAccountsToUpdate = data;
                } else {
                     const { data } = await state.supabase.from('bank_accounts').select('*').eq('character_id', targetId).maybeSingle();
                     if (data) bankAccountsToUpdate = [data];
                }

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
                        sender_id: null, receiver_id: account.character_id, amount: (action === 'remove' ? -1 : 1) * (mode === 'fixed' ? amountVal : 0),
                        type: 'admin_adjustment', description: `Staff Global: ${action} ${amountVal} ${mode}`
                    });
                    
                    await state.supabase.from('bank_accounts').update({ bank_balance: newBalance }).eq('id', account.id);
                }

                ui.showToast("Opération économique terminée.", 'success');
                actions.closeEconomyModal();
                await fetchAllCharacters();
                render();
            }
        });
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
    
    // Inject Bypass Button manually if in select view and founder
    if (state.currentView === 'select' && state.user && CONFIG.ADMIN_IDS.includes(state.user.id)) {
        const header = app.querySelector('.flex.items-center.gap-4');
        if (header) {
             const btn = document.createElement('button');
             btn.onclick = actions.bypassLogin;
             btn.className = 'bg-purple-500/20 text-purple-300 px-3 py-1 rounded text-xs hover:bg-purple-500/40 font-bold border border-purple-500/20';
             btn.innerHTML = '<i data-lucide="key" class="w-3 h-3 inline mr-1"></i> Fondation';
             header.prepend(btn);
        }
    }

    if (window.lucide) setTimeout(() => lucide.createIcons(), 50);
};

// --- POLLING LOOP FOR SYNC (TIMERS & NOTIFS) ---
const startPolling = () => {
    // We do NOT call render() here anymore to prevent full page refreshes
    setInterval(async () => {
        if (!state.user || !state.activeCharacter) return;
        
        // Update Heist Status (Sync Data Only)
        // Fetched for both illicit tabs AND main menu summary
        if (state.activeHubPanel === 'illicit') {
             await fetchActiveHeistLobby(state.activeCharacter.id);
             // If state changed drastically (e.g. from setup to active, or active to finished), trigger render once
             // For simple timer updates, we use updateActiveTimers()
             if (state.activeHeistLobby && state.activeHeistLobby.status !== 'active') {
                 // Potentially refresh logic here if needed
             }
        }
        
        // Update Drug Status (Data Only)
         if (state.activeHubPanel === 'illicit') {
             await fetchDrugLab(state.activeCharacter.id);
        }

        // UPDATE UI TIMERS ONLY (DOM Manipulation without full render)
        updateActiveTimers();

    }, 1000); 
};

// New function to update timers in DOM without killing focus or reloading
const updateActiveTimers = () => {
    // 1. Heist Timer
    const heistDisplay = document.getElementById('heist-timer-display');
    if (heistDisplay && state.activeHeistLobby && state.activeHeistLobby.status === 'active') {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.activeHeistLobby.end_time - now) / 1000));
        
        if (remaining <= 0) {
            render(); // State change (active -> finished), so we render full page
        } else {
            heistDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
        }
    }

    // 2. Drug Timer
    const drugDisplay = document.getElementById('drug-timer-display');
    if (drugDisplay && state.drugLab && state.drugLab.current_batch) {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.drugLab.current_batch.end_time - now) / 1000));
        
        if (remaining <= 0) {
             render(); // State change, render full page
        } else {
             drugDisplay.textContent = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
        }
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

    startPolling();
};

const handleDiscordCallback = async (token, type) => {
    const appEl = document.getElementById('app');
    const loadingScreen = document.getElementById('loading-screen');
    
    try {
        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `${type} ${token}` }
        });
        
        if (!userRes.ok) throw new Error('Discord User Fetch Failed');
        
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
        
        // Attempt to Upsert User Profile
        // Note: Requires RLS policies to be Open/Allow All for this architecture
        const { error: upsertError } = await state.supabase.from('profiles').upsert({
            id: discordUser.id,
            username: discordUser.username,
            avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
            updated_at: new Date(),
        });

        if (upsertError) {
            console.error("DB Error:", upsertError);
            // We don't block here, we try to proceed, maybe it's just a permissions glitch
        }
        
        const { data: profile } = await state.supabase.from('profiles').select('permissions').eq('id', discordUser.id).maybeSingle();

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
        ui.showModal({
            title: "Erreur de Connexion",
            content: "Impossible de communiquer avec le serveur. Vérifiez les permissions de la base de données.",
            confirmText: "Réessayer",
            onConfirm: () => {
                localStorage.clear();
                window.location.reload();
            }
        });
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
