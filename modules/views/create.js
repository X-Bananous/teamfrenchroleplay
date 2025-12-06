
import { CONFIG } from '../config.js';

export const CharacterCreateView = () => `
    <div class="flex-1 flex items-center justify-center p-6 animate-fade-in h-full overflow-y-auto custom-scrollbar">
        <div class="glass-panel w-full max-w-2xl p-8 rounded-[40px] relative my-auto">
            <div class="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                <div>
                    <h2 class="text-2xl font-bold text-white">Nouveau Citoyen</h2>
                    <p class="text-gray-400 text-xs uppercase tracking-widest mt-1">Formulaire d'immigration Los Angeles</p>
                </div>
                <button onclick="actions.cancelCreate()" class="glass-btn-secondary p-2 rounded-lg hover:bg-white/10 cursor-pointer">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <form onsubmit="actions.submitCharacter(event)" class="space-y-6">
                <div class="grid grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="text-xs font-bold text-gray-500 uppercase ml-1">Prénom RP</label>
                        <input type="text" name="first_name" required placeholder="John" class="glass-input w-full p-3 rounded-xl">
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-bold text-gray-500 uppercase ml-1">Nom RP</label>
                        <input type="text" name="last_name" required placeholder="Doe" class="glass-input w-full p-3 rounded-xl">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-6">
                    <div class="space-y-2">
                        <label class="text-xs font-bold text-gray-500 uppercase ml-1">Date de naissance</label>
                        <input type="date" name="birth_date" required class="glass-input w-full p-3 rounded-xl text-gray-300">
                    </div>
                    <div class="space-y-2">
                        <label class="text-xs font-bold text-gray-500 uppercase ml-1">Lieu de naissance</label>
                        <input type="text" name="birth_place" required value="Los Angeles" placeholder="Los Angeles" class="glass-input w-full p-3 rounded-xl">
                    </div>
                </div>

                <!-- ALIGNMENT SELECTION -->
                <div class="space-y-2">
                    <label class="text-xs font-bold text-gray-500 uppercase ml-1">Orientation Initiale</label>
                    <div class="grid grid-cols-2 gap-4">
                        <label class="cursor-pointer">
                            <input type="radio" name="alignment" value="legal" class="peer sr-only" required>
                            <div class="p-4 rounded-xl bg-white/5 border border-white/5 peer-checked:bg-blue-600/20 peer-checked:border-blue-500 hover:bg-white/10 transition-all text-center h-full">
                                <div class="w-10 h-10 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 mb-2">
                                    <i data-lucide="briefcase" class="w-5 h-5"></i>
                                </div>
                                <div class="font-bold text-white text-sm">Légal / Civil</div>
                                <div class="text-[10px] text-gray-400 mt-1">Services publics, entreprises, vie rangée.</div>
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="alignment" value="illegal" class="peer sr-only">
                            <div class="p-4 rounded-xl bg-white/5 border border-white/5 peer-checked:bg-red-600/20 peer-checked:border-red-500 hover:bg-white/10 transition-all text-center h-full">
                                <div class="w-10 h-10 mx-auto bg-red-500/20 rounded-full flex items-center justify-center text-red-400 mb-2">
                                    <i data-lucide="skull" class="w-5 h-5"></i>
                                </div>
                                <div class="font-bold text-white text-sm">Illégal / Criminel</div>
                                <div class="text-[10px] text-gray-400 mt-1">Gangs, mafias, marché noir.</div>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 items-start">
                    <i data-lucide="info" class="w-5 h-5 text-blue-400 shrink-0 mt-0.5"></i>
                    <p class="text-xs text-blue-100/80 leading-relaxed">
                        Le choix d'orientation détermine l'accès aux services (Public vs Marché Noir). 
                        Vous pourrez changer via RP plus tard.
                    </p>
                </div>

                <div class="pt-4 flex justify-end">
                    <button type="submit" class="glass-btn px-8 py-3 rounded-xl font-semibold flex items-center gap-2 cursor-pointer">
                        <i data-lucide="save" class="w-4 h-4"></i> Sauvegarder (Cloud)
                    </button>
                </div>
            </form>
        </div>
    </div>
`;