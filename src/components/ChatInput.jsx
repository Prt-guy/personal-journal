// Pinned bottom chat composer.
//
// Mobile-specific decisions:
// - The textarea stays *enabled* while the AI responds — disabling it would blur
//   the field and collapse the on-screen keyboard after every send. Only the
//   submit path is gated by `sending`.
// - 16px font (text-base) so iOS Safari doesn't auto-zoom the page on focus.
// - On touch (coarse-pointer) devices Enter inserts a newline, matching native
//   chat apps; on desktop Enter sends and Shift+Enter inserts a newline.
// - The send button prevents default on pointerdown so tapping it never steals
//   focus from the textarea (which would close the keyboard).
// - Bottom padding respects the iOS home-indicator safe area.
import { useEffect, useRef, useState } from 'react';

const MAX_HEIGHT_PX = 160;

export default function ChatInput({ onSend, sending = false, initialValue = '' }) {
  const [text, setText] = useState(initialValue);
  const ref = useRef(null);

  // When a send fails, the page re-seeds the composer with the failed text so the
  // user doesn't lose what they typed. Syncing a controlled field from a prop is a
  // legitimate effect here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(initialValue);
  }, [initialValue]);

  // Autosize up to a comfortable max, then scroll internally.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT_PX ? 'auto' : 'hidden';
  }, [text]);

  const canSend = !sending && text.trim().length > 0;

  function submit() {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
  }

  function handleKeyDown(e) {
    if (e.key !== 'Enter' || e.shiftKey) return;
    // Never send mid-IME-composition (Japanese/Chinese/Korean input).
    if (e.nativeEvent.isComposing) return;
    // Touch devices: Enter is a newline; the send button submits.
    if (window.matchMedia('(pointer: coarse)').matches) return;
    e.preventDefault();
    submit();
  }

  return (
    <div className="shrink-0 border-t border-stone-200 bg-stone-50/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-4 lg:max-w-4xl lg:px-6 lg:py-4 xl:max-w-5xl">
        <div
          className={[
            'flex items-end gap-2 rounded-3xl border border-stone-200 bg-white py-1.5 pl-4 pr-1.5 shadow-sm',
            'transition-colors focus-within:border-stone-400 focus-within:ring-2 focus-within:ring-stone-300',
            'dark:border-stone-800 dark:bg-stone-900 dark:focus-within:border-stone-600 dark:focus-within:ring-stone-700',
          ].join(' ')}
        >
          <label htmlFor="chat-composer" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-composer"
            ref={ref}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reflect further…"
            className="max-h-40 min-w-0 flex-1 resize-none self-center bg-transparent py-1.5 text-base leading-6 text-stone-800 placeholder:text-stone-400 focus:outline-none dark:text-stone-100 dark:placeholder:text-stone-500"
          />
          <button
            type="button"
            onClick={submit}
            onPointerDown={(e) => e.preventDefault()}
            disabled={!canSend}
            aria-label="Send message"
            className={[
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400',
              canSend
                ? 'bg-stone-800 text-stone-50 hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white'
                : 'cursor-not-allowed bg-stone-200 text-stone-400 dark:bg-stone-800 dark:text-stone-600',
            ].join(' ')}
          >
            {sending ? (
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-stone-400 border-t-transparent dark:border-stone-500"
                aria-hidden="true"
              />
            ) : (
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M10 15.5v-11m0 0L5.5 9M10 4.5 14.5 9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
