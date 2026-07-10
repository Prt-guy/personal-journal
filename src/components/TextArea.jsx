// Autosizing textarea — grows with content so writing feels like an endless page.
// No formatting toolbar by design: writing is the whole experience.
import { useEffect, useRef } from 'react';

export default function TextArea({
  value,
  onChange,
  className = '',
  minRows = 3,
  ...rest
}) {
  const ref = useRef(null);

  // Resize to fit content on every value change.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={minRows}
      className={[
        'w-full resize-none bg-transparent text-stone-800 placeholder:text-stone-400',
        'focus:outline-none',
        'dark:text-stone-100 dark:placeholder:text-stone-500',
        className,
      ].join(' ')}
      {...rest}
    />
  );
}
