import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Character, CharacterStatus } from '../types';
import { Check, X, Search, ShieldAlert } from 'lucide-react';

const StaffPanel: React.FC = () => {
  const [applications, setApplications] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    setLoading(true);
    // In a real app, query based on status = 'pending'
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('status', CharacterStatus.PENDING);

    if (error) {
      console.error("Error fetching apps:", error);
      // Mock data for demo if DB is empty or fails
      setApplications([
        {
          id: 'mock-1',
          user_id: 'user-2',
          first_name: 'Tommy',
          last_name: 'Vercetti',
          birth_date: '1980-05-15',
          birth_place: 'Liberty City',
          age: 43,
          status: CharacterStatus.PENDING,
          created_at: new Date().toISOString()
        }
      ]);
    } else {
      setApplications(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDecision = async (id: string, decision: CharacterStatus) => {
    // Optimistic UI update
    setApplications(prev => prev.filter(app => app.id !== id));

    try {
      await supabase
        .from('characters')
        .update({ status: decision })
        .eq('id', id);
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="text-indigo-500" />
          Staff Administration
        </h2>
        <div className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
          PENDING: {applications.length}
        </div>
      </div>

      <div className="p-4 border-b border-slate-700">
         <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search application ID..." 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading applications...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
            No pending applications found.
          </div>
        ) : (
          applications.map((app) => (
            <div key={app.id} className="bg-slate-900 rounded-lg p-4 border border-slate-700 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white">{app.first_name} {app.last_name}</h3>
                  <div className="text-sm text-slate-400 mt-1 space-y-1">
                    <p>DOB: <span className="text-slate-200">{app.birth_date} (Age: {app.age})</span></p>
                    <p>Place: <span className="text-slate-200">{app.birth_place}</span></p>
                    <p className="text-xs mt-2 text-slate-500">ID: {app.id}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleDecision(app.id, CharacterStatus.ACCEPTED)}
                  className="flex-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-600/50 py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Check className="w-4 h-4" /> Accept
                </button>
                <button
                  onClick={() => handleDecision(app.id, CharacterStatus.REJECTED)}
                  className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/50 py-2 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StaffPanel;
