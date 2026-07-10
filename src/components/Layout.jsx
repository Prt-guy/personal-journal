// Shared shell: a slim, quiet header (brand + theme toggle) over an <Outlet>.
// Kept deliberately minimal — no nav clutter for features that don't exist.
import { Link, Outlet } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950">
      <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-stone-50/80 backdrop-blur dark:border-stone-800/70 dark:bg-stone-950/80">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 lg:max-w-5xl lg:px-6 xl:max-w-6xl">
          <Link
            to="/"
            className="text-sm font-medium tracking-wide text-stone-500 transition-colors hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100"
          >
            My Journal
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
