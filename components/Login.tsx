import React from 'react';
import { DISCORD_CLIENT_ID, REDIRECT_URI } from '../constants';
import { User } from '../types';

interface LoginProps {
  onLoginMock: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginMock }) => {
  const handleDiscordLogin = () => {
    // Construct Discord OAuth URL
    const scope = encodeURIComponent('identify');
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${scope}`;
    window.location.href = url;
  };

  const handleDevLogin = () => {
    // Mock login for development/demo purposes since Redirect URI might not match
    const mockUser: User = {
      id: 'mock-user-123',
      username: 'RP_Player_One',
      avatar: 'https://picsum.photos/100',
      isStaff: true, // Auto-staff for demo to show panel
    };
    onLoginMock(mockUser);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('https://picsum.photos/1920/1080?grayscale&blur=2')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <div className="relative z-10 bg-slate-900/90 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter">RP VERSE</h1>
          <p className="text-slate-400">Enter the ultimate roleplay experience.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleDiscordLogin}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 group"
          >
            <svg className="w-6 h-6 fill-current" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.89,105.89,0,0,0,126.6,80.22c1.24-23.28-3.28-47.54-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
            </svg>
            Connect with Discord
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-600"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">Or (For Demo)</span>
            </div>
          </div>

          <button
            onClick={handleDevLogin}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
          >
            Dev Bypass (Mock Login)
          </button>
        </div>
        
        <p className="mt-8 text-xs text-slate-500">
          By connecting, you agree to our server rules and terms of service.
        </p>
      </div>
    </div>
  );
};

export default Login;
