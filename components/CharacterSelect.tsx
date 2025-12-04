import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { User, Character, CharacterStatus } from '../types';
import { Plus, User as UserIcon, Clock, XCircle, Play } from 'lucide-react';

interface CharacterSelectProps {
  user: User;
  onSelect: (char: Character) => void;
  onCreateNew: () => void;
}

const CharacterSelect: React.FC<CharacterSelectProps> = ({ user, onSelect, onCreateNew }) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChars = async () => {
      // Real fetch
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id);

      if (error || !data) {
         // Use mock data if fetch fails (e.g., table missing)
         // Only mock if we have no chars, to simulate fresh or existing user
         if (characters.length === 0) {
            // Uncomment to test with mock data if Supabase fails
            // setCharacters([{ id: 'mock1', user_id: user.id, first_name: 'Test', last_name: 'Char', status: CharacterStatus.ACCEPTED, birth_date: '2000-01-01', birth_place: 'LS', age: 24, created_at: '' }]);
         }
      } else {
        setCharacters(data);
      }
      setLoading(false);
    };

    fetchChars();
  }, [user.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[url('https://picsum.photos/1920/1080?grayscale')] bg-cover bg-center flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"></div>
      
      <div className="relative z-10 w-full max-w-4xl">
        <h1 className="text-3xl font-bold text-white text-center mb-12">Select Your Citizen</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {characters.map((char) => (
            <div 
              key={char.id} 
              className={`bg-slate-800/80 rounded-xl p-6 border transition-all duration-300 ${
                char.status === CharacterStatus.ACCEPTED 
                  ? 'border-indigo-500/50 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 cursor-pointer group' 
                  : 'border-slate-700 opacity-75'
              }`}
              onClick={() => char.status === CharacterStatus.ACCEPTED && onSelect(char)}
            >
              <div className="flex justify-between items-start mb-4">
                 <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 group-hover:border-indigo-400 transition-colors">
                    <UserIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-400" />
                 </div>
                 <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    char.status === CharacterStatus.ACCEPTED ? 'bg-emerald-500/20 text-emerald-400' :
                    char.status === CharacterStatus.REJECTED ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                 }`}>
                   {char.status}
                 </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{char.first_name} {char.last_name}</h3>
              <p className="text-slate-400 text-sm mb-6">Born in {char.birth_place} • {char.age} Years Old</p>
              
              {char.status === CharacterStatus.ACCEPTED ? (
                <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                  <Play className="w-4 h-4 fill-current" /> Enter City
                </button>
              ) : char.status === CharacterStatus.PENDING ? (
                <div className="w-full bg-slate-700/50 text-slate-400 py-3 rounded-lg font-medium flex items-center justify-center gap-2 border border-slate-700 border-dashed">
                  <Clock className="w-4 h-4" /> Awaiting Staff Approval
                </div>
              ) : (
                <div className="w-full bg-red-900/20 text-red-400 py-3 rounded-lg font-medium flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> Application Rejected
                </div>
              )}
            </div>
          ))}

          {characters.length < 2 && (
            <button 
              onClick={onCreateNew}
              className="group bg-slate-800/40 hover:bg-slate-800 rounded-xl p-6 border-2 border-dashed border-slate-700 hover:border-indigo-500 flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400 transition-all min-h-[250px]"
            >
              <div className="w-16 h-16 rounded-full bg-slate-700/50 group-hover:bg-indigo-500/20 flex items-center justify-center mb-4 transition-colors">
                <Plus className="w-8 h-8" />
              </div>
              <span className="text-lg font-semibold">Create New Character</span>
              <span className="text-sm mt-2 opacity-60">Slots Available: {2 - characters.length}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterSelect;
