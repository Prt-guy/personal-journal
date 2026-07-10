// The writing surface, shared by New Journal and Journal View's edit mode.
// Pure writing: a large title field and an endless autosizing body. No toolbar.
import { useState } from 'react';
import TextArea from './TextArea';
import Button from './Button';

export default function JournalEditor({
  initialTitle = '',
  initialContent = '',
  saving = false,
  onSave, // (title, content) => void   — persist + go somewhere
  onSendToAI, // optional (title, content) => void
  onCancel, // optional
  saveLabel = 'Save',
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  // Guard: don't allow saving a completely empty entry (empty title AND body).
  const isEmpty = !title.trim() && !content.trim();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 lg:max-w-4xl lg:px-6 lg:py-12 xl:max-w-5xl">
      <label htmlFor="journal-title" className="sr-only">
        Title
      </label>
      <input
        id="journal-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className={[
          'w-full bg-transparent text-3xl font-semibold text-stone-800 placeholder:text-stone-300',
          'focus:outline-none dark:text-stone-100 dark:placeholder:text-stone-600',
          'lg:text-4xl xl:text-5xl',
        ].join(' ')}
      />

      <div className="mt-6 flex-1 lg:mt-8">
        <label htmlFor="journal-body" className="sr-only">
          Journal entry
        </label>
        <TextArea
          id="journal-body"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing…"
          minRows={12}
          className="font-reading text-lg leading-relaxed lg:text-xl lg:leading-loose"
        />
      </div>

      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center gap-3 border-t border-stone-200/70 bg-stone-50/90 py-4 backdrop-blur dark:border-stone-800/70 dark:bg-stone-950/90">
        <Button onClick={() => onSave(title, content)} disabled={saving || isEmpty}>
          {saving ? 'Saving…' : saveLabel}
        </Button>
        {onSendToAI && (
          <Button
            variant="secondary"
            onClick={() => onSendToAI(title, content)}
            disabled={saving || isEmpty}
          >
            Send to AI
          </Button>
        )}
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        {isEmpty && (
          <span className="text-xs text-stone-400 dark:text-stone-500">
            Write something to save.
          </span>
        )}
      </div>
    </div>
  );
}
