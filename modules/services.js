
import { state } from './state.js';

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
    // Note: Filtering JSONB 'permissions' not equals '{}' is tricky in Supabase JS without RPC or raw SQL.
    // For this prototype, we fetch profiles and filter in JS. In prod, use a better query or a 'is_staff' boolean column.
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
