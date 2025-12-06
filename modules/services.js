




import { state } from './state.js';
import { showToast } from './ui.js';
import { HEIST_DATA } from './views/illicit.js';
import { CONFIG } from './config.js';

export const loadCharacters = async () => {
    if (!state.user || !state.supabase) return;
    const { data, error } = await state.supabase
        .from('characters')
        .select('*')
        .eq('user_id', state.user.id);
    state.characters = error ? [] : data;
};

// Staff Data Fetchers
export const fetchCharactersWithProfiles = async (statusFilter = null) => {
    if (!state.user || !state.supabase) return [];
    
    // Modified query to include bank accounts
    let query = state.supabase.from('characters').select('*, bank_accounts(bank_balance, cash_balance)');
    if (statusFilter) query = query.eq('status', statusFilter);
    
    const { data: chars } = await query;
    if (!chars || chars.length === 0) return [];

    const userIds = [...new Set(chars.map(c => c.user_id))];
    const { data: profiles } = await state.supabase.from('profiles').select('id, username, avatar_url').in('id', userIds);

    return chars.map(char => {
        const profile = profiles?.find(p => p.id === char.user_id);
        const bank = char.bank_accounts && char.bank_accounts.length > 0 ? char.bank_accounts[0] : { bank_balance: 0, cash_balance: 0 };
        return {
            ...char,
            discord_username: profile ? profile.username : 'Unknown',
            discord_avatar: profile ? profile.avatar_url : null,
            bank_balance: bank.bank_balance,
            cash_balance: bank.cash_balance
        };
    });
};

export const fetchPendingApplications = async () => {
    state.pendingApplications = await fetchCharactersWithProfiles('pending');
};

export const fetchAllCharacters = async () => {
    state.allCharactersAdmin = await fetchCharactersWithProfiles(null);
};

export const fetchStaffProfiles = async () => {
    if (!state.user || !state.supabase) return;
    const { data: profiles } = await state.supabase
        .from('profiles')
        .select('*');
    
    if (profiles) {
        state.staffMembers = profiles.filter(p => p.permissions && Object.keys(p.permissions).length > 0);
    }
};

export const fetchOnDutyStaff = async () => {
    const { data } = await state.supabase.from('profiles').select('username, avatar_url').eq('is_on_duty', true);
    state.onDutyStaff = data || [];
};

export const toggleStaffDuty = async () => {
    if (!state.user) return;
    // Get current status
    const { data } = await state.supabase.from('profiles').select('is_on_duty').eq('id', state.user.id).single();
    const newStatus = !data.is_on_duty;
    
    await state.supabase.from('profiles').update({ is_on_duty: newStatus }).eq('id', state.user.id);
    showToast(newStatus ? "Vous avez pris votre service." : "Vous avez quitté votre service.", 'success');
    await fetchOnDutyStaff();
};

export const searchProfiles = async (query) => {
    if (!query) return [];
    const isId = /^\d+$/.test(query);
    let dbQuery = state.supabase.from('profiles').select('*');
    if (isId) {
        dbQuery = dbQuery.eq('id', query);
    } else {
        dbQuery = dbQuery.ilike('username', `%${query}%`);
    }
    const { data } = await dbQuery.limit(10);
    return data || [];
};

export const fetchGlobalHeists = async () => {
    // Fetches active major heists for the news bubble
    const { data: heists } = await state.supabase
        .from('heist_lobbies')
        .select('*, characters(first_name, last_name)')
        .in('status', ['active', 'pending_review'])
        .in('heist_type', ['bank', 'jewelry', 'truck']); // Only major heists
    
    state.globalActiveHeists = heists || [];
};

// --- ERLC API ---
export const fetchERLCData = async () => {
    try {
        const response = await fetch(CONFIG.ERLC_API_URL, {
            headers: { 'Server-Key': CONFIG.ERLC_API_KEY }
        });
        
        if (response.ok) {
            const data = await response.json();
            state.erlcData = {
                players: data.Players || [],
                queue: data.Queue || [],
                maxPlayers: data.MaxPlayers || 42,
                currentPlayers: data.CurrentPlayers || (data.Players ? data.Players.length : 0)
            };
        }
    } catch (e) {
        console.warn("ERLC API Fetch Failed", e);
    }
};


