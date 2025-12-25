
import React, { useState, useEffect } from 'react';
// Session type is not exported in some versions of @supabase/supabase-js
type Session = any;
import { supabase } from './services/supabase';
import Auth from './components/Auth';
import Profile from './components/Profile';
import Discovery from './components/Discovery';
import Matches from './components/Matches';
import ChatRoom from './components/ChatRoom';
import { Profile as ProfileType } from './types';

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
  const [isGuest, setIsGuest] = useState(false);
  const [view, setView] = useState<'discovery' | 'profile' | 'matches'>('discovery');
  const [activeChat, setActiveChat] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  // Create a mock session for Guest Mode
  const mockSession: Session = {
    access_token: 'demo-token',
    refresh_token: 'demo-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'demo-user-id',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: 'demo@chaosdating.com',
    } as any,
  };

  useEffect(() => {
    // Cast to any to bypass Property 'getSession' does not exist error
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setLoading(false);
    });

    // Cast to any to bypass Property 'onAuthStateChange' does not exist error
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
      setSession(session);
      if (session) setIsGuest(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleEnterDemo = () => {
    setIsGuest(true);
    setSession(mockSession);
  };

  const handleSignOut = () => {
    if (isGuest) {
      setIsGuest(false);
      setSession(null);
    } else {
      // Cast to any to bypass Property 'signOut' does not exist error
      (supabase.auth as any).signOut();
    }
  };

  const openChat = (profile: ProfileType) => {
    setActiveChat(profile);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-primary animate-pulse font-bold text-xl">Loading chaos...</div>;
  }

  if (!session && !isGuest) {
    return <Auth onEnterDemo={handleEnterDemo} />;
  }

  // Render ChatRoom if activeChat is set
  if (activeChat) {
    return (
      <ChatRoom 
        match={activeChat} 
        onBack={() => setActiveChat(null)} 
        session={session!} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 text-gray-800 font-sans pb-20 md:pb-0">
      {isGuest && (
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold py-1 text-center uppercase tracking-widest">
          Demo Mode: Data will not be permanently saved
        </div>
      )}
      <nav className="bg-white/70 backdrop-blur-lg shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('discovery')}>
              <HeartIcon className="text-primary w-8 h-8" />
              <span className="text-2xl font-bold text-primary hidden sm:inline">chaosdating</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setView('discovery')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'discovery' ? 'text-primary bg-pink-100' : 'text-gray-500 hover:text-primary'}`}>Discovery</button>
            <button onClick={() => setView('matches')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'matches' ? 'text-primary bg-pink-100' : 'text-gray-500 hover:text-primary'}`}>Matches</button>
            <button onClick={() => setView('profile')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'profile' ? 'text-primary bg-pink-100' : 'text-gray-500 hover:text-primary'}`}>Profile</button>
            <button onClick={handleSignOut} className="hidden sm:block ml-4 px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-pink-600 transition-all shadow-lg shadow-pink-200">
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto p-4 md:p-8">
        {view === 'discovery' && <Discovery session={session!} onOpenChat={openChat} />}
        {view === 'matches' && <Matches session={session!} onOpenChat={openChat} />}
        {view === 'profile' && <Profile session={session!} />}
      </main>
    </div>
  );
};

export default App;
