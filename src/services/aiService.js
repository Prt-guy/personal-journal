// AI reflection service.
//
// Provider is chosen by env (see callAI), first match wins:
//   1. Gemini      — VITE_GEMINI_API_KEY set → Google Generative Language API
//   2. Generic     — VITE_AI_API_URL set → POST our neutral payload, expect { reply }
//   3. Placeholder — neither → labeled stub so the whole UI flow works offline
//
// buildContext() produces a provider-neutral payload; each provider has an
// isolated request builder + response parser, so adding/swapping a provider never
// touches the pages, hooks, or context-assembly logic.
//
// ── Request contract ────────────────────────────────────────────────────────
//   POST {VITE_AI_API_URL}
//   Content-Type: application/json
//   Body: {
//     context: {                     // assembled by buildContext()
//       currentJournal: { title, content },
//       previousJournals: [{ title, content, createdAt }],  // truncated (see limits)
//       messages: [{ role, content }],                      // recent turns
//     },
//     latestUserMessage: string,     // "" for the very first auto-send
//     prompt: string,                // a flattened, ready-to-send text framing
//   }
//
// ── Response contract ───────────────────────────────────────────────────────
//   { reply: string }
//   Response parsing is isolated in parseReply() so a different real-world shape
//   is a one-function change.
// ─────────────────────────────────────────────────────────────────────────────
import axios from 'axios';
import { AI_API_URL, CONTEXT_LIMITS, GEMINI, ROLE } from '../utils/constants';
import { PERSONAL_CONTEXT } from '../utils/aiContext';

function truncate(text = '', max) {
  if (text.length <= max) return text;
  return text.slice(0, max) + '\n…[truncated for length]';
}

/**
 * Assemble the payload the AI receives. Order is intentional and always the same:
 *   current journal → all previous journals → full conversation → latest message.
 * The AI must never get only the latest message.
 *
 * Size defense: previous journals are the unbounded dimension (a user may have
 * hundreds of long entries), so we cap their count and per-entry length via
 * CONTEXT_LIMITS. The current journal and recent turns are kept generous. This is
 * the seam where a smarter strategy (rolling summaries, embeddings/RAG retrieval
 * of only the most relevant past entries) would later plug in.
 */
export function buildContext({ currentJournal, previousJournals = [], messages = [] }) {
  const current = {
    title: currentJournal?.title ?? '',
    content: truncate(currentJournal?.content ?? '', CONTEXT_LIMITS.maxCurrentJournalChars),
  };

  const trimmedPrevious = previousJournals
    // Exclude the current journal if it happens to be in the list.
    .filter((j) => j.$id !== currentJournal?.$id)
    .slice(0, CONTEXT_LIMITS.maxPreviousJournals)
    .map((j) => ({
      title: j.title ?? '',
      // A journal whose conversation was ended carries a short AI-written summary
      // (see endConversation) — denser and cheaper than a raw truncation, so it
      // takes priority. Otherwise fall back to the raw truncated content.
      content: j.summary
        ? truncate(j.summary, CONTEXT_LIMITS.maxSummaryChars)
        : truncate(j.content ?? '', CONTEXT_LIMITS.maxPreviousJournalChars),
      createdAt: j.$createdAt,
      summarized: Boolean(j.summary),
    }));

  // Keep only the most recent turns verbatim; older turns are dropped here and
  // would be the target of summarization in a future iteration.
  const recentMessages = messages
    .slice(-CONTEXT_LIMITS.maxConversationMessages)
    .map((m) => ({ role: m.role, content: m.content }));

  const context = {
    // Your personal context from src/utils/aiContext.js — sent to the AI first,
    // on every request. Trimmed so an over-long note can't blow the budget.
    profile: truncate((PERSONAL_CONTEXT ?? '').trim(), CONTEXT_LIMITS.maxPersonalContextChars),
    currentJournal: current,
    previousJournals: trimmedPrevious,
    messages: recentMessages,
  };

  return { context, prompt: flattenToPrompt(context) };
}

// A human-readable, single-string framing of the context. Handy for endpoints
// that take a single `prompt` field, and useful for debugging what the AI sees.
function flattenToPrompt(context) {
  const parts = [];
  parts.push(
    'You are a warm, thoughtful journaling companion. Reflect on the writing and ' +
      'draw continuity from earlier entries when relevant. Match your reply length ' +
      "to what was written — a one-line entry gets a short reply, not an essay. " +
      'Name the emotional essence of what you sense rather than recapping their ' +
      'words back to them. No padding, no generic affirmations — one focused ' +
      'thought or question, nothing more.'
  );

  if (context.profile) {
    parts.push('\n=== ABOUT THE WRITER (standing life context) ===');
    parts.push(context.profile);
  }

  parts.push('\n=== CURRENT JOURNAL ===');
  parts.push(`Title: ${context.currentJournal.title || '(untitled)'}`);
  parts.push(context.currentJournal.content || '(empty)');

  if (context.previousJournals.length) {
    parts.push('\n=== PREVIOUS JOURNALS (most recent first, possibly truncated) ===');
    context.previousJournals.forEach((j, i) => {
      const label = j.summarized ? 'summary' : 'excerpt';
      parts.push(`\n[${i + 1}] ${j.title || '(untitled)'} — ${j.createdAt ?? ''} (${label})`);
      parts.push(j.content || '(empty)');
    });
  }

  if (context.messages.length) {
    parts.push('\n=== CONVERSATION SO FAR ===');
    context.messages.forEach((m) => parts.push(`${m.role}: ${m.content}`));
  }

  return parts.join('\n');
}

// Single place that reads the generic HTTP response shape. Change here if the real
// endpoint returns something other than { reply }.
function parseReply(data) {
  if (data && typeof data.reply === 'string') return data.reply;
  if (typeof data === 'string') return data;
  throw new Error('Unexpected AI response shape');
}

// ── Gemini (Google Generative Language API) ─────────────────────────────────
// Transform our neutral context into Gemini's { system_instruction, contents }.
// Persona + previous journals become system context (the AI's "memory"); the
// current journal opens the turn-by-turn `contents`, followed by the conversation.
function buildGeminiRequest(context) {
  const systemParts = [
    'You are a warm, thoughtful journaling companion. Reflect on the writing and ' +
      'draw continuity from earlier entries when relevant — never clinical. ' +
      'Match your reply length to what was written: a one-line entry gets a ' +
      'sentence or two back, not an essay; only a long, detailed entry earns a ' +
      'longer reply. Prioritize naming the emotional essence of what you sense ' +
      "over recapping their words back to them. No padding, no generic " +
      'affirmations, no multi-part responses — one focused thought or question.',
  ];

  // Standing life context about the writer — steer responses to be personal.
  if (context.profile) {
    systemParts.push(
      "\nHere is standing context the writer gave about their life and what they're " +
        'going through. Weave it in naturally when it helps; never recite it back:\n' +
        context.profile
    );
  }

  if (context.previousJournals.length) {
    systemParts.push(
      "\nFor continuity, here are the user's earlier journal entries " +
        '(most recent first, possibly truncated). Use them only as background memory:'
    );
    context.previousJournals.forEach((j, i) => {
      const label = j.summarized ? 'summary' : 'excerpt';
      systemParts.push(
        `\n[${i + 1}] ${j.title || '(untitled)'} — ${j.createdAt ?? ''} (${label})\n${j.content || '(empty)'}`
      );
    });
  }

  const contents = [];

  // The current journal is the opening "user" turn — it's what they wrote.
  contents.push({
    role: 'user',
    parts: [
      {
        text:
          'Here is my journal entry.\n\n' +
          `Title: ${context.currentJournal.title || '(untitled)'}\n\n` +
          `${context.currentJournal.content || '(empty)'}`,
      },
    ],
  });

  // Conversation so far. Gemini uses "model" for the assistant role.
  context.messages.forEach((m) => {
    contents.push({
      role: m.role === ROLE.ASSISTANT ? 'model' : 'user',
      parts: [{ text: m.content }],
    });
  });

  return {
    system_instruction: { parts: [{ text: systemParts.join('\n') }] },
    contents,
    // Hard backstop on reply length — see GEMINI.maxOutputTokens. The generic
    // AI_API_URL proxy path isn't ours to cap this way; prompt wording is the
    // only lever there.
    generationConfig: { maxOutputTokens: GEMINI.maxOutputTokens },
  };
}

