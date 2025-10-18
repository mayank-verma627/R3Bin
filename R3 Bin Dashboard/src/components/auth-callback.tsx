// components/auth-callback.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

export default function AuthCallback() {
  const [message, setMessage] = useState('Processing...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setMessage('Authentication failed. Please try again.');
          console.error('Auth error:', error);
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        if (data.session) {
          setMessage('Authentication successful! Redirecting...');
          setTimeout(() => navigate('/'), 2000);
        } else {
          setMessage('No session found. Redirecting to login...');
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setMessage('An unexpected error occurred.');
        setTimeout(() => navigate('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">{message}</h2>
        <p className="text-gray-600">Please wait while we authenticate your account...</p>
      </div>
    </div>
  );
}