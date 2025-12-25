
import React, { useState, useEffect, useCallback } from 'react';
// Session type is not exported in some versions of @supabase/supabase-js
type Session = any;
import { supabase } from '../services/supabase';
import { Profile as ProfileType } from '../types';

interface ProfileProps {
  session: Session;
}

const Profile: React.FC<ProfileProps> = ({ session }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isGuest = session.user.id === 'demo-user-id';

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isGuest) {
        const saved = localStorage.getItem('demo-profile');
        if (saved) {
          const data = JSON.parse(saved);
          setProfile(data);
          setUsername(data.username);
          setBio(data.bio || '');
          setInterests((data.interests || []).join(', '));
          setBirthDate(data.birth_date || '');
          setAvatarUrl(data.avatar_url);
        } else {
          setUsername('Demo Explorer');
          setBio('I am testing this awesome app!');
          setInterests('coding, dating, coffee');
        }
        setLoading(false);
        return;
      }

      const { user } = session;
      if (!user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`*`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfile(data);
        setUsername(data.username);
        setBio(data.bio || '');
        setInterests((data.interests || []).join(', '));
        setBirthDate(data.birth_date || '');
        setAvatarUrl(data.avatar_url);
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }, [session, isGuest]);

  useEffect(() => {
    getProfile();
  }, [getProfile]);

  async function updateProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      setLoading(true);
      const { user } = session;
      if (!user) throw new Error('No user on the session!');

      const interestsArray = interests.split(',').map(item => item.trim()).filter(Boolean);

      const updates = {
        id: user.id,
        username,
        bio,
        interests: interestsArray,
        birth_date: birthDate,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      if (isGuest) {
        localStorage.setItem('demo-profile', JSON.stringify(updates));
        setMessage({ type: 'success', text: 'Demo profile updated locally!' });
      } else {
        const { error } = await supabase.from('profiles').upsert(updates);
        if (error) throw error;
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
      
      getProfile();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    setMessage(null);
    try {
        setUploading(true);
        if (!event.target.files || event.target.files.length === 0) {
            throw new Error('You must select an image to upload.');
        }

        const file = event.target.files[0];

        if (isGuest) {
            // For guests, we use a FileReader to get a base64 string
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
                setUploading(false);
                setMessage({ type: 'success', text: 'Local avatar set! Press "Update Profile" to save.' });
            };
            reader.readAsDataURL(file);
            return;
        }

        const fileExt = file.name.split('.').pop();
        const filePath = `${session.user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (!data.publicUrl) throw new Error('Could not get public URL for avatar.');

        setAvatarUrl(data.publicUrl);
        setMessage({ type: 'success', text: 'Avatar uploaded successfully! Press "Update Profile" to save.' });
    } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
        setUploading(false);
    }
  }

  if (loading && !profile && !isGuest) {
    return <div className="text-center p-10">Loading your profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-primary">Your Profile</h2>
        {isGuest && (
            <span className="px-3 py-1 bg-indigo-100 text-indigo-600 text-xs font-black rounded-full uppercase tracking-tighter">Guest User</span>
        )}
      </div>
      
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={updateProfile} className="space-y-6">
        <div className="flex items-center space-x-6">
            <div className="relative group">
                <img 
                    src={avatarUrl || `https://api.dicebear.com/8.x/adventurer/svg?seed=${username || session.user.email}`} 
                    alt="Avatar" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-pink-100 shadow-lg" 
                />
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">CHANGE</span>
                </div>
            </div>
            <div>
                <label htmlFor="avatar-upload" className="cursor-pointer bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-600 transition-all shadow-md shadow-pink-100">
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
                <p className="text-xs text-gray-400 mt-2">PNG, JPG up to 10MB.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Email (Read Only)</label>
              <input id="email" type="text" value={session.user.email} disabled className="mt-1 block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-400" />
            </div>
            <div>
              <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Username</label>
              <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 block w-full px-4 py-3 bg-white border border-secondary rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="How should we call you?" />
            </div>
        </div>
        
        <div>
            <label htmlFor="birth_date" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Birthday</label>
            <input id="birth_date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="mt-1 block w-full px-4 py-3 bg-white border border-secondary rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
        </div>

        <div>
          <label htmlFor="bio" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Bio</label>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1 block w-full px-4 py-3 bg-white border border-secondary rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="Tell us something fun about you..."></textarea>
        </div>

        <div>
          <label htmlFor="interests" className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Interests</label>
          <input id="interests" type="text" value={interests} onChange={(e) => setInterests(e.target.value)} className="mt-1 block w-full px-4 py-3 bg-white border border-secondary rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all" placeholder="hiking, coding, pizza..." />
          <p className="text-[10px] text-gray-400 mt-1 ml-1 uppercase font-bold tracking-tighter">Separate with commas</p>
        </div>

        <div className="pt-4">
          <button type="submit" disabled={loading} className="w-full flex justify-center py-4 px-4 rounded-2xl shadow-xl text-sm font-black text-white bg-primary hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-pink-300 transition-all active:scale-95">
            {loading ? 'Saving Changes...' : 'SAVE PROFILE'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
