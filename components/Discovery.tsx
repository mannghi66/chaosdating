import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import UserCard from './UserCard';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

interface DiscoveryProps {
  session: Session;
}

const Discovery: React.FC<DiscoveryProps> = ({ session }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const ai = process.env.API_KEY ? new GoogleGenAI({apiKey: process.env.API_KEY}) : null;
  
  if (!process.env.API_KEY) {
      console.error("Gemini API Key not found. Please ensure API_KEY is set in your environment variables.");
  }

    const generateFakeProfiles = (count: number): Profile[] => {
        const fakeProfiles: Profile[] = [];
        const sampleUsernames = ['StarlightDreamer', 'QuantumLeaper', 'CosmicWanderer', 'NeonNinja', 'GlitchGamer', 'PixelPioneer', 'SynthwaveSurfer', 'RetroRider', 'ByteBard', 'DataDancer', 'CyberSamurai', 'CodeWizard', 'TechieTrekker', 'DigitalNomad', 'CloudChaser'];
        const sampleBios = [
            'Just a chaotic good bean looking for my other half.', 'Probably thinking about snacks. Or you.', 'Fluent in sarcasm and movie quotes.',
            'Trying to be the person my dog thinks I am.', 'I put the "pro" in procrastinate.', 'Looking for someone to share my Netflix password with.',
            'On a mission to find the best tacos.', 'Will steal your hoodies.'
        ];
        const sampleInterests = ['gaming', 'hiking', 'binge-watching', 'memes', 'coding', 'live music', 'sleeping', 'true crime podcasts', 'thrifting', 'astrology', 'skincare', 'craft beer', 'tarot cards', 'making playlists', 'roller skating'];

        for (let i = 0; i < count; i++) {
            const username = sampleUsernames[Math.floor(Math.random() * sampleUsernames.length)] + Math.floor(Math.random() * 100);
            const birth_date = new Date(
                Date.now() - Math.floor(Math.random() * 15 * 365 + 18 * 365) * 24 * 60 * 60 * 1000
            ).toISOString().split('T')[0];

            const interests = [...new Set(Array.from({ length: Math.floor(Math.random() * 4) + 2 }, () => sampleInterests[Math.floor(Math.random() * sampleInterests.length)]))];

            fakeProfiles.push({
                id: `fake-${i}`,
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
    if (!ai) return;

    // Set a loading state
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

      Start the analysis with something engaging that speaks to me.
    `;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
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
      let errorMessage = "Oops! Gemini is sleeping on the job. Try again later.";
      if (error instanceof Error && error.message.toLowerCase().includes('fetch')) {
          errorMessage = "Network issue! Couldn't reach Gemini. Please check your connection.";
      }
      // Set an error state
      setProfiles(currentProfiles =>
        currentProfiles.map(p =>
          p.id === otherProfile.id ? { ...p, gemini_analysis: errorMessage } : p
        )
      );
    }
  }, [ai]);

  const fetchMyProfile = useCallback(async () => {
    try {
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
    if (myProfile && profiles.length > 0 && currentIndex < profiles.length && !profiles[currentIndex].gemini_analysis && ai && !isDemoMode) {
      analyzeCompatibility(myProfile, profiles[currentIndex]);
    }
  }, [myProfile, profiles, currentIndex, analyzeCompatibility, ai, isDemoMode]);

  const handleAction = async (targetUserId: string, actionType: 'like' | 'dislike') => {
    if (isDemoMode) {
        setCurrentIndex(prevIndex => prevIndex + 1);
        return;
    }
    
    try {
      const { error } = await supabase.from('actions').insert({
        user_id: session.user.id,
        target_id: targetUserId,
        action_type: actionType,
      });

      if (error) throw error;

      setCurrentIndex(prevIndex => prevIndex + 1);

    } catch (error: any) {
      setError(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-primary">Finding your potential matches...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-xl text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="text-center p-10">
        <h3 className="text-2xl font-bold text-gray-700">{isDemoMode ? "You've seen all the demo profiles!" : "You've seen everyone!"}</h3>
        <p className="mt-2 text-gray-500">{isDemoMode ? "Want to start over?" : "Check back later for new profiles, or enter demo mode."}</p>
        <button
          onClick={() => {
            if (isDemoMode) {
                 window.location.reload();
            } else {
                setProfiles(generateFakeProfiles(1000));
                setIsDemoMode(true);
                setCurrentIndex(0);
            }
          }}
          className="mt-4 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-pink-600 transition-colors"
        >
          {isDemoMode ? "🔄 Restart" : "🚀 Try Demo Mode"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <UserCard
        profile={profiles[currentIndex]}
        onLike={() => handleAction(profiles[currentIndex].id, 'like')}
        onDislike={() => handleAction(profiles[currentIndex].id, 'dislike')}
        isDemo={isDemoMode}
      />
    </div>
  );
};

export default Discovery;