

import { state } from './state.js';
import { showToast } from './ui.js';

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

export const searchProfiles = async (query) => {
    if (!query) return [];
    
    // Check if query is an ID (digits)
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

// Economy Services
export const fetchBankData = async (charId) => {
    // 1. Get Account
    let { data: bank, error } = await state.supabase
        .from('bank_accounts')
        .select('*')
        .eq('character_id', charId)
        .maybeSingle(); 
    
    // Create if doesn't exist
    if (!bank) {
        const { data: newBank } = await state.supabase.from('bank_accounts').insert([{ character_id: charId, bank_balance: 5000, cash_balance: 500 }]).select().single();
        bank = newBank;
    }
    state.bankAccount = bank;

    // 2. Get Transactions
    const { data: txs } = await state.supabase
        .from('transactions')
        .select('*')
        .or(`sender_id.eq.${charId},receiver_id.eq.${charId}`)
        .order('created_at', { ascending: false })
        .limit(20);
    
    state.transactions = txs || [];

    // 3. Get Potential Recipients
    const { data: recipients } = await state.supabase
        .from('characters')
        .select('id, first_name, last_name')
        .eq('status', 'accepted')
        .neq('id', charId);
        
    state.recipientList = recipients || [];
};

// Patrimoine & Inventory
export const fetchInventory = async (charId) => {
    if (!state.supabase) return;

    // 1. Ensure Bank Data is fresh
    await fetchBankData(charId);

    // 2. Fetch Physical Inventory
    const { data: items, error } = await state.supabase
        .from('inventory')
        .select('*')
        .eq('character_id', charId);

    state.inventory = items || [];

    // --- AUTOMATIC ID CARD ---
    // Si la carte d'identité n'est pas dans la liste, on la "simule" pour l'affichage
    const hasID = state.inventory.some(i => i.name === "Carte d'Identité");
    if (!hasID) {
        state.inventory.unshift({
            id: 'virtual-id-card',
            name: "Carte d'Identité",
            quantity: 1,
            estimated_value: 0,
            is_virtual: true
        });
    }

    // 3. Calculate Total Wealth
    let total = (state.bankAccount.bank_balance || 0) + (state.bankAccount.cash_balance || 0);

    state.inventory.forEach(item => {
        total += (item.quantity * item.estimated_value);
    });

    state.patrimonyTotal = total;
};

// --- HEIST SYNC SERVICES ---
export const fetchActiveHeistLobby = async (charId) => {
    // 1. Check if user is in any active lobby (as host or member)
    const { data: membership } = await state.supabase
        .from('heist_members')
        .select('lobby_id')
        .eq('character_id', charId)
        .maybeSingle();

    let lobbyId = membership ? membership.lobby_id : null;

    if (!lobbyId) {
        // Check if host
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
    }
    
    // Get potential partners (Online/Accepted chars) for invites
    const { data: partners } = await state.supabase
        .from('characters')
        .select('id, first_name, last_name')
        .eq('status', 'accepted')
        .neq('id', charId)
        .limit(20);
    state.availableHeistPartners = partners || [];
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
    if(!state.activeHeistLobby) return;
    
    // Check if already in
    const existing = state.heistMembers.find(m => m.character_id === targetId);
    if(existing) return showToast("Déjà dans l'équipe", 'warning');

    await state.supabase.from('heist_members').insert({
        lobby_id: state.activeHeistLobby.id,
        character_id: targetId,
        status: 'pending' 
    });
    
    // In a real socket app, we'd notify target. Here we just reload data.
    await fetchActiveHeistLobby(state.activeCharacter.id);
    showToast("Invitation envoyée (Simulé: Acceptation auto pour démo)", 'success');
    
    // SIMULATION: Auto-accept for prototype smoothness
    setTimeout(async () => {
        await state.supabase.from('heist_members').update({ status: 'accepted' }).eq('lobby_id', state.activeHeistLobby.id).eq('character_id', targetId);
        await fetchActiveHeistLobby(state.activeCharacter.id);
        // Trigger generic render via event
        document.dispatchEvent(new CustomEvent('render-view'));
    }, 2000);
};

export const startHeistSync = async (durationSeconds) => {
    if(!state.activeHeistLobby) return;
    
    const now = Date.now();
    const endTime = now + (durationSeconds * 1000);

    const { error } = await state.supabase
        .from('heist_lobbies')
        .update({
            status: 'active',
            start_time: now,
            end_time: endTime
        })
        .eq('id', state.activeHeistLobby.id);
        
    if(error) showToast("Erreur lancement", 'error');
    await fetchActiveHeistLobby(state.activeCharacter.id);
};
