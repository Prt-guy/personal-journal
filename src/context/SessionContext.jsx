// Establishes and exposes the invisible anonymous identity.
// There is no login UI: on load we ensure an Appwrite anonymous session exists,
// then expose the user's $id as `userId`. Everything needing the user reads it here.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { account } from '../services/appwrite';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null); // Appwrite account { $id, ... } or null
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const establish = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Reuse an existing session if the browser already has one.
      try {
        const existing = await account.get();
        setUser(existing);
        return;
      } catch {
        // No active session yet — create an anonymous one below.
      }
      await account.createAnonymousSession();
      const created = await account.get();
      setUser(created);
    } catch (err) {
      // e.g. Appwrite unreachable or misconfigured env.
      setError(err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Canonical async bootstrap on mount (fetch/sync-with-external-system case).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    establish();
  }, [establish]);

  const value = {
    user,
    userId: user?.$id ?? null,
    loading,
    error,
    retry: establish,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
