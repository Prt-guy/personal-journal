// Conversation + message persistence. One conversation per journal.
import { databases, ID, Query, Permission, Role } from './appwrite';
import { APPWRITE } from '../utils/constants';

const DB = APPWRITE.databaseId;
const CONVERSATIONS = APPWRITE.collections.conversations;
const MESSAGES = APPWRITE.collections.messages;

function ownerPermissions(userId) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

export async function createConversation(journalId, userId) {
  // $createdAt is a system attribute — no custom timestamp needed.
  return databases.createDocument(
    DB,
    CONVERSATIONS,
    ID.unique(),
    { journalId, userId },
    ownerPermissions(userId)
  );
}

/** Returns the existing conversation for a journal, or null. */
export async function getConversation(journalId) {
  const res = await databases.listDocuments(DB, CONVERSATIONS, [
    Query.equal('journalId', journalId),
    Query.limit(1),
  ]);
  return res.documents[0] ?? null;
}

/**
 * Get the conversation for a journal, creating it only if absent.
 *
 * Race condition: two rapid "Send to AI" clicks could both see "no conversation"
 * and each create one. We query-then-create to make that window small, and after
 * creating we re-query and keep the earliest document so both callers converge on
 * the same conversation. The ultimate guard is a background *unique index* on
 * `journalId` in the Conversations collection — with it, the losing create throws
 * and we fall back to the winner. (Add that index in the Appwrite console.)
 */
export async function getOrCreateConversation(journalId, userId) {
  const existing = await getConversation(journalId);
  if (existing) return existing;

  try {
    await createConversation(journalId, userId);
  } catch {
    // A concurrent creator (or the unique-index guard) won the race — ignore and
    // fall through to re-query below.
  }

  // Re-query and deterministically pick the oldest so concurrent callers agree.
  const res = await databases.listDocuments(DB, CONVERSATIONS, [
    Query.equal('journalId', journalId),
    Query.orderAsc('$createdAt'),
    Query.limit(1),
  ]);
  return res.documents[0] ?? null;
}

export async function saveMessage(conversationId, role, content, userId) {
  return databases.createDocument(
    DB,
    MESSAGES,
    ID.unique(),
    // Ordering uses the system $createdAt; messages are saved sequentially
    // (user then assistant) so their creation order is preserved.
    { conversationId, role, content },
    // Messages inherit the same per-user privacy. userId is optional so callers
    // that already scoped the conversation can still lock messages down.
    userId ? ownerPermissions(userId) : undefined
  );
}

/** All messages in a conversation, oldest first (chat display order). */
export async function getMessages(conversationId) {
  const res = await databases.listDocuments(DB, MESSAGES, [
    Query.equal('conversationId', conversationId),
    Query.orderAsc('$createdAt'),
    Query.limit(200),
  ]);
  return res.documents;
}
