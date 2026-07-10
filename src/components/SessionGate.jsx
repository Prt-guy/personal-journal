// Gates the app behind an established anonymous session. Shows a brief loader
// while the session is created, and a friendly full-screen retry on failure.
import { useSession } from '../context/SessionContext';
import Loader from './Loader';
import Button from './Button';

export default function SessionGate({ children }) {
  const { loading, error, userId, retry } = useSession();

  if (loading) return <Loader fullScreen label="Preparing your journal…" />;

  if (error || !userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-50 px-6 text-center dark:bg-stone-950">
        <div className="text-4xl" aria-hidden="true">
          🌧️
        </div>
        <h1 className="text-lg font-medium text-stone-700 dark:text-stone-200">
          We couldn't open your journal
        </h1>
        <p className="max-w-sm text-sm text-stone-500 dark:text-stone-400">
          There was a problem connecting. Check your connection and try again.
        </p>
        <Button onClick={retry}>Try again</Button>
      </div>
    );
  }

  return children;
}
