// Fetches the current user's journals (reverse chronological) with explicit
// loading / error / empty signals. Reused by History (and available elsewhere).
import { useCallback, useEffect, useState } from 'react';
import { getAllJournals } from '../services/journalService';
import { useSession } from '../context/SessionContext';

export function useJournals() {
  const { userId } = useSession();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      setJournals(await getAllJournals(userId));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // Fetch-on-mount: intentional loading-state update (external-system sync).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return {
    journals,
    loading,
    error,
    reload: load,
    isEmpty: !loading && !error && journals.length === 0,
  };
}
