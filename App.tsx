import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './services/supabase';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Discovery from './components/Discovery';

// Define a simple HeartIcon component for the navigation
const HeartIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-6 h-6 ${className}`}
  >
    <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-1.383-.597 15.218 15.218 0 0 1-4.217-2.734c-1.12-1.14-2.06-2.553-2.753-4.14C.79 11.533 0 9.888 0 8.25c0-4.42 3.58-8 8-8s8 3.58 8 8c0 1.638-.79 3.283-1.928 4.783a15.247 15.247 0 0 1-4.217 2.734 15.218 15.218 0 0 1-1.383.597l-.022.012-.007.003h-.004a.75.75 0 0 1-.65-.632Z" />
  </svg>
);


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<'discovery' | 'profile'>('discovery');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  } else {
    return (
      <div className="min-h-screen bg-pink-50 text-gray-800 font-sans">
        <nav className="bg-white/70 backdrop-blur-lg shadow-md sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <HeartIcon className="text-primary w-8 h-8" />
                <span className="text-2xl font-bold text-primary">chaosdating</span>
            </div>
            <div>
              <button onClick={() => setView('discovery')} className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'discovery' ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>Discovery</button>
              <button onClick={() => setView('profile')} className={`px-4 py-2 rounded-md text-sm font-medium ${view === 'profile' ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>Profile</button>
              <button onClick={() => supabase.auth.signOut()} className="ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-pink-600">
                Sign Out
              </button>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {view === 'discovery' ? <Discovery session={session} /> : <Profile session={session} />}
        </main>
      </div>
    );
  }
};

export default App;
