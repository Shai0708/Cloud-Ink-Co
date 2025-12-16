
import React, { useState } from 'react';
import { LogoIcon } from './icons';
import FloatingBubbles from './FloatingBubbles';
import { supabase } from '../supabaseClient';

interface LoginPageProps {
  onLogin: (userInfo: { department: string; jobTitle: string; name: string }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Fetch department and job_title for permission logic
      const { data, error: dbError } = await supabase
        .from('employees')
        .select('department_name, full_name, job_title')
        .ilike('email', username)
        .single();

      if (dbError) {
        throw new Error('User not found. Please ensure you are using a valid employee email.');
      }

      if (data) {
        // Successful login
        onLogin({
            department: data.department_name,
            jobTitle: data.job_title,
            name: data.full_name
        });
      } else {
        setError('Invalid credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden flex items-center justify-center min-h-screen bg-gradient-to-br from-[#111827] to-[#1F2937]">
      <FloatingBubbles />
      <div className="relative z-10 w-full max-w-md p-8 space-y-8 bg-[#111827]/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-500/10 transition-all duration-300 hover:shadow-cyan-glow">
        <div className="text-center">
          <LogoIcon className="h-20 w-20 mx-auto text-cyan-400" />
          <h1 className="mt-4 text-3xl font-bold tracking-wider text-white">Cloud Ink</h1>
          <p className="mt-2 text-sm text-gray-400">Employee Portal Login</p>
          <p className="mt-1 text-xs text-gray-500">(Use a valid employee email)</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 sr-only">
              Email
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Employee Email"
              className="mt-1 block w-full px-3 py-2 bg-[#1F2937] border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-white"
              aria-label="Username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="mt-1 block w-full px-3 py-2 bg-[#1F2937] border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-white"
              aria-label="Password"
            />
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
