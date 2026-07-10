// A single chat message. User messages align right; assistant left.
import { ROLE } from '../utils/constants';

export default function ChatBubble({ role, content, pending = false }) {
  const isUser = role === ROLE.USER;
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[75%] lg:px-5 lg:py-3.5 lg:text-base',
          isUser
            ? 'rounded-br-md bg-stone-800 text-stone-50 dark:bg-stone-100 dark:text-stone-900'
            : 'rounded-bl-md bg-white text-stone-700 dark:bg-stone-800 dark:text-stone-100',
          pending ? 'opacity-70' : '',
        ].join(' ')}
      >
        {content}
      </div>
    </div>
  );
}

// The animated "assistant is thinking" indicator, styled like an assistant bubble.
export function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-4 shadow-sm dark:bg-stone-800">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-2 w-2 animate-bounce rounded-full bg-stone-400 dark:bg-stone-500"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
