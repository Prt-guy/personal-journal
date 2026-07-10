// Fixed bottom chat composer. Enter sends; Shift+Enter inserts a newline.
import { useEffect, useRef, useState } from 'react';
import Button from './Button';

export default function ChatInput({ onSend, disabled = false, initialValue = '' }) {
  const [text, setText] = useState(initialValue);
  const ref = useRef(null);

  // When a send fails, the page re-seeds the composer with the failed text so the
  // user doesn't lose what they typed. Syncing a controlled field from a prop is a
  // legitimate effect here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setText(initialValue);
  }, [initialValue]);

  // Autosize the composer up to a comfortable max.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-stone-200 bg-stone-50/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2 px-4 py-3 lg:max-w-4xl lg:px-6 lg:py-4 xl:max-w-5xl">
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
          disabled={disabled}
          placeholder="Reflect further…"
          className={[
            'flex-1 resize-none rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 lg:px-5 lg:py-3 lg:text-base',
            'placeholder:text-stone-400 shadow-sm focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300',
            'disabled:opacity-60 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100',
            'dark:placeholder:text-stone-500 dark:focus:border-stone-600 dark:focus:ring-stone-700',
          ].join(' ')}
        />
        <Button onClick={submit} disabled={disabled || !text.trim()} aria-label="Send message">
          Send
        </Button>
      </div>
    </div>
  );
}
