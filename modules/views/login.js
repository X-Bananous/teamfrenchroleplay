import { CONFIG } from '../config.js';
import { state } from '../state.js';

export const LoginView = () => `
    <div class="flex-1 flex flex-col relative overflow-hidden h-full w-full">
        <div class="landing-gradient-bg"></div>
        
        <nav class="relative z-10 w-full p-8 flex justify-between items-center animate-fade-in">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <i data-lucide="shield-check" class="w-5 h-5 text-white"></i>
                </div>
                <span class="font-bold text-xl tracking-tight">TFRP</span>
            </div>
            <a href="${CONFIG.INVITE_URL}" target="_blank" class="glass-btn-secondary px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-white/10 transition-all cursor-pointer">
                <i data-lucide="users" class="w-4 h-4"></i>
                Rejoindre Discord
            </a>
        </nav>

        <div class="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-10 animate-slide-up">
            <div class="mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md inline-flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span class="text-xs font-medium text-gray-300 tracking-wide uppercase">Serveur Ouvert • ERLC Roblox</span>
            </div>
            
            <h1 class="landing-hero-text mb-6">
                Team French<br>RolePlay
            </h1>
            
            <p class="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
                L'expérience de jeu de rôle ultime à Los Angeles. <br class="hidden md:block">
                Rejoignez une communauté passionnée, créez votre histoire et gravissez les échelons.
            </p>

            <div class="flex flex-col md:flex-row gap-4 w-full max-w-md md:max-w-none justify-center">
                ${state.isLoggingIn ? `
                    <button disabled class="glass-btn h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 w-64">
                        <div class="loader-spinner w-5 h-5 border-2"></div>
                        Connexion...
                    </button>
                ` : `
                    <button onclick="actions.login()" class="glass-btn h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-transform hover:scale-105 cursor-pointer shadow-[0_0_40px_rgba(10,132,255,0.3)]">
                        <i data-lucide="gamepad-2" class="w-6 h-6"></i>
                        Connexion Citoyen
                    </button>
                `}
                <a href="${CONFIG.INVITE_URL}" target="_blank" class="glass-btn-secondary h-14 px-8 rounded-full font-bold text-lg flex items-center justify-center gap-3 transition-transform hover:scale-105 cursor-pointer bg-white/5 hover:bg-white/10">
                    <i data-lucide="message-circle" class="w-6 h-6"></i>
                    Communauté
                </a>
            </div>
        </div>

        <div class="relative z-10 p-8 flex justify-center gap-12 text-center animate-fade-in opacity-60">
            <div>
                <div class="text-2xl font-bold text-white">40+</div>
                <div class="text-xs text-gray-500 uppercase tracking-widest">Joueurs</div>
            </div>
            <div>
                <div class="text-2xl font-bold text-white">LA</div>
                <div class="text-xs text-gray-500 uppercase tracking-widest">Map</div>
            </div>
            <div>
                <div class="text-2xl font-bold text-white">RP</div>
                <div class="text-xs text-gray-500 uppercase tracking-widest">Strict</div>
            </div>
        </div>
    </div>
`;

export const AccessDeniedView = () => `
    <div class="flex-1 flex items-center justify-center p-6 animate-fade-in relative overflow-hidden h-full">
        <div class="glass-panel border-red-500/30 w-full max-w-md p-10 rounded-[40px] flex flex-col items-center text-center relative z-10 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div class="mb-6 relative">
                <div class="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center shadow-lg shadow-red-500/20 mb-4 mx-auto animate-pulse">
                    <i data-lucide="lock" class="w-10 h-10 text-red-500"></i>
                </div>
                <h1 class="text-2xl font-bold text-white mb-2">Accès Refusé</h1>
                <p class="text-gray-400 text-sm">Vous n'êtes pas membre du serveur Discord TFRP.</p>
            </div>
            <div class="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-200 mb-8 w-full">
                Pour accéder au panel et créer votre personnage, vous devez rejoindre notre communauté Discord.
            </div>
            <a href="${CONFIG.INVITE_URL}" target="_blank" class="w-full bg-white text-black hover:bg-gray-200 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer mb-3">
                <i data-lucide="user-plus" class="w-5 h-5"></i>
                Rejoindre le Discord
            </a>
            <button onclick="actions.logout()" class="text-gray-500 text-xs hover:text-white transition-colors mt-4">
                Retour à l'accueil
            </button>
        </div>
    </div>
`;