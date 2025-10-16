import React from 'react';
import { Profile } from '../types';

interface UserCardProps {
  profile: Profile;
  onLike: (profileId: string) => void;
  onDislike: (profileId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ profile, onLike, onDislike }) => {
  const HeartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-1.383-.597 15.218 15.218 0 0 1-4.217-2.734c-1.12-1.14-2.06-2.553-2.753-4.14C.79 11.533 0 9.888 0 8.25c0-4.42 3.58-8 8-8s8 3.58 8 8c0 1.638-.79 3.283-1.928 4.783a15.247 15.247 0 0 1-4.217 2.734 15.218 15.218 0 0 1-1.383.597l-.022.012-.007.003h-.004a.75.75 0 0 1-.65-.632Z" /></svg>;
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
        {profile.gemini_analysis && (
           <div className="mt-4 p-3 bg-pink-500/20 backdrop-blur-sm rounded-lg border border-pink-500/30">
              <p className="text-sm font-bold text-pink-200">✨ Gemini's Compatibility Analysis</p>
              <p className="mt-1 text-sm text-pink-100">{profile.gemini_analysis}</p>
           </div>
        )}
        <div className="mt-6 flex justify-center gap-8">
          <button onClick={() => onDislike(profile.id)} className="p-4 bg-white/20 rounded-full text-red-400 hover:bg-red-400 hover:text-white transition-colors">
            <XMarkIcon />
          </button>
          <button onClick={() => onLike(profile.id)} className="p-4 bg-white/20 rounded-full text-green-400 hover:bg-green-400 hover:text-white transition-colors">
            <HeartIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;
