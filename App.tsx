import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import CharacterSelect from './components/CharacterSelect';
import CharacterCreation from './components/CharacterCreation';
import Hub from './components/Hub';
import { User, Character } from './types';
import { supabase } from './services/supabaseClient';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [view, setView] = useState<'login' | 'select' | 'create' | 'hub'>('login');
  const navigate = useNavigate();

  // Handle Discord OAuth Redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1)); // remove #
      const accessToken = params.get('access_token');
      
      if (accessToken) {
        // Fetch discord user data
        fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then(res => res.json())
        .then(discordUser => {
          if (discordUser.id) {
            const newUser: User = {
              id: discordUser.id,
              username: discordUser.username,
              avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
              isStaff: true, // Auto-staff for demo purposes, in real app check DB or role
            };
            setUser(newUser);
            setView('select');
            // Clean URL
            window.history.pushState("", document.title, window.location.pathname);
          }
        })
        .catch(err => console.error("Discord Auth Error", err));
      }
    }
  }, []);

  const handleMockLogin = (mockUser: User) => {
    setUser(mockUser);
    setView('select');
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedChar(null);
    setView('login');
  };

  const handleCharacterSelect = (char: Character) => {
    setSelectedChar(char);
    setView('hub');
  };

  const handleCharacterCreated = () => {
    setView('select');
  };

  if (view === 'login') {
    return <Login onLoginMock={handleMockLogin} />;
  }

  if (!user) {
    return <Login onLoginMock={handleMockLogin} />;
  }

  if (view === 'create') {
    return (
      <div className="min-h-screen bg-slate-900 text-white pt-10">
        <CharacterCreation 
          user={user} 
          onBack={() => setView('select')} 
          onCreated={handleCharacterCreated} 
        />
      </div>
    );
  }

  if (view === 'hub' && selectedChar) {
    return <Hub user={user} character={selectedChar} onLogout={handleLogout} />;
  }

  return (
    <CharacterSelect 
      user={user} 
      onSelect={handleCharacterSelect} 
      onCreateNew={() => setView('create')} 
    />
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
