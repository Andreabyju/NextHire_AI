import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiSparkles } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../services/api';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [statusMessage, setStatusMessage] = useState('Verifying your credentials...');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleAuth = async () => {
      const token = searchParams.get('token');
      const errParam = searchParams.get('error');

      if (errParam) {
        setError(errParam);
        setTimeout(() => {
          navigate(`/sign-in?error=${encodeURIComponent(errParam)}`, { replace: true });
        }, 1500);
        return;
      }

      if (!token) {
        setError('No authentication token received.');
        setTimeout(() => {
          navigate('/sign-in?error=Authentication failed. Please try again.', { replace: true });
        }, 1500);
        return;
      }

      try {
        setStatusMessage('Completing sign in...');

        // Fetch current user details with the newly issued JWT token
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to retrieve user profile.');
        }

        const userData = await res.json();

        // Persist session in AuthContext
        login(userData, token);

        // Redirect based on user role
        if (userData.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('Failed to authenticate. Redirecting to sign in...');
        setTimeout(() => {
          navigate('/sign-in?error=Failed to complete authentication.', { replace: true });
        }, 1500);
      }
    };

    handleAuth();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-blueAccent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-violetAccent/15 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div
          className="relative rounded-2xl border border-white/10 p-8 text-center"
          style={{
            background: 'linear-gradient(145deg, rgba(15,23,42,0.95) 0%, rgba(10,10,30,0.98) 100%)',
            boxShadow: '0 0 60px rgba(124,58,237,0.15), 0 20px 50px rgba(0,0,0,0.8)',
          }}
        >
          {/* Logo badge */}
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-tr from-blueAccent to-violetAccent flex items-center justify-center shadow-[0_0_25px_rgba(124,58,237,0.5)]">
            <HiSparkles className="text-white text-2xl" />
          </div>

          <h2 className="text-xl font-bold font-space text-white mb-2">
            {error ? 'Authentication Error' : 'Signing You In'}
          </h2>

          <p className="text-sm text-slate-400 mb-6">
            {error || statusMessage}
          </p>

          {!error ? (
            <div className="flex justify-center items-center py-2">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                <div className="absolute inset-0 rounded-full border-2 border-violetAccent border-t-transparent animate-spin" />
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
              {error}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
