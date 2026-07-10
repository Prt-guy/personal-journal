// Presentational card for a single journal in History. Navigation is the caller's job.
import { displayTitle, excerpt, formatDate } from '../utils/format';

export default function JournalCard({ journal, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group w-full rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm lg:p-6',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400',
        'dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700',
      ].join(' ')}
    >
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="truncate text-base font-medium text-stone-800 dark:text-stone-100">
          {displayTitle(journal.title)}
        </h3>
        <time className="shrink-0 text-xs text-stone-400 dark:text-stone-500">
          {formatDate(journal.$createdAt)}
        </time>
      </div>
      <p className="line-clamp-3 text-sm leading-relaxed text-stone-500 dark:text-stone-400">
        {excerpt(journal.content) || 'No content yet.'}
      </p>
    </button>
  );
}
