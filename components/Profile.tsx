import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
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

  const getProfile = useCallback(async () => {
    try {
      setLoading(true);
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
  }, [session]);

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

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      getProfile(); // Refresh profile data
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
        const fileExt = file.name.split('.').pop();
        const filePath = `${session.user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        
        if (!data.publicUrl) {
            throw new Error('Could not get public URL for avatar.');
        }

        setAvatarUrl(data.publicUrl);
        setMessage({ type: 'success', text: 'Avatar uploaded successfully! Press "Update Profile" to save.' });
    } catch (error: any) {
        setMessage({ type: 'error', text: error.message });
    } finally {
        // Fix: Use the state setter function `setUploading` to update the state.
        setUploading(false);
    }
  }

  if (loading && !profile) {
    return <div className="text-center p-10">Loading your profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold text-primary">Your Profile</h2>
      
      {message && (
        <div className={`p-4 rounded-md text-sm ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={updateProfile} className="space-y-6">
        <div className="flex items-center space-x-6">
            <img 
                src={avatarUrl || `https://api.dicebear.com/8.x/adventurer/svg?seed=${username || session.user.email}`} 
                alt="Avatar" 
                className="w-24 h-24 rounded-full object-cover" 
            />
            <div>
                <label htmlFor="avatar-upload" className="cursor-pointer bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-600">
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
                <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 10MB.</p>
            </div>
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
          <input id="email" type="text" value={session.user.email} disabled className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label htmlFor="username" className="text-sm font-medium text-gray-700">Username</label>
          <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
        </div>
        <div>
            <label htmlFor="birth_date" className="text-sm font-medium text-gray-700">Birthday</label>
            <input id="birth_date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
        </div>
        <div>
          <label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</label>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-primary focus:border-primary" placeholder="Tell us something about you..."></textarea>
        </div>
         <div>
          <label htmlFor="interests" className="text-sm font-medium text-gray-700">Interests</label>
          <input id="interests" type="text" value={interests} onChange={(e) => setInterests(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
          <p className="text-xs text-gray-500 mt-1">Separate interests with a comma (e.g., hiking, coding, pineapple on pizza).</p>
        </div>
        <div>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-pink-300">
            {loading ? 'Saving...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;