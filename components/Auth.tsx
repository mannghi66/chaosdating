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


const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Logged in successfully! Welcome back!' });
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Check your email for the confirmation link! Your profile is ready.' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.error_description || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl shadow-pink-200/50">
        <div className="text-center">
            <div className="flex justify-center items-center gap-2">
                <HeartIcon className="text-primary w-10 h-10" />
                <h1 className="text-4xl font-bold text-primary">chaosdating</h1>
            </div>
            <p className="mt-2 text-text-light">Find your beautifully chaotic match.</p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-md text-sm ${
              message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleAuth}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-text-main">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-secondary rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-text-main">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 bg-white border border-secondary rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {!isLogin && (
             <div>
                <label htmlFor="confirm-password" className="text-sm font-medium text-text-main">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-secondary rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
          )}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-pink-300 transition-colors duration-300"
            >
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
            </button>
          </div>
        </form>

        <p className="text-sm text-center text-text-light">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => {
                setIsLogin(!isLogin);
                setMessage(null);
            }}
            className="font-medium text-primary hover:underline ml-1"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;