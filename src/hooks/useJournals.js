// Fetches every journal (reverse chronological) with explicit loading / error /
// empty signals. Reused by History (and available elsewhere).
import { useCallback, useEffect, useState } from 'react';
import { getAllJournals } from '../services/journalService';

export function useJournals() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setJournals(await getAllJournals());
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

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
