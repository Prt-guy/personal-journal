// Shared shell: a slim, quiet header (brand + theme toggle) over an <Outlet>.
// The shell is locked to the visible viewport height and <main> is the scroll
// container — this lets the AI chat pin its composer to the bottom on mobile
// while regular pages simply scroll inside <main> as before.
import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

export default function Layout() {
  const mainRef = useRef(null);
  const { pathname } = useLocation();

  // <main> owns the scroll position now (not the document), so reset it on
  // navigation to preserve the expected "new page starts at the top" behavior.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex h-app flex-col bg-stone-50 dark:bg-stone-950">
      <header className="z-10 shrink-0 border-b border-stone-200/70 bg-stone-50/80 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-stone-800/70 dark:bg-stone-950/80">
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
      <main ref={mainRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
