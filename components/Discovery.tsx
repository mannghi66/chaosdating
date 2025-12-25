
import React, { useState, useEffect, useCallback } from 'react';
// Session type is not exported in some versions of @supabase/supabase-js
type Session = any;
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import UserCard from './UserCard';
import MatchOverlay from './MatchOverlay';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface DiscoveryProps {
  session: Session;
  onOpenChat: (profile: Profile) => void;
}

const Discovery: React.FC<DiscoveryProps> = ({ session, onOpenChat }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [matchedUser, setMatchedUser] = useState<Profile | null>(null);

  const saveMatchToRegistry = (match: Profile) => {
    const registryKey = `matches_${session.user.id}`;
    const existingMatchesRaw = localStorage.getItem(registryKey);
    let existingMatches: Profile[] = [];
    
    try {
      if (existingMatchesRaw) {
        existingMatches = JSON.parse(existingMatchesRaw);
      }
    } catch (e) {
      console.error("Error parsing match registry", e);
    }

    // Avoid duplicates
    if (!existingMatches.find(m => m.id === match.id)) {
      const updatedMatches = [match, ...existingMatches];
      localStorage.setItem(registryKey, JSON.stringify(updatedMatches));
    }
  };

  const generateFakeProfiles = (count: number): Profile[] => {
    const fakeProfiles: Profile[] = [];
    const sampleUsernames = ['StarlightDreamer', 'QuantumLeaper', 'CosmicWanderer', 'NeonNinja', 'GlitchGamer', 'PixelPioneer', 'SynthwaveSurfer', 'RetroRider', 'ByteBard', 'DataDancer', 'CyberSamurai', 'CodeWizard', 'TechieTrekker', 'DigitalNomad', 'CloudChaser'];
    const sampleBios = [
        'Just a chaotic good bean looking for my other half.', 'Probably thinking about snacks. Or you.', 'Fluent in sarcasm and movie quotes.',
        'Trying to be the person my dog thinks I am.', 'I put the "pro" in procrastinate.', 'Looking for someone to share my Netflix password with.',
        'On a mission to find the best tacos.', 'Will steal your hoodies.'
    ];
    const sampleInterests = ['gaming', 'hiking', 'movies', 'memes', 'coding', 'live music', 'sleeping', 'true crime podcasts', 'thrifting', 'astrology', 'skincare', 'craft beer', 'tarot', 'making playlists', 'roller skating'];

    for (let i = 0; i < count; i++) {
        const username = sampleUsernames[Math.floor(Math.random() * sampleUsernames.length)] + Math.floor(Math.random() * 100);
        const birth_date = new Date(
            Date.now() - Math.floor(Math.random() * 15 * 365 + 18 * 365) * 24 * 60 * 60 * 1000
        ).toISOString().split('T')[0];

        const interests = [...new Set(Array.from({ length: Math.floor(Math.random() * 4) + 2 }, () => sampleInterests[Math.floor(Math.random() * sampleInterests.length)]))];

        fakeProfiles.push({
            id: `fake-${Math.random().toString(36).substr(2, 9)}`,
            username,
            bio: sampleBios[Math.floor(Math.random() * sampleBios.length)],
            interests,
            avatar_url: `https://api.dicebear.com/8.x/adventurer/svg?seed=${username}`,
            updated_at: new Date().toISOString(),
            birth_date,
            gemini_analysis: "Looks like you two could bond over your shared love for adventure and late-night talks. Sparks might fly!"
        });
    }
    return fakeProfiles;
  };

  const analyzeCompatibility = useCallback(async (myUserProfile: Profile, otherProfile: Profile) => {
    if (!process.env.API_KEY) return;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    setProfiles(currentProfiles =>
      currentProfiles.map(p =>
        p.id === otherProfile.id ? { ...p, gemini_analysis: 'loading' } : p
      )
    );

    const prompt = `
      Based on these two dating profiles, provide a short, fun, and quirky compatibility analysis (max 40 words).
      My Profile:
      - Bio: ${myUserProfile.bio}
      - Interests: ${(myUserProfile.interests || []).join(', ')}

      Their Profile:
      - Username: ${otherProfile.username}
      - Bio: ${otherProfile.bio}
      - Interests: ${(otherProfile.interests || []).join(', ')}

      Start the analysis with something engaging that speaks to me. Respond in English.
    `;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
      });
      const analysis = response.text;

      setProfiles(currentProfiles =>
        currentProfiles.map(p =>
          p.id === otherProfile.id ? { ...p, gemini_analysis: analysis } : p
        )
      );
    } catch (error) {
      console.error("Error with Gemini API:", error);
      let errorMessage = "Oops! Gemini is taking a nap. Try again later.";
      setProfiles(currentProfiles =>
        currentProfiles.map(p =>
          p.id === otherProfile.id ? { ...p, gemini_analysis: errorMessage } : p
        )
      );
    }
  }, []);

  const fetchMyProfile = useCallback(async () => {
    try {
      if (session.user.id === 'demo-user-id') {
        const saved = localStorage.getItem('demo-profile');
        if (saved) setMyProfile(JSON.parse(saved));
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error) throw error;
      if (data) setMyProfile(data);
    } catch (error: any) {
      console.error('Error fetching my profile:', error.message);
    }
  }, [session.user.id]);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (session.user.id === 'demo-user-id') {
        setProfiles(generateFakeProfiles(15));
        setIsDemoMode(true);
        setLoading(false);
        return;
      }

      const { data: actedOnUserIdsData, error: actedOnError } = await supabase
          .from('actions')
          .select('target_id')
          .eq('user_id', session.user.id);
      
      if (actedOnError) throw actedOnError;

      const actedOnUserIds = actedOnUserIdsData.map(item => item.target_id);
      const excludedIds = [session.user.id, ...actedOnUserIds];
      
      const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .not('id', 'in', `(${excludedIds.join(',')})`);

      if (error) throw error;
      
      if (data) {
        setProfiles(data);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [session.user.id]);
  
  useEffect(() => {
    fetchMyProfile();
    fetchProfiles();
  }, [fetchMyProfile, fetchProfiles]);

  useEffect(() => {
    if (myProfile && profiles.length > 0 && currentIndex < profiles.length && !profiles[currentIndex].gemini_analysis && process.env.API_KEY && !isDemoMode) {
      analyzeCompatibility(myProfile, profiles[currentIndex]);
    }
  }, [myProfile, profiles, currentIndex, analyzeCompatibility, isDemoMode]);

  const handleAction = async (targetUser: Profile, actionType: 'like' | 'dislike') => {
    if (isDemoMode) {
        if (actionType === 'like' && Math.random() > 0.3) { // Higher match rate for demo
            saveMatchToRegistry(targetUser);
            setMatchedUser(targetUser);
        } else {
            setCurrentIndex(prevIndex => prevIndex + 1);
        }
        return;
    }
    
    try {
      const { error } = await supabase.from('actions').insert({
        user_id: session.user.id,
        target_id: targetUser.id,
        action_type: actionType,
      });

      if (error) throw error;

      if (actionType === 'like') {
        const { data: reciprocalLike } = await supabase
          .from('actions')
          .select('*')
          .eq('user_id', targetUser.id)
          .eq('target_id', session.user.id)
          .eq('action_type', 'like')
          .maybeSingle();

        if (reciprocalLike) {
          saveMatchToRegistry(targetUser);
          setMatchedUser(targetUser);
        } else {
          setCurrentIndex(prevIndex => prevIndex + 1);
        }
      } else {
        setCurrentIndex(prevIndex => prevIndex + 1);
      }

    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-primary animate-pulse font-medium">Finding your potential match...</p>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="text-center p-10 bg-white/50 backdrop-blur-md rounded-2xl max-w-md mx-auto mt-20 shadow-xl">
        <div className="mb-6 flex justify-center">
             <div className="text-6xl">🏜️</div>
        </div>
        <h3 className="text-2xl font-bold text-gray-700">No more people left to show!</h3>
        <p className="mt-2 text-gray-500">Check back later or try Demo Mode to see more people.</p>
        <button
          onClick={() => {
            setProfiles(generateFakeProfiles(10));
            setIsDemoMode(true);
            setCurrentIndex(0);
          }}
          className="mt-6 px-8 py-3 bg-primary text-white font-semibold rounded-full shadow-lg hover:bg-pink-600 transition-all hover:scale-105 active:scale-95"
        >
          🚀 Try Demo Mode
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto relative">
      {matchedUser && (
        <MatchOverlay 
          myProfile={myProfile!} 
          matchedProfile={matchedUser} 
          onClose={() => {
            setMatchedUser(null);
            setCurrentIndex(prev => prev + 1);
          }}
          onChat={() => {
            const m = matchedUser;
            setMatchedUser(null);
            onOpenChat(m);
          }}
        />
      )}
      <UserCard
        profile={profiles[currentIndex]}
        onLike={() => handleAction(profiles[currentIndex], 'like')}
        onDislike={() => handleAction(profiles[currentIndex], 'dislike')}
        isDemo={isDemoMode}
      />
    </div>
  );
};

export default Discovery;
