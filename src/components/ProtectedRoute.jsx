import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── Loading spinner shown while auth is being restored from localStorage ──
function AuthLoading() {
  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <svg className="animate-spin h-8 w-8 text-violet-500" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

/**
 * ProtectedRoute
 * Requires the user to be authenticated (any role).
 * If not authenticated → redirect to /sign-in.
 * Preserves the attempted URL so we can redirect after login if needed.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * AdminRoute
 * Requires the user to be authenticated AND have role === 'admin'.
 * Non-admins → redirected back to /dashboard with a 403-like message stored in state.
 */
export function AdminRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    // Non-admin tried to access an admin route — redirect to user dashboard
    return <Navigate to="/dashboard" state={{ unauthorized: true }} replace />;
  }

  return children;
}

/**
 * MentorRoute
 * Requires the user to be authenticated AND have role === 'mentor'.
 * Non-mentors → redirected back to /dashboard with a 403-like message stored in state.
 */
export function MentorRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;

  if (!isAuthenticated) {
    return <Navigate to="/mentor/login" state={{ from: location, message: 'Session expired. Please sign in again.' }} replace />;
  }

  if (user?.role !== 'mentor') {
    // Non-mentor tried to access a mentor route — redirect to user dashboard
    return <Navigate to="/dashboard" state={{ unauthorized: true, message: 'Unauthorized access. You must be a mentor.' }} replace />;
  }

  return children;
}