// Isolated Gemini response parsing (mirror of parseReply for the generic path).
function parseGeminiReply(data) {
  const blocked = data?.promptFeedback?.blockReason;
  if (blocked) {
    throw new Error(`The AI declined to respond (${blocked}).`);
  }
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.map((p) => p.text ?? '').join('').trim();
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(context) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI.model}:generateContent`;
  const body = buildGeminiRequest(context);

  // gemini-flash-latest occasionally returns 503 UNAVAILABLE during demand spikes.
  // Retry a couple of times with backoff before surfacing the error to the user.
  // (429 quota / other errors are NOT retried — they won't clear on a retry.)
  const maxAttempts = 3;
  for (let attempt = 1; ; attempt++) {
    try {
      const { data } = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI.apiKey,
        },
      });
      return parseGeminiReply(data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 503 && attempt < maxAttempts) {
        await sleep(attempt * 800);
        continue;
      }
      throw err;
    }
  }
}

async function callAI({ context, prompt, latestUserMessage }) {
  // 1. Gemini configured → call Google directly.
  if (GEMINI.apiKey) {
    return callGemini(context);
  }

  // 2. Generic backend/proxy configured → POST our neutral payload.
  if (AI_API_URL) {
    const { data } = await axios.post(
      AI_API_URL,
      { context, prompt, latestUserMessage },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return parseReply(data);
  }

  // 3. Nothing configured → labeled placeholder so the full flow still works.
  return placeholderReply({ context, latestUserMessage });
}

// Deterministic, obviously-fake reply that still exercises the real UI paths.
function placeholderReply({ context, latestUserMessage }) {
  const title = context.currentJournal.title || 'your entry';
  if (!latestUserMessage) {
    return (
      `[AI placeholder response] Thanks for sharing “${title}”. ` +
      `I've read it${context.previousJournals.length ? ' along with your earlier entries' : ''}` +
      `${context.profile ? ', and keeping your life context in mind' : ''}. ` +
      `What feeling stands out most as you re-read it?`
    );
  }
  return (
    `[AI placeholder response] You said: “${latestUserMessage}”. ` +
    `That's worth sitting with — what do you think is underneath it?`
  );
}

// ── Conversation summarization ("End chat") ─────────────────────────────────
// A distinct, smaller request than a reply: asks for short background notes on
// the conversation instead of something addressed to the writer. Uses the full
// message list the caller passes in (not the outgoing-context cap in
// buildContext) — this runs once per conversation, not once per message.
const SUMMARY_MAX_OUTPUT_TOKENS = 200;

function summaryPrompt({ currentJournal, transcript }) {
  return (
    'Summarize the emotional essence and key themes of the conversation below in ' +
    '2-4 sentences, under 400 characters. Focus on feelings and turning points, ' +
    'not a blow-by-blow recap. Write it as background notes for your own future ' +
    'reference — not addressed to the writer.\n\n' +
    `Journal title: ${currentJournal?.title || '(untitled)'}\n\n` +
    `=== CONVERSATION ===\n${transcript}`
  );
}

async function callGeminiSummary(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI.model}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: SUMMARY_MAX_OUTPUT_TOKENS },
  };
  const { data } = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI.apiKey },
  });
  return parseGeminiReply(data);
}

// Deterministic placeholder so "End chat" works with no provider configured too.
function placeholderSummary({ currentJournal, messages }) {
  const title = currentJournal?.title || 'this entry';
  return `[Placeholder summary] Reflected on "${title}" across ${messages.length} messages.`;
}

/** Summarize a finished conversation and return the summary text (unpersisted). */
export async function summarizeConversation({ currentJournal, messages }) {
  const transcript = messages.map((m) => `${m.role}: ${m.content}`).join('\n');

  let summary;
  if (GEMINI.apiKey) {
    summary = await callGeminiSummary(summaryPrompt({ currentJournal, transcript }));
  } else if (AI_API_URL) {
    const { data } = await axios.post(
      AI_API_URL,
      {
        context: { currentJournal, transcript },
        prompt: summaryPrompt({ currentJournal, transcript }),
        latestUserMessage: '',
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    summary = parseReply(data);
  } else {
    summary = placeholderSummary({ currentJournal, messages });
  }

  return truncate(summary.trim(), CONTEXT_LIMITS.maxSummaryChars);
}

/**
 * First AI turn for a brand-new conversation (auto-sent once).
 * latestUserMessage is empty here: the journal itself is the prompt.
 */
export async function startConversation({ currentJournal, previousJournals }) {
  const { context, prompt } = buildContext({
    currentJournal,
    previousJournals,
    messages: [],
  });
  return callAI({ context, prompt, latestUserMessage: '' });
}

/** Every subsequent user turn. */
export async function sendMessage({
  currentJournal,
  previousJournals,
  messages,
  latestUserMessage,
}) {
  const { context, prompt } = buildContext({
    currentJournal,
    previousJournals,
    // Include the latest user message in the conversation slice too, so context
    // and the explicit latestUserMessage field stay consistent.
    messages: [...messages, { role: ROLE.USER, content: latestUserMessage }],
  });
  return callAI({ context, prompt, latestUserMessage });
}
