import { state } from '../state.js';

export const BankView = () => {
    if (!state.bankAccount) return '<div class="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full"><div class="loader-spinner mb-4"></div>Chargement de la banque...</div>';
    
    const historyHtml = state.transactions.length > 0 
        ? state.transactions.map(t => {
            let icon, color, label, sign;
            const desc = t.description ? `<div class="text-[10px] text-gray-500 italic mt-0.5">"${t.description}"</div>` : '';

            if (t.type === 'deposit') {
                icon = 'arrow-down-left';
                color = 'text-emerald-400';
                label = 'Dépôt d\'espèces';
                sign = '+';
            } else if (t.type === 'withdraw') {
                icon = 'arrow-up-right';
                color = 'text-white';
                label = 'Retrait d\'espèces';
                sign = '-';
            } else if (t.type === 'transfer') {
                if (t.receiver_id === state.activeCharacter.id) {
                    icon = 'arrow-down-left';
                    color = 'text-emerald-400';
                    label = 'Virement Reçu';
                    sign = '+';
                } else {
                    icon = 'send';
                    color = 'text-red-400';
                    label = 'Virement Envoyé';
                    sign = '-';
                }
            } else if (t.type === 'admin_adjustment') {
                icon = 'shield-alert';
                label = 'Ajustement Admin';
                if (t.amount >= 0) {
                    color = 'text-emerald-400';
                    sign = '+';
                } else {
                    color = 'text-red-400';
                    sign = '-';
                }
            }

            return `
                <div class="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400">
                            <i data-lucide="${icon}" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <div class="font-medium text-white">${label}</div>
                            <div class="text-xs text-gray-500">${new Date(t.created_at).toLocaleString()}</div>
                            ${desc}
                        </div>
                    </div>
                    <div class="font-mono font-bold ${color}">
                        ${sign} $${Math.abs(t.amount).toLocaleString()}
                    </div>
                </div>
            `;
        }).join('') 
        : '<div class="text-center text-gray-500 py-8 italic">Aucune transaction récente.</div>';

    return `
        <div class="animate-fade-in space-y-8 max-w-5xl mx-auto">
            <!-- Header Balance -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="glass-card p-6 rounded-[30px] bg-gradient-to-br from-emerald-900/40 to-black border-emerald-500/20 relative overflow-hidden">
                    <div class="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
                    <div class="flex items-center gap-3 mb-2">
                        <i data-lucide="landmark" class="w-5 h-5 text-emerald-400"></i>
                        <span class="text-sm font-bold text-emerald-400 uppercase tracking-wider">Solde Bancaire</span>
                    </div>
                    <div class="text-4xl font-bold text-white tracking-tight">$ ${state.bankAccount.bank_balance.toLocaleString()}</div>
                    <p class="text-emerald-500/60 text-xs mt-2 font-mono">IBAN: TFRP-${state.activeCharacter.id.substring(0,6).toUpperCase()}</p>
                </div>

                <div class="glass-card p-6 rounded-[30px] border-white/10">
                        <div class="flex items-center gap-3 mb-2">
                        <i data-lucide="wallet" class="w-5 h-5 text-gray-400"></i>
                        <span class="text-sm font-bold text-gray-400 uppercase tracking-wider">Espèces (Poches)</span>
                    </div>
                    <div class="text-4xl font-bold text-white tracking-tight">$ ${state.bankAccount.cash_balance.toLocaleString()}</div>
                    <p class="text-gray-600 text-xs mt-2">Disponible pour dépôt</p>
                </div>
            </div>

            <!-- Actions -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Deposit -->
                <form onsubmit="actions.bankDeposit(event)" class="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                    <div class="flex items-center gap-2 text-white font-bold">
                        <i data-lucide="arrow-down-left" class="w-5 h-5 text-emerald-400"></i> Dépôt
                    </div>
                    <p class="text-xs text-gray-400">Espèces -> Banque</p>
                    <input type="number" name="amount" placeholder="Montant" min="1" max="${state.bankAccount.cash_balance}" class="glass-input p-3 rounded-lg w-full" required>
                    <button type="submit" class="glass-btn-secondary bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 py-2 rounded-lg font-semibold text-sm cursor-pointer transition-colors">Déposer</button>
                </form>

                <!-- Withdraw -->
                <form onsubmit="actions.bankWithdraw(event)" class="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                    <div class="flex items-center gap-2 text-white font-bold">
                        <i data-lucide="arrow-up-right" class="w-5 h-5 text-white"></i> Retrait
                    </div>
                    <p class="text-xs text-gray-400">Banque -> Espèces</p>
                    <input type="number" name="amount" placeholder="Montant" min="1" max="${state.bankAccount.bank_balance}" class="glass-input p-3 rounded-lg w-full" required>
                    <button type="submit" class="glass-btn-secondary bg-white/5 hover:bg-white/10 py-2 rounded-lg font-semibold text-sm cursor-pointer transition-colors">Retirer</button>
                </form>

                <!-- Transfer -->
                <form onsubmit="actions.bankTransfer(event)" class="glass-panel p-6 rounded-2xl flex flex-col gap-4 relative" autocomplete="off">
                    <div class="flex items-center gap-2 text-white font-bold">
                        <i data-lucide="send" class="w-5 h-5 text-blue-400"></i> Virement
                    </div>
                    <p class="text-xs text-gray-400">Banque -> Autre Joueur</p>
                    
                    <!-- Search Bar Container -->
                    <div class="relative">
                        <input type="hidden" name="target_id" id="target_id" value="${state.selectedRecipient ? state.selectedRecipient.id : ''}" required>
                        <div class="relative">
                            <i data-lucide="search" class="w-4 h-4 absolute left-3 top-3.5 text-gray-500"></i>
                            <input type="text" 
                                    id="recipient_search"
                                    placeholder="Rechercher un citoyen..." 
                                    value="${state.selectedRecipient ? state.selectedRecipient.name : ''}"
                                    oninput="actions.searchRecipients(this.value)"
                                    class="glass-input p-3 pl-10 rounded-lg w-full text-sm placeholder-gray-500" autocomplete="off">
                            ${state.selectedRecipient ? `
                                <button type="button" onclick="actions.clearRecipient()" class="absolute right-3 top-3 text-gray-500 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>
                            ` : ''}
                        </div>
                        <!-- Container for dynamic results -->
                        <div id="search-results-container" class="absolute top-full left-0 right-0 bg-[#151515] border border-white/10 rounded-xl mt-1 max-h-48 overflow-y-auto z-50 shadow-2xl custom-scrollbar hidden">
                            <!-- JS inserts content here -->
                        </div>
                    </div>

                    <input type="text" name="description" placeholder="Motif (ex: Achat véhicule)" maxlength="50" class="glass-input p-3 rounded-lg w-full text-sm">
                    <input type="number" name="amount" placeholder="Montant" min="1" max="${state.bankAccount.bank_balance}" class="glass-input p-3 rounded-lg w-full" required>
                    <button type="submit" class="glass-btn bg-blue-600 hover:bg-blue-500 py-2 rounded-lg font-semibold text-sm shadow-lg shadow-blue-500/20 cursor-pointer transition-colors">Envoyer</button>
                </form>
            </div>

            <!-- History -->
            <div class="glass-panel rounded-2xl p-6">
                <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <i data-lucide="history" class="w-5 h-5 text-gray-400"></i> Historique des Transactions
                </h3>
                <div class="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    ${historyHtml}
                </div>
            </div>
        </div>
    `;
};