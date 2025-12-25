
import React from 'react';
import { Profile } from '../types';

interface MatchOverlayProps {
  myProfile: Profile;
  matchedProfile: Profile;
  onClose: () => void;
  onChat: () => void;
}

const MatchOverlay: React.FC<MatchOverlayProps> = ({ myProfile, matchedProfile, onClose, onChat }) => {
  const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white animate-bounce">
      <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-1.383-.597 15.218 15.218 0 0 1-4.217-2.734c-1.12-1.14-2.06-2.553-2.753-4.14C.79 11.533 0 9.888 0 8.25c0-4.42 3.58-8 8-8s8 3.58 8 8c0 1.638-.79 3.283-1.928 4.783a15.247 15.247 0 0 1-4.217 2.734 15.218 15.218 0 0 1-1.383.597l-.022.012-.007.003h-.004a.75.75 0 0 1-.65-.632Z" />
    </svg>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-indigo-900/90 backdrop-blur-xl animate-fade-in p-4 overflow-hidden">
        {/* Floating background hearts */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
            {[...Array(10)].map((_, i) => (
                <div key={i} className={`absolute text-white animate-pulse`} style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    fontSize: `${Math.random() * 40 + 20}px`
                }}>❤️</div>
            ))}
        </div>

        <div className="text-center relative z-10 space-y-8 max-w-lg">
            <div className="animate-fade-in delay-150">
                <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter drop-shadow-lg animate-bounce">
                    IT'S A MATCH!
                </h2>
                <p className="text-pink-200 text-xl font-medium mt-2">You and {matchedProfile.username} liked each other!</p>
            </div>
            
            <div className="flex items-center justify-center gap-4 py-8">
                <div className="relative group">
                    <img 
                        src={myProfile.avatar_url || `https://api.dicebear.com/8.x/adventurer/svg?seed=${myProfile.username}`} 
                        alt="Me" 
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-2xl transform -rotate-12 transition-transform group-hover:rotate-0"
                    />
                </div>
                <div className="z-20 scale-150">
                    <HeartIcon />
                </div>
                <div className="relative group">
                    <img 
                        src={matchedProfile.avatar_url || `https://api.dicebear.com/8.x/adventurer/svg?seed=${matchedProfile.username}`} 
                        alt="Match" 
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-2xl transform rotate-12 transition-transform group-hover:rotate-0"
                    />
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <button 
                    onClick={onChat}
                    className="w-full py-4 px-8 bg-pink-500 text-white font-bold rounded-full shadow-xl hover:bg-pink-600 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                    SAY HI NOW 👋
                </button>
                <button 
                    onClick={onClose}
                    className="w-full py-4 px-8 bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
                >
                    KEEP SWIPING
                </button>
            </div>
        </div>
    </div>
  );
};

export default MatchOverlay;
