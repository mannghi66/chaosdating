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

  const ai = process.env.API_KEY ? new GoogleGenAI({apiKey: process.env.API_KEY}) : null;
  
  if (!process.env.API_KEY) {
      console.error("Gemini API Key not found. Please ensure API_KEY is set in your environment variables.");
  }

  const analyzeCompatibility = useCallback(async (myUserProfile: Profile, otherProfile: Profile) => {
    if (!ai) return;

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
          .select('target_user_id')
          .eq('user_id', session.user.id);
      
      if (actedOnError) throw actedOnError;

      const actedOnUserIds = actedOnUserIdsData.map(item => item.target_user_id);
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
    if (myProfile && profiles.length > 0 && currentIndex < profiles.length && !profiles[currentIndex].gemini_analysis && ai) {
      analyzeCompatibility(myProfile, profiles[currentIndex]);
    }
  }, [myProfile, profiles, currentIndex, analyzeCompatibility, ai]);

  const handleAction = async (targetUserId: string, actionType: 'like' | 'dislike') => {
    try {
      const { error } = await supabase.from('actions').insert({
        user_id: session.user.id,
        target_user_id: targetUserId,
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
        <h3 className="text-2xl font-bold text-gray-700">You've seen everyone!</h3>
        <p className="mt-2 text-gray-500">Check back later for new profiles.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <UserCard
        profile={profiles[currentIndex]}
        onLike={() => handleAction(profiles[currentIndex].id, 'like')}
        onDislike={() => handleAction(profiles[currentIndex].id, 'dislike')}
      />
    </div>
  );
};

export default Discovery;
