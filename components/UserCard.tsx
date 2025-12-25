
import React from 'react';
import { Profile } from '../types';

interface UserCardProps {
  profile: Profile;
  onLike: (profileId: string) => void;
  onDislike: (profileId: string) => void;
  isDemo?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ profile, onLike, onDislike, isDemo }) => {
  const CheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 0 1 1.04-.208Z" clipRule="evenodd" /></svg>;
  const XMarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>;

  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(profile.birth_date);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden transition-transform duration-500 transform hover:scale-105 relative">
      {isDemo && (
        <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full transform rotate-12 z-10">
          DEMO
        </div>
      )}
      <img
        src={profile.avatar_url || `https://api.dicebear.com/8.x/adventurer/svg?seed=${profile.username}`}
        alt={profile.username}
        className="w-full h-96 object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
        <h3 className="text-3xl font-bold">
            {profile.username}
            {age && <span className="font-light">, {age}</span>}
        </h3>
        <p className="mt-2 text-gray-200">{profile.bio}</p>
        {profile.interests && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span key={interest} className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {interest}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 min-h-[96px]"> {/* Wrapper to prevent layout shift */}
          {profile.gemini_analysis && (
              <div className="p-3 bg-pink-500/20 backdrop-blur-sm rounded-lg border border-pink-500/30 animate-fade-in">
                <p className="text-sm font-bold text-pink-200">Compatibility Check ✨</p>
                {profile.gemini_analysis === 'loading' ? (
                  <div className="flex items-center space-x-2 mt-2">
                      <div className="w-2 h-2 bg-pink-200 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-pink-200 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-pink-200 rounded-full animate-pulse"></div>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-pink-100">{profile.gemini_analysis}</p>
                )}
              </div>
          )}
        </div>
        <div className="mt-6 flex justify-center gap-8">
          <button onClick={() => onDislike(profile.id)} className="p-4 bg-white/20 rounded-full text-red-400 hover:bg-red-400 hover:text-white transition-colors">
            <XMarkIcon />
          </button>
          <button onClick={() => onLike(profile.id)} className="p-4 bg-white/20 rounded-full text-green-400 hover:bg-green-400 hover:text-white transition-colors">
            <CheckIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
