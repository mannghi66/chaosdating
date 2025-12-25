
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

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

interface AuthProps {
  onEnterDemo: () => void;
}

const Auth: React.FC<AuthProps> = ({ onEnterDemo }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        // Cast to any to bypass Property 'signInWithPassword' does not exist error
        const { error } = await (supabase.auth as any).signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        // Cast to any to bypass Property 'signUp' does not exist error
        const { error } = await (supabase.auth as any).signUp({ 
            email, 
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        
        if (error) {
            // Check for common SMTP/Rate limit errors
            if (error.message.toLowerCase().includes('email') || error.status === 429) {
                setMessage({ 
                    type: 'info', 
                    text: 'Email limit reached! This is a Supabase Free Tier limitation. Click the "Demo Mode" button below to skip verification and use the app anyway.' 
                });
                return;
            }
            throw error;
        }
        setMessage({ type: 'success', text: 'Success! Please check your email to confirm your account.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl shadow-pink-200/50">
        <div className="text-center">
            <div className="flex justify-center items-center gap-2">
                <HeartIcon className="text-primary w-10 h-10" />
                <h1 className="text-4xl font-bold text-primary">chaosdating</h1>
            </div>
            <p className="mt-2 text-text-light italic">Find your beautifully chaotic match.</p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-medium animate-fade-in ${
              message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 
              message.type === 'info' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 ring-2 ring-indigo-200' :
              'bg-green-50 text-green-600 border border-green-100'
            }`}
          >
            {message.text}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleAuth}>
          <div>
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-text-main ml-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              className="mt-1 block w-full px-4 py-3 bg-white border border-secondary rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-text-main ml-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 block w-full px-4 py-3 bg-white border border-secondary rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {!isLogin && (
             <div>
                <label htmlFor="confirm-password" className="text-xs font-bold uppercase tracking-wider text-text-main ml-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  className="mt-1 block w-full px-4 py-3 bg-white border border-secondary rounded-2xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
          )}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-2xl shadow-lg text-sm font-bold text-white bg-primary hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-pink-300 transition-all active:scale-95"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </div>
        </form>

        <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400 font-bold">Recommended for quick testing</span></div>
        </div>

        <button
          onClick={onEnterDemo}
          className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm hover:shadow-xl hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 group animate-bounce"
        >
          🚀 ENTER DEMO MODE (NO EMAIL NEEDED)
          <span className="text-xl">✨</span>
        </button>

        <p className="text-sm text-center text-text-light">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => {
                setIsLogin(!isLogin);
                setMessage(null);
            }}
            className="font-bold text-primary hover:underline ml-1"
          >
            {isLogin ? 'Register now' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
