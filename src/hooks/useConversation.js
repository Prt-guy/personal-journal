// Drives the AI Chat page: loads the journal + its conversation + messages,
// auto-sends the journal exactly once for an empty conversation, and sends
// subsequent user turns optimistically. All persistence goes through services.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllJournals, getJournal } from '../services/journalService';
import {
  getMessages,
  getOrCreateConversation,
  saveMessage,
} from '../services/chatService';
import { sendMessage as aiSendMessage, startConversation } from '../services/aiService';
import { useSession } from '../context/SessionContext';
import { ROLE } from '../utils/constants';

export function useConversation(journalId) {
  const { userId } = useSession();

  const [journal, setJournal] = useState(null);
  const [previousJournals, setPreviousJournals] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(true); // initial load of history
  const [sending, setSending] = useState(false); // an AI turn is in flight
  const [error, setError] = useState(null); // fatal load error (journal missing)
  const [sendError, setSendError] = useState(null); // recoverable send error

  // Guards the one-time auto-send against StrictMode double-invoke / remounts.
  const autoSentRef = useRef(false);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!userId || !journalId) return;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [journalDoc, allJournals] = await Promise.all([
          getJournal(journalId),
          getAllJournals(userId),
        ]);
        if (cancelled) return;

        setJournal(journalDoc);
        setPreviousJournals(allJournals.filter((j) => j.$id !== journalId));

        const convo = await getOrCreateConversation(journalId, userId);
        if (cancelled) return;
        setConversation(convo);

        const existing = convo ? await getMessages(convo.$id) : [];
        if (cancelled) return;
        setMessages(existing);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, journalId]);

  // ── Auto-send the journal once, only if the conversation is empty ─────────
  useEffect(() => {
    if (loading || !conversation || !journal) return;
    if (messages.length > 0) return; // history already exists
    if (autoSentRef.current) return; // already auto-sent this mount
    autoSentRef.current = true;

    (async () => {
      setSending(true);
      setSendError(null);
      try {
        const reply = await startConversation({
          currentJournal: journal,
          previousJournals,
        });
        const saved = await saveMessage(conversation.$id, ROLE.ASSISTANT, reply, userId);
        setMessages((prev) => [...prev, saved]);
      } catch (err) {
        setSendError(err);
        autoSentRef.current = false; // allow retry
      } finally {
        setSending(false);
      }
    })();
  }, [loading, conversation, journal, previousJournals, messages.length, userId]);

  // ── Send a subsequent user message ────────────────────────────────────────
  const sendUserMessage = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || sending || !conversation) return;

      setSendError(null);
      setSending(true);

      // Optimistically render the user's message with a temporary id.
      const optimistic = {
        $id: `optimistic-${Date.now()}`,
        role: ROLE.USER,
        content: trimmed,
        optimistic: true,
      };
      const prior = messages;
      setMessages((prev) => [...prev, optimistic]);

      try {
        const reply = await aiSendMessage({
          currentJournal: journal,
          previousJournals,
          messages: prior,
          latestUserMessage: trimmed,
        });

        // Persist both turns, then replace the optimistic entry with saved docs.
        const savedUser = await saveMessage(conversation.$id, ROLE.USER, trimmed, userId);
        const savedAssistant = await saveMessage(
          conversation.$id,
          ROLE.ASSISTANT,
          reply,
          userId
        );
        setMessages((prev) => [
          ...prev.filter((m) => m.$id !== optimistic.$id),
          savedUser,
          savedAssistant,
        ]);
      } catch (err) {
        // Roll the optimistic message back but keep the text for retry.
        setMessages(prior);
        setSendError({ error: err, text: trimmed });
      } finally {
        setSending(false);
      }
    },
    [sending, conversation, messages, journal, previousJournals, userId]
  );

  return {
    journal,
    messages,
    loading,
    sending,
    error,
    sendError,
    sendUserMessage,
    clearSendError: () => setSendError(null),
  };
}
