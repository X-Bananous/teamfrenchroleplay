


export const state = {
    user: null, // Données Discord + Permissions
    accessToken: null,
    
    // Character Data
    characters: [],
    activeCharacter: null, // The currently played character
    
    // Staff Data
    pendingApplications: [],
    allCharactersAdmin: [],
    staffMembers: [], // List of current staff
    onDutyStaff: [], // Staff en service
    
    // Stats & Monitoring
    serverStats: {
        totalMoney: 0,
        totalCash: 0,
        totalBank: 0,
        totalCoke: 0,
        totalWeed: 0,
        heistWinRate: 100
    },
    pendingHeistReviews: [], // Braquages en attente de validation staff
    
    // ERLC Server Data
    erlcData: {
        players: [],
        queue: [],
        maxPlayers: 42,
        currentPlayers: 0
    },
    
    // Search States for Staff Panel
    staffSearchQuery: '', 
    staffPermissionSearchResults: [], // Dropdown results for permission tab
    
    // Modals Data
    ui: {
        modal: { isOpen: false, type: null, data: null }, // Generic modal (confirm, alert, custom)
        toasts: []
    },

    economyModal: { 
        isOpen: false,
        targetId: null, // ID character or 'ALL'
        targetName: null
    },

    inventoryModal: {
        isOpen: false,
        targetId: null,
        targetName: null,
        items: []
    },
    
    // Economy Data
    bankAccount: null,
    transactions: [],
    recipientList: [], // For transfers
    filteredRecipients: [], // For search bar
    selectedRecipient: null, // {id, name}
    
    // Patrimoine (Assets) Data
    inventory: [],
    patrimonyTotal: 0,
    inventoryFilter: '', // For search bar in assets
    idCardModalOpen: false, // For viewing ID
    
    // Illicit Data
    activeIllicitTab: 'menu', // menu, market, heists, drugs
    activeHeistLobby: null, // SYNC: Data from 'heist_lobbies' table
    heistMembers: [], // SYNC: Data from 'heist_members'
    availableHeistLobbies: [], // For joining
    blackMarketSearch: '', // Search filter for black market
    drugLab: null, // Data from 'drug_labs' table
    
    // Global News / Events
    globalActiveHeists: [], // Active major heists for the hub news bubble
    
    // UI State
    currentView: 'login', // login, select, create, hub, access_denied
    activeHubPanel: 'main', // main, bank, services, illicit, staff, assets
    activeStaffTab: 'applications', // applications, database, permissions, economy, illegal
    isLoggingIn: false, // UI state for popup login
    alignmentModalShown: false, // Legacy character fix
    
    supabase: null,
    queueCount: Math.floor(Math.random() * 8) + 1
};
