
import React, { useState, useEffect } from 'react';
// Session type is not exported in some versions of @supabase/supabase-js
type Session = any;
import { supabase } from '../services/supabase';
import { Profile } from '../types';

interface MatchesProps {
  session: Session;
  onOpenChat: (profile: Profile) => void;
}

interface MatchWithLastMessage extends Profile {
  lastMessage?: string;
  lastTimestamp?: number;
}

const Matches: React.FC<MatchesProps> = ({ session, onOpenChat }) => {
  const [matches, setMatches] = useState<MatchWithLastMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        let allMatchedProfiles: Profile[] = [];

        // 1. Fetch matches from Local Registry (Works for both Demo and Real mode)
        const registryKey = `matches_${session.user.id}`;
        const savedRegistry = localStorage.getItem(registryKey);
        if (savedRegistry) {
          try {
            allMatchedProfiles = JSON.parse(savedRegistry);
          } catch (e) {
            console.error("Registry parse error", e);
          }
        }

        // 2. If in Real mode, also sync with Supabase
        if (session.user.id !== 'demo-user-id') {
          const { data: myLikes } = await supabase
            .from('actions')
            .select('target_id')
            .eq('user_id', session.user.id)
            .eq('action_type', 'like');

          const myLikedIds = myLikes?.map(l => l.target_id) || [];

          if (myLikedIds.length > 0) {
            const { data: theirLikes } = await supabase
              .from('actions')
              .select('user_id')
              .eq('target_id', session.user.id)
              .eq('action_type', 'like');

            const likedMeIds = theirLikes?.map(l => l.user_id) || [];
            const dbMatchIds = myLikedIds.filter(id => likedMeIds.includes(id));

            if (dbMatchIds.length > 0) {
              const { data: dbProfiles } = await supabase
                .from('profiles')
                .select('*')
                .in('id', dbMatchIds);
              
              if (dbProfiles) {
                const dbProfilesClean = dbProfiles as Profile[];
                dbProfilesClean.forEach(dbp => {
                   if (!allMatchedProfiles.find(m => m.id === dbp.id)) {
                     allMatchedProfiles.push(dbp);
                   }
                });
                localStorage.setItem(registryKey, JSON.stringify(allMatchedProfiles));
              }
            }
          }
        }

        // 3. Augment all matches with chat history from localStorage
        const matchesWithHistory: MatchWithLastMessage[] = allMatchedProfiles.map(profile => {
          const chatKey = `chat_${session.user.id}_${profile.id}`;
          const savedChat = localStorage.getItem(chatKey);
          if (savedChat) {
            try {
              const msgs = JSON.parse(savedChat);
              if (msgs.length > 0) {
                const last = msgs[msgs.length - 1];
                return { 
                  ...profile, 
                  lastMessage: last.text, 
                  lastTimestamp: last.timestamp 
                };
              }
            } catch (e) {}
          }
          return profile;
        });

        // 4. Sort by timestamp (newest conversation first)
        matchesWithHistory.sort((a, b) => (b.lastTimestamp || 0) - (a.lastTimestamp || 0));

        setMatches(matchesWithHistory);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [session.user.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-16 h-16 bg-pink-100 rounded-full mb-4"></div>
        <p className="text-primary font-medium">Loading your matches...</p>
      </div>
    );
  }

  const newMatches = matches.filter(m => !m.lastMessage);
  const activeChats = matches.filter(m => m.lastMessage);

  return (
    <div className="max-w-xl mx-auto animate-fade-in space-y-8 pb-10">
      {/* New Matches Header */}
      {newMatches.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-4 ml-1">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">New Matches</h3>
             <span className="bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-full">{newMatches.length}</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {newMatches.map((match) => (
              <div 
                key={match.id} 
                onClick={() => onOpenChat(match)}
                className="flex-shrink-0 w-20 flex flex-col items-center gap-1 group cursor-pointer"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary p-0.5 group-hover:scale-110 transition-transform shadow-lg shadow-pink-100">
                  <img 
                    src={match.avatar_url || `https://api.dicebear.com/8.x/adventurer/svg?seed=${match.username}`} 
                    className="w-full h-full rounded-full object-cover" 
                    alt={match.username} 
                  />
                </div>
                <span className="text-[10px] font-bold text-gray-700 truncate w-full text-center">{match.username}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Messages List */}
      <section>
        <div className="flex justify-between items-center mb-4 ml-1">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Messages</h3>
            {activeChats.length > 0 && (
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Sort: Recent</span>
            )}
        </div>
        
        {matches.length === 0 ? (
          <div className="text-center py-24 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/60 shadow-inner">
            <p className="text-6xl mb-6 grayscale opacity-50">💌</p>
            <p className="text-gray-800 font-black text-xl tracking-tight">Your inbox is a quiet zone</p>
            <p className="text-gray-500 text-sm mt-2 px-12 leading-relaxed">Swipe right on some cuties in Discovery to start seeing matches here!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeChats.length === 0 && newMatches.length > 0 && (
              <div className="text-center py-10 bg-pink-50/50 rounded-2xl border border-dashed border-pink-200">
                <p className="text-pink-400 text-xs font-bold uppercase tracking-widest">Tap a profile above to start a chat ✨</p>
              </div>
            )}
            {activeChats.map((match) => (
              <div 
                key={match.id} 
                onClick={() => onOpenChat(match)}
                className="group flex items-center gap-4 p-4 bg-white hover:bg-pink-50/80 rounded-2xl transition-all cursor-pointer shadow-sm hover:shadow-md border border-pink-50/50"
              >
                <div className="relative flex-shrink-0">
                  <img 
                    src={match.avatar_url || `https://api.dicebear.com/8.x/adventurer/svg?seed=${match.username}`} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-all" 
                    alt={match.username} 
                  />
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{match.username}</h4>
                    {match.lastTimestamp && (
                      <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
                        {new Date(match.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate pr-4 italic">
                    {match.lastMessage || "Start the chaos..."}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-primary">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Matches;