// --- STAFF STATS & ILLEGAL MANAGEMENT ---
export const fetchServerStats = async () => {
    // Money Stats
    const { data: accounts } = await state.supabase.from('bank_accounts').select('bank_balance, cash_balance');
    let tBank = 0, tCash = 0;
    if (accounts) {
        accounts.forEach(a => { tBank += (a.bank_balance || 0); tCash += (a.cash_balance || 0); });
    }
    state.serverStats.totalBank = tBank;
    state.serverStats.totalCash = tCash;
    state.serverStats.totalMoney = tBank + tCash;

    // Drug Stats
    const { data: labs } = await state.supabase.from('drug_labs').select('stock_coke_raw, stock_coke_pure, stock_weed_raw, stock_weed_pure');
    let tCoke = 0, tWeed = 0;
    if (labs) {
        labs.forEach(l => {
            tCoke += (l.stock_coke_raw || 0) + (l.stock_coke_pure || 0);
            tWeed += (l.stock_weed_raw || 0) + (l.stock_weed_pure || 0);
        });
    }
    state.serverStats.totalCoke = tCoke;
    state.serverStats.totalWeed = tWeed;
};

export const fetchPendingHeistReviews = async () => {
    // Fetch lobbies waiting for staff validation (pending_review)
    // AND fetch members count to calculate shares
    const { data: lobbies } = await state.supabase
        .from('heist_lobbies')
        .select('*, characters(first_name, last_name), heist_members(count)') // Select count of members
        .in('status', ['pending_review', 'active']); // We fetch active too to display gains during heist
    
    state.pendingHeistReviews = lobbies || [];
};

export const adminResolveHeist = async (lobbyId, success) => {
    const { data: lobby } = await state.supabase.from('heist_lobbies').select('*').eq('id', lobbyId).single();
    if(!lobby) return;

    if (!success) {
        await state.supabase.from('heist_lobbies').update({ status: 'failed' }).eq('id', lobbyId);
    } else {
        const heist = HEIST_DATA.find(h => h.id === lobby.heist_type);
        // Calculate loot for High Tier (Manual Validation)
        // Usually higher reward for big risks
        const rawLoot = Math.floor(Math.random() * (heist.max - heist.min + 1)) + heist.min;
        
        // Distribute to members
        const { data: members } = await state.supabase.from('heist_members').select('character_id').eq('lobby_id', lobbyId).eq('status', 'accepted');
        const share = Math.floor(rawLoot / members.length);

        for (const m of members) {
             const { data: bank } = await state.supabase.from('bank_accounts').select('cash_balance').eq('character_id', m.character_id).single();
             if(bank) {
                 await state.supabase.from('bank_accounts').update({ cash_balance: bank.cash_balance + share }).eq('character_id', m.character_id);
                 await state.supabase.from('transactions').insert({ sender_id: m.character_id, amount: share, type: 'deposit', description: `Gain Braquage: ${heist.name}` });
             }
        }

        await state.supabase.from('heist_lobbies').update({ status: 'finished' }).eq('id', lobbyId);
    }
    
    await fetchPendingHeistReviews();
};

