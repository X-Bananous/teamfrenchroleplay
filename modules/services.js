

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