

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
    
    // UI State
    currentView: 'login', // login, select, create, hub, access_denied
    activeHubPanel: 'main', // main, bank, services, illicit, staff, assets
    activeStaffTab: 'applications', // applications, database, permissions, economy
    isLoggingIn: false, // UI state for popup login
    
    supabase: null,
    queueCount: Math.floor(Math.random() * 8) + 1
};