// Quiet spinner + optional label. Used for full-screen and inline loading.
export default function Loader({ label = 'Loading…', fullScreen = false }) {
  const spinner = (
    <div className="flex flex-col items-center gap-3 text-stone-500 dark:text-stone-400">
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600 dark:border-stone-700 dark:border-t-stone-300"
        role="status"
        aria-label={label}
      />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-stone-950">
        {spinner}
      </div>
    );
  }
  return <div className="flex w-full justify-center py-16">{spinner}</div>;
}
