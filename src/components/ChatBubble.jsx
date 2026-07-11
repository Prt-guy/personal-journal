// A single chat message. User messages are right-aligned bubbles; assistant
// messages read as calm full-width text (the modern chat convention) with a
// quiet copy affordance. `[overflow-wrap:anywhere]` keeps long words and URLs
// from blowing out the layout on narrow screens.
import { useEffect, useRef, useState } from 'react';
import { ROLE } from '../utils/constants';

export default function ChatBubble({ role, content, pending = false }) {
  if (role === ROLE.USER) {
    return (
      <div className="flex justify-end">
        <div
          className={[
            'max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-br-lg px-4 py-2.5 text-[15px] leading-relaxed shadow-sm sm:max-w-[75%] lg:text-base',
            '[overflow-wrap:anywhere] bg-stone-800 text-stone-50 dark:bg-stone-200 dark:text-stone-900',
            pending ? 'opacity-70' : '',
          ].join(' ')}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col items-start">
      <div className="w-full whitespace-pre-wrap text-[15px] leading-7 text-stone-700 [overflow-wrap:anywhere] lg:text-base dark:text-stone-200">
        {content}
      </div>
      <CopyButton text={content} />
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* Clipboard unavailable (permissions / insecure context) — quietly skip. */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy message'}
      className={[
        'mt-1.5 flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-stone-400 transition-opacity',
        'hover:bg-stone-200/70 hover:text-stone-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400',
        'dark:text-stone-500 dark:hover:bg-stone-800/70 dark:hover:text-stone-300',
        // Hidden until hover on pointer devices; always visible (subtle) on touch.
        'opacity-0 focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-70',
        copied ? 'opacity-100' : '',
      ].join(' ')}
    >
      {copied ? (
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            d="m3.5 8.5 3 3 6-6.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
          <rect
            x="5.5"
            y="5.5"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M10.5 3.5v-.25A1.25 1.25 0 0 0 9.25 2h-6A1.25 1.25 0 0 0 2 3.25v6A1.25 1.25 0 0 0 3.25 10.5h.25"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// The animated "assistant is thinking" indicator, aligned with assistant text.
export function TypingBubble() {
  return (
    <div className="flex items-center gap-1.5 py-1" role="status" aria-label="Assistant is typing">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 animate-bounce rounded-full bg-stone-400 dark:bg-stone-500"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}
