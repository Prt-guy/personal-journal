# Personal AI Journal

A calm, distraction-free digital notebook. **Writing comes first**; AI reflection
is secondary and only appears after you explicitly send an entry for analysis.
There is **no login** — identity is handled invisibly via an Appwrite anonymous
session, so you can start writing immediately.

Built with React 19, React Router, Tailwind CSS v4, the Appwrite JS SDK, and Axios.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and fill in your Appwrite details:
   ```bash
   cp .env.example .env
   ```
   | Variable | Purpose |
   |---|---|
   | `VITE_APPWRITE_ENDPOINT` | Appwrite API endpoint (e.g. `https://cloud.appwrite.io/v1`) |
   | `VITE_APPWRITE_PROJECT_ID` | Appwrite project ID |
   | `VITE_APPWRITE_DATABASE_ID` | Database ID |
   | `VITE_APPWRITE_JOURNALS_COLLECTION_ID` | Journals collection ID |
   | `VITE_APPWRITE_CONVERSATIONS_COLLECTION_ID` | Conversations collection ID |
   | `VITE_APPWRITE_MESSAGES_COLLECTION_ID` | Messages collection ID |
   | `VITE_AI_API_URL` | External AI endpoint (POST). **Leave blank to use the built-in placeholder.** |
3. Run the dev server:
   ```bash
   npm run dev
   ```

Without `VITE_AI_API_URL`, the app returns a clearly-labeled `[AI placeholder response]`
so the full journal → chat flow works end-to-end before the real AI is wired in.

## Appwrite setup

Create a database with three collections. Enable **Anonymous** auth in
*Auth → Settings*, and use **document-level permissions** so each anonymous user
only sees their own data.

Timestamps use Appwrite's built-in **`$createdAt` / `$updatedAt`** system
attributes — do **not** add custom `createdAt`/`updatedAt` fields (the app orders
and displays by the system ones).

**Journals** — `userId` (string, indexed), `title` (string), `content` (string, large).

**Conversations** — `journalId` (string, indexed), `userId` (string, indexed),
`summary` (string, ~2000, optional), `ended` (boolean, default `false`).
Add a **unique index on `journalId`** to guarantee one conversation per journal
(the ultimate guard against duplicate conversations). `summary` is written once
the user presses "End chat" and is used in place of a journal's raw truncated
content when it's referenced from a *different* journal's conversation; `ended`
locks that conversation from further messages.

**Messages** — `conversationId` (string, indexed), `role` (enum: `user`|`assistant`),
`content` (string, large). Ordered by `$createdAt`.

## Architecture

```
src/
  pages/       Home, NewJournal, History, JournalView, AIChat, NotFound
  components/  Button, Input, TextArea, JournalCard, ChatBubble, ChatInput,
               Loader, EmptyState, Layout, Modal, JournalEditor, SessionGate, ThemeToggle
  hooks/       useJournals, useConversation
  context/     SessionContext (anonymous identity), ThemeContext (light/dark)
  services/    appwrite (single client), journalService, chatService, aiService
  utils/       constants (all env + tunables), format
```

- **No component imports the Appwrite or Axios SDK directly** — all data access
  goes through the service layer.
- The **AI request/response contract** is documented at the top of
  `services/aiService.js`; swapping in the real endpoint is a one-line `.env` change.
- **AI context** always includes your personal context + the current journal +
  previous journals + full conversation + latest message, with a documented,
  tunable size-limit strategy (`CONTEXT_LIMITS` in `utils/constants.js`).
- **Personal context** — edit **`src/utils/aiContext.js`** and write whatever you
  want the AI to know about your life. That text is injected first, on every AI
  request. No UI, no database — just edit the file and restart the dev server.

## Notes & tradeoffs

- Anonymous sessions are tied to the browser. Clearing site data or switching
  devices starts a fresh, empty journal. The data model keeps `userId` throughout
  so real accounts can be added later with no data-model changes.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint
