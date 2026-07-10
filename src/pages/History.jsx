// History — every entry, newest first. Loading / empty / error all handled.
import { useNavigate } from 'react-router-dom';
import { useJournals } from '../hooks/useJournals';
import JournalCard from '../components/JournalCard';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

export default function History() {
  const navigate = useNavigate();
  const { journals, loading, error, isEmpty, reload } = useJournals();

  if (loading) return <Loader label="Loading your journals…" />;

  if (error) {
    return (
      <EmptyState
        icon="⚠️"
        title="Couldn't load your journals"
        message="Something went wrong reaching your notebook. Please try again."
        action={
          <Button variant="secondary" onClick={reload}>
            Retry
          </Button>
        }
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title="Nothing here yet"
        message="Your entries will appear here once you start writing."
        action={<Button onClick={() => navigate('/new')}>Write your first entry</Button>}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 lg:max-w-5xl lg:px-6 lg:py-12 xl:max-w-6xl">
      <h1 className="mb-6 text-2xl font-semibold text-stone-800 dark:text-stone-100 lg:mb-8 lg:text-3xl">
        History
      </h1>
      {/* Single column on small screens; two columns of cards on large monitors. */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        {journals.map((journal) => (
          <JournalCard
            key={journal.$id}
            journal={journal}
            onClick={() => navigate(`/journal/${journal.$id}`)}
          />
        ))}
      </div>
    </div>
  );
}
