

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
    staffSearchResults: [], // Results when searching for a user to give perms
    economyModal: { 
        isOpen: false,
        targetId: null, // ID character or 'ALL'
        targetName: null
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
    
    // Illicit Data
    activeIllicitTab: 'light', // light, medium, heavy, sniper
    
    // UI State
    currentView: 'login', // login, select, create, hub, access_denied
    activeHubPanel: 'main', // main, bank, services, illicit, staff, assets
    activeStaffTab: 'applications', // applications, database, permissions, economy
    isLoggingIn: false, // UI state for popup login
    
    supabase: null,
    queueCount: Math.floor(Math.random() * 8) + 1
};