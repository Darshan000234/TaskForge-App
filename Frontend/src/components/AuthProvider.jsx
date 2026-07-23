import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import api, { attemptRefresh } from '../api/api.js';
import { subscribeAccessToken, clearAccessToken } from '../utils/authStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 'loading' blocks ProtectedRoute from making a redirect decision
  const [status, setStatus] = useState('loading');
  const bootstrapped = useRef(false); // StrictMode double-invoke guard

  // React to token changes from anywhere (interceptor, login, logout).
  useEffect(() => {
    return subscribeAccessToken((token) => {
      setStatus(token ? 'authenticated' : 'unauthenticated');
    });
  }, []);

  // One-time startup refresh attempt.
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    // attemptRefresh() itself is idempotent-safe (single in-flight promise),
    // but this ref prevents a second *separate* call being scheduled at all
    // during StrictMode's mount->unmount->mount cycle.
    attemptRefresh().catch(() => {
      /* no-op: status already flipped to unauthenticated via subscription */
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.get('/user/logout'); // clears refresh cookie server-side
    } finally {
      clearAccessToken(); // clears client state regardless of network result
    }
  }, []);

  return (
    <AuthContext.Provider value={{ status, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);