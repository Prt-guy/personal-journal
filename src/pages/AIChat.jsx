// AI Chat — ChatGPT-like layout over one journal's conversation. All logic lives
// in useConversation; this page is presentation + scroll management.
//
// Scroll model: the transcript is the only scrollable region. We auto-follow new
// messages only while the user is already at (or near) the bottom; if they have
// scrolled up to read, we leave them alone and offer a "jump to latest" button.
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useConversation } from '../hooks/useConversation';
import ChatBubble, { TypingBubble } from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { displayTitle } from '../utils/format';

const NEAR_BOTTOM_PX = 80;

function smoothOrInstant() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
}

export default function AIChat() {
  const { journalId } = useParams();
  const navigate = useNavigate();
  const {
    journal,
    messages,
    loading,
    sending,
    error,
    sendError,
    sendUserMessage,
    clearSendError,
  } = useConversation(journalId);

  const scrollRef = useRef(null);
  const stickToBottomRef = useRef(true); // follow new messages?
  const didInitialScrollRef = useRef(false);
  const [showJump, setShowJump] = useState(false);

  const scrollToBottom = useCallback((behavior) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
    stickToBottomRef.current = nearBottom;
    setShowJump(!nearBottom);
  }

  // First paint of a loaded conversation jumps straight to the latest message;
  // afterwards, follow new content only while the user is at the bottom.
  useLayoutEffect(() => {
    if (loading || !scrollRef.current) return;
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      scrollToBottom('auto');
      return;
    }
    if (stickToBottomRef.current) scrollToBottom(smoothOrInstant());
  }, [loading, messages, sending, sendError, scrollToBottom]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader label="Opening your conversation…" />
      </div>
    );
  }

  if (error || !journal) {
    return (
      <EmptyState
        icon="🔍"
        title="Conversation unavailable"
        message="We couldn't find this entry or its conversation."
        action={<Button onClick={() => navigate('/history')}>Back to history</Button>}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Slim context header so the user knows which entry they're reflecting on. */}
      <div className="shrink-0 border-b border-stone-200/70 dark:border-stone-800/70">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 lg:max-w-4xl lg:px-6 xl:max-w-5xl">
          <button
            type="button"
            onClick={() => navigate('/history')}
            aria-label="Back to history"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-200/70 hover:text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:text-stone-400 dark:hover:bg-stone-800/70 dark:hover:text-stone-100"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
              <path
                d="M12.5 4.5 7 10l5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wide text-stone-400 dark:text-stone-500">
              Reflecting on
            </p>
            <h1 className="truncate text-sm font-medium text-stone-800 sm:text-base dark:text-stone-100">
              {displayTitle(journal.title)}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="md"
            className="shrink-0"
            onClick={() => navigate(`/journal/${journalId}`)}
          >
            View entry
          </Button>
        </div>
      </div>

      {/* Scrollable transcript (the page's only scroll region). */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overscroll-contain"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:gap-6 lg:max-w-4xl lg:px-6 lg:py-8 xl:max-w-5xl">
            {messages.map((m) => (
              <ChatBubble
                key={m.$id}
                role={m.role}
                content={m.content}
                pending={m.optimistic}
              />
            ))}
            {sending && <TypingBubble />}

            {sendError && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200/70 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/40">
                <p className="text-sm text-red-700 dark:text-red-300">
                  The AI couldn't respond. Your message is kept in the box below.
                </p>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    const text = sendError.text;
                    clearSendError();
                    if (text) sendUserMessage(text);
                  }}
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Jump back to the latest message after scrolling up. */}
        {showJump && (
          <button
            type="button"
            onClick={() => scrollToBottom(smoothOrInstant())}
            aria-label="Scroll to latest message"
            className="absolute bottom-4 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-md transition-colors hover:text-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:text-stone-100"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
              <path
                d="M10 4.5v11m0 0 4.5-4.5M10 15.5 5.5 11"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Pinned composer */}
      <ChatInput
        onSend={sendUserMessage}
        sending={sending}
        initialValue={sendError?.text || ''}
      />
    </div>
  );
}
