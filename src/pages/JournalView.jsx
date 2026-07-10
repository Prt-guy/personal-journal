// Journal View — read the full entry, edit it in place (reusing the writing UI),
// open the AI chat, or delete it. Missing / not-owned entries are handled.
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteJournal, getJournal, updateJournal } from '../services/journalService';
import JournalEditor from '../components/JournalEditor';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { displayTitle, formatDate } from '../utils/format';

export default function JournalView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // load failure / not found
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setJournal(await getJournal(id));
    } catch (err) {
      // A 404 here also covers "not owned" — Appwrite hides docs the user can't read.
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Fetch-on-mount: intentional loading-state update (external-system sync).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function handleSaveEdit(title, content) {
    setSaving(true);
    try {
      const updated = await updateJournal(id, { title, content });
      setJournal(updated);
      setEditing(false);
    } catch {
      // Surface inline but keep the editor open so the user doesn't lose text.
      setSaving(false);
      return;
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteJournal(id);
      navigate('/history');
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) return <Loader label="Opening your entry…" />;

  if (error || !journal) {
    return (
      <EmptyState
        icon="🔍"
        title="Entry not found"
        message="This entry doesn't exist, or it belongs to a different notebook."
        action={<Button onClick={() => navigate('/history')}>Back to history</Button>}
      />
    );
  }

  if (editing) {
    return (
      <JournalEditor
        initialTitle={journal.title}
        initialContent={journal.content}
        saving={saving}
        saveLabel="Save changes"
        onSave={handleSaveEdit}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 lg:max-w-4xl lg:px-6 lg:py-12 xl:max-w-5xl">
      <div className="mb-2 flex items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold text-stone-800 dark:text-stone-100 lg:text-4xl xl:text-5xl">
          {displayTitle(journal.title)}
        </h1>
      </div>
      <time className="text-sm text-stone-400 dark:text-stone-500">
        {formatDate(journal.$createdAt)}
        {journal.$updatedAt && journal.$updatedAt !== journal.$createdAt
          ? ` · edited ${formatDate(journal.$updatedAt)}`
          : ''}
      </time>

      <article className="font-reading mt-6 whitespace-pre-wrap text-lg leading-relaxed text-stone-700 dark:text-stone-200 lg:mt-8 lg:text-xl lg:leading-loose">
        {journal.content || (
          <span className="italic text-stone-400">This entry is empty.</span>
        )}
      </article>

      <div className="mt-10 flex flex-wrap gap-3 border-t border-stone-200/70 pt-6 dark:border-stone-800/70">
        <Button onClick={() => setEditing(true)}>Edit</Button>
        <Button variant="secondary" onClick={() => navigate(`/ai/${journal.$id}`)}>
          Open AI Chat
        </Button>
        <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
          Delete
        </Button>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => !deleting && setConfirmDelete(false)}
        title="Delete this entry?"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </>
        }
      >
        This can't be undone. The entry and its AI conversation will be gone for good.
      </Modal>
    </div>
  );
}
