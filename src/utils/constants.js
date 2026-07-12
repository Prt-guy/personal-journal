// Centralized access to all environment configuration.
// Nothing else in the app should read `import.meta.env` directly — import from here.

export const APPWRITE = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  collections: {
    journals: import.meta.env.VITE_APPWRITE_JOURNALS_COLLECTION_ID,
    conversations: import.meta.env.VITE_APPWRITE_CONVERSATIONS_COLLECTION_ID,
    messages: import.meta.env.VITE_APPWRITE_MESSAGES_COLLECTION_ID,
  },
};

// Provider selection for aiService (first match wins):
//   1. Gemini      — VITE_GEMINI_API_KEY set (calls Google's API directly)
//   2. Generic     — VITE_AI_API_URL set (POST → { reply })
//   3. Placeholder — neither set (labeled stub, full UI still works)
export const AI_API_URL = import.meta.env.VITE_AI_API_URL || '';

// Google Gemini (Generative Language API).
// SECURITY: putting the key here exposes it in the browser bundle. Acceptable for
// a local/personal MVP; for production, proxy through a backend and set
// VITE_AI_API_URL to that proxy instead (the generic contract already supports it).
export const GEMINI = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  // gemini-flash-latest tracks Google's current Flash model; concrete versioned
  // names like gemini-2.5-flash can be "not available to new users" for fresh keys.
  model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-flash-latest',
  // Hard backstop (~350 words) so a reply can never run away token-wise, even if
  // the model ignores the "keep it short" system instruction on a given turn.
  maxOutputTokens: 500,
};

// Message roles — kept as constants so the enum value is defined in exactly one place.
export const ROLE = {
  USER: 'user',
  ASSISTANT: 'assistant',
};

// localStorage key for the persisted theme preference.
export const THEME_STORAGE_KEY = 'journal-theme';

// ---------------------------------------------------------------------------
// AI context size strategy (see aiService.buildContext).
// A user may accumulate many long journals; we cannot send everything forever.
// These knobs make the truncation policy explicit and trivially tunable.
// A smarter future approach (summaries, embeddings/RAG) would plug in here.
// ---------------------------------------------------------------------------
export const CONTEXT_LIMITS = {
  // How many previous journals (most recent first) to include alongside the current one.
  maxPreviousJournals: 10,
  // Max characters kept from each *previous* journal's body before truncation.
  maxPreviousJournalChars: 800,
  // Max characters kept from the current journal's body (kept generous — it's the focus).
  maxCurrentJournalChars: 8000,
  // How many of the most recent conversation turns to include verbatim.
  maxConversationMessages: 20,
  // Max characters kept from your personal context (src/utils/aiContext.js).
  maxPersonalContextChars: 2000,
  // Max characters kept from a stored conversation summary (see "End chat") when
  // it's used in place of a previous journal's raw truncated content.
  maxSummaryChars: 400,
};