// Economy Services
export const fetchBankData = async (charId) => {
    let { data: bank, error } = await state.supabase
        .from('bank_accounts')
        .select('*')
        .eq('character_id', charId)
        .maybeSingle(); 
    
    if (!bank) {
        const { data: newBank } = await state.supabase.from('bank_accounts').insert([{ character_id: charId, bank_balance: 5000, cash_balance: 500 }]).select().single();
        bank = newBank;
    }
    state.bankAccount = bank;

    const { data: txs } = await state.supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${charId},receiver_id.eq.${charId}`)
        .order('created_at', { ascending: false })
        .limit(20);
    state.transactions = txs || [];

    const { data: recipients } = await state.supabase
        .from('characters')
        .select('id, first_name, last_name')
        .eq('status', 'accepted')
        .neq('id', charId);
    state.recipientList = recipients || [];
};

export const fetchInventory = async (charId) => {
    if (!state.supabase) return;
    await fetchBankData(charId);
    const { data: items, error } = await state.supabase
        .from('inventory')
        .select('*')
        .eq('character_id', charId);
    state.inventory = items || [];

    const hasID = state.inventory.some(i => i.name === "Carte d'Identité");
    if (!hasID) {
        state.inventory.unshift({ id: 'virtual-id-card', name: "Carte d'Identité", quantity: 1, estimated_value: 0, is_virtual: true });
    }

    let total = (state.bankAccount.bank_balance || 0) + (state.bankAccount.cash_balance || 0);
    state.inventory.forEach(item => { total += (item.quantity * item.estimated_value); });
    state.patrimonyTotal = total;
};

// --- DRUG LAB SERVICES ---
export const fetchDrugLab = async (charId) => {
    let { data: lab } = await state.supabase.from('drug_labs').select('*').eq('character_id', charId).maybeSingle();
    
    if (!lab) {
        // Init lab if not exists (but with everything false)
        const { data: newLab } = await state.supabase.from('drug_labs').insert([{ character_id: charId }]).select().single();
        lab = newLab;
    }
    state.drugLab = lab;
};

export const updateDrugLab = async (updates) => {
    if(!state.activeCharacter) return;
    await state.supabase.from('drug_labs').update(updates).eq('character_id', state.activeCharacter.id);
    await fetchDrugLab(state.activeCharacter.id);
};

// --- HEIST SYNC SERVICES ---
export const fetchActiveHeistLobby = async (charId) => {
    // 1. Check if user is in any active lobby
    const { data: membership } = await state.supabase
        .from('heist_members')
        .select('lobby_id')
        .eq('character_id', charId)
        .maybeSingle();

    let lobbyId = membership ? membership.lobby_id : null;

    if (!lobbyId) {
        const { data: hosted } = await state.supabase
            .from('heist_lobbies')
            .select('id')
            .eq('host_id', charId)
            .neq('status', 'finished')
            .neq('status', 'failed')
            .maybeSingle();
        if(hosted) lobbyId = hosted.id;
    }

    if (lobbyId) {
        const { data: lobby } = await state.supabase.from('heist_lobbies').select('*').eq('id', lobbyId).single();
        const { data: members } = await state.supabase.from('heist_members').select('*, characters(first_name, last_name)').eq('lobby_id', lobbyId);
        
        state.activeHeistLobby = lobby;
        state.heistMembers = members;
    } else {
        state.activeHeistLobby = null;
        state.heistMembers = [];
        
        // Only fetch available lobbies if NOT in one
        await fetchAvailableLobbies(charId);
    }
};

export const fetchAvailableLobbies = async (charId) => {
    // Get lobbies in 'setup' state where user is NOT member
    const { data: lobbies } = await state.supabase
        .from('heist_lobbies')
        .select('*, characters(first_name, last_name)') // join to get host name
        .eq('status', 'setup')
        .neq('host_id', charId);
    
    // Transform to flat object
    state.availableHeistLobbies = (lobbies || []).map(l => ({
        ...l,
        host_name: l.characters ? `${l.characters.first_name} ${l.characters.last_name}` : 'Inconnu'
    }));
};

export const createHeistLobby = async (heistId) => {
    const { data, error } = await state.supabase
        .from('heist_lobbies')
        .insert({
            host_id: state.activeCharacter.id,
            heist_type: heistId,
            status: 'setup'
        })
        .select()
        .single();
    
    if(error) {
        showToast("Erreur création lobby: " + error.message, 'error');
        return;
    }
    // Add host as member
    await state.supabase.from('heist_members').insert({
        lobby_id: data.id,
        character_id: state.activeCharacter.id,
        status: 'accepted'
    });
    await fetchActiveHeistLobby(state.activeCharacter.id);
};

export const inviteToLobby = async (targetId) => {
    // Legacy function kept if needed, but we use request join now mainly
    if(!state.activeHeistLobby) return;
    const existing = state.heistMembers.find(m => m.character_id === targetId);
    if(existing) return showToast("Déjà dans l'équipe", 'warning');
    await state.supabase.from('heist_members').insert({
        lobby_id: state.activeHeistLobby.id,
        character_id: targetId,
        status: 'pending' 
    });
};

export const joinLobbyRequest = async (lobbyId) => {
    const charId = state.activeCharacter.id;
    await state.supabase.from('heist_members').insert({
        lobby_id: lobbyId,
        character_id: charId,
        status: 'pending' 
    });
    await fetchActiveHeistLobby(charId);
};

export const acceptLobbyMember = async (targetCharId) => {
    if(!state.activeHeistLobby) return;
    await state.supabase.from('heist_members')
        .update({ status: 'accepted' })
        .eq('lobby_id', state.activeHeistLobby.id)
        .eq('character_id', targetCharId);
    await fetchActiveHeistLobby(state.activeCharacter.id);
};

export const startHeistSync = async (durationSeconds) => {
    if(!state.activeHeistLobby) return;
    const now = Date.now();
    const endTime = now + (durationSeconds * 1000);
    const { error } = await state.supabase
        .from('heist_lobbies')
        .update({ status: 'active', start_time: now, end_time: endTime })
        .eq('id', state.activeHeistLobby.id);
    if(error) showToast("Erreur lancement", 'error');
    await fetchActiveHeistLobby(state.activeCharacter.id);
};
