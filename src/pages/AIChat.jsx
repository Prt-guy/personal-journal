// AI Chat — ChatGPT-like layout over one journal's conversation. All logic lives
// in useConversation; this page is presentation + scroll management.
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useConversation } from '../hooks/useConversation';
import ChatBubble, { TypingBubble } from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { displayTitle } from '../utils/format';

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

  const bottomRef = useRef(null);

  // Auto-scroll to the newest message (and while the typing indicator shows).
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  if (loading) return <Loader label="Opening your conversation…" />;

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
    <div className="flex flex-1 flex-col">
      {/* Slim context header so the user knows which entry they're reflecting on. */}
      <div className="border-b border-stone-200/70 dark:border-stone-800/70">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 lg:max-w-4xl lg:px-6 xl:max-w-5xl">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-stone-400 dark:text-stone-500">
              Reflecting on
            </p>
            <h1 className="truncate text-base font-medium text-stone-800 dark:text-stone-100">
              {displayTitle(journal.title)}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="md"
            onClick={() => navigate(`/journal/${journalId}`)}
          >
            View entry
          </Button>
        </div>
      </div>

      {/* Scrollable transcript */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 lg:max-w-4xl lg:gap-5 lg:px-6 lg:py-8 xl:max-w-5xl">
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
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              <p className="mb-2">
                The AI couldn't respond. Your message is kept below — try again.
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

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Fixed composer */}
      <ChatInput
        onSend={sendUserMessage}
        disabled={sending}
        initialValue={sendError?.text || ''}
      />
    </div>
  );
}
