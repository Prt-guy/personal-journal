// Small icon button to switch light/dark. Reads/writes ThemeContext.
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={[
        'rounded-full p-2 text-lg leading-none transition-colors',
        'text-stone-500 hover:bg-stone-200/70 dark:text-stone-400 dark:hover:bg-stone-800/70',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400',
      ].join(' ')}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
