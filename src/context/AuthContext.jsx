import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'nexthireai_auth';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ==========================================
// DECODE JWT PAYLOAD (no verification —
// just read expiry client-side)
// ==========================================

function decodeJwtExpiry(token) {
  try {
    const base64 = token.split('.')[1];
    const payload = JSON.parse(atob(base64));
    return payload.exp ? payload.exp * 1000 : null; // convert to ms
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const exp = decodeJwtExpiry(token);
  if (!exp) return false; // can't determine — let backend decide
  return Date.now() >= exp;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring session
  const [sessionExpired, setSessionExpired] = useState(false);

  // ==========================================
  // LOGOUT HELPER
  // ==========================================

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setSessionExpired(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // ==========================================
  // RESTORE SESSION ON MOUNT
  // ==========================================
  //
  // 1. Read from localStorage
  // 2. Check client-side token expiry
  // 3. Verify with backend /api/auth/me
  //    to catch suspended accounts and
  //    invalidated tokens
  //
  // ==========================================

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;

        const parsed = JSON.parse(stored);
        if (!parsed?.token || !parsed?.user) return;

        // ======================================
        // CLIENT-SIDE EXPIRY CHECK
        // ======================================

        if (isTokenExpired(parsed.token)) {
          localStorage.removeItem(STORAGE_KEY);
          setSessionExpired(true);
          return;
        }

        // ======================================
        // BACKEND VERIFICATION
        // ======================================
        //
        // Verify the token is still accepted by
        // the server (catches suspended accounts,
        // deleted users, secret key rotations).
        //
        // ======================================

        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${parsed.token}`,
          },
        });

        if (!res.ok) {
          // Token rejected by backend — clear session
          localStorage.removeItem(STORAGE_KEY);
          if (res.status === 401 || res.status === 403) {
            setSessionExpired(true);
          }
          return;
        }

        // Refresh user data from server
        const freshUser = await res.json();

        const updatedUser = {
          id: freshUser.id,
          name: freshUser.name,
          email: freshUser.email,
          role: freshUser.role,
          accountStatus: freshUser.accountStatus,
        };

        // Persist fresh user data
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ user: updatedUser, token: parsed.token })
        );

        setUser(updatedUser);
        setToken(parsed.token);

      } catch {
        // Network error during verification — still restore the session
        // from storage so the user isn't logged out on every network blip.
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.token && parsed?.user && !isTokenExpired(parsed.token)) {
              setUser(parsed.user);
              setToken(parsed.token);
            }
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================
  //
  // Call after a successful login OR registration.
  // @param {object} userData  - { id, name, email, role }
  // @param {string} authToken - JWT string
  //
  // ==========================================

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setSessionExpired(false);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: userData, token: authToken })
    );
  }, []);

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        sessionExpired,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — use anywhere inside the app */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
