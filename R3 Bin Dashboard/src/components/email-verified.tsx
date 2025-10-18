import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './supabase';

export default function EmailVerified() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (type === 'signup' && token_hash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'signup'
          });

          if (error) {
            setStatus('error');
            setMessage('Invalid or expired verification link.');
          } else {
            setStatus('success');
            setMessage('Email verified successfully! Logging you in...');
            setTimeout(() => navigate('/'), 2000);
          }
        } else {
          setStatus('error');
          setMessage('Invalid verification link.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('An error occurred during verification.');
      }
    };

    verifyEmail();
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full mx-4">
        {status === 'verifying' && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        )}
        {status === 'success' && (
          <div className="text-green-500 text-4xl mb-4">✅</div>
        )}
        {status === 'error' && (
          <div className="text-red-500 text-4xl mb-4">❌</div>
        )}
        <h2 className="text-xl font-bold text-gray-800 mb-2">{message}</h2>
        {status === 'error' && (
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}