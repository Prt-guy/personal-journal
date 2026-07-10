// Friendly empty/error placeholder with an optional call to action.
export default function EmptyState({ title, message, icon = '📝', action = null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      {title && (
        <h2 className="text-lg font-medium text-stone-700 dark:text-stone-200">{title}</h2>
      )}
      {message && (
        <p className="max-w-sm text-sm text-stone-500 dark:text-stone-400">{message}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
