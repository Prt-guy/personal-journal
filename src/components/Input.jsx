// Labeled text input. Label is visually hidden when `hideLabel` but stays for a11y.
import { useId } from 'react';

export default function Input({
  label,
  hideLabel = false,
  className = '',
  id,
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className={
            hideLabel
              ? 'sr-only'
              : 'mb-1 block text-sm font-medium text-stone-600 dark:text-stone-400'
          }
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-800',
          'placeholder:text-stone-400 shadow-sm transition-colors',
          'focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300',
          'dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100',
          'dark:placeholder:text-stone-500 dark:focus:border-stone-600 dark:focus:ring-stone-700',
          className,
        ].join(' ')}
        {...rest}
      />
    </div>
  );
}
