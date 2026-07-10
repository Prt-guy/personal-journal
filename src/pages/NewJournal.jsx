// New Journal — writing-first. Save returns Home; Send to AI saves, ensures one
// conversation, then opens the chat. All persistence via services.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JournalEditor from '../components/JournalEditor';
import { createJournal } from '../services/journalService';
import { getOrCreateConversation } from '../services/chatService';
import { useSession } from '../context/SessionContext';

export default function NewJournal() {
  const { userId } = useSession();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function persist(title, content) {
    return createJournal({ userId, title, content });
  }

  async function handleSave(title, content) {
    setSaving(true);
    setError(null);
    try {
      await persist(title, content);
      navigate('/');
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  async function handleSendToAI(title, content) {
    setSaving(true);
    setError(null);
    try {
      const journal = await persist(title, content);
      // Ensure exactly one conversation exists before entering the chat.
      await getOrCreateConversation(journal.$id, userId);
      navigate(`/ai/${journal.$id}`);
    } catch (err) {
      setError(err);
      setSaving(false);
    }
  }

  return (
    <>
      {error && (
        <div className="mx-auto mt-4 w-full max-w-3xl px-4 lg:max-w-4xl lg:px-6 xl:max-w-5xl">
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
            Couldn't save your entry. Please try again.
          </p>
        </div>
      )}
      <JournalEditor saving={saving} onSave={handleSave} onSendToAI={handleSendToAI} />
    </>
  );
}
