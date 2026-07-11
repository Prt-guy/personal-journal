// All journal persistence lives here. Components/hooks call these functions;
// they never touch Appwrite directly.
import { databases, ID, Query, Permission, Role } from './appwrite';
import { APPWRITE } from '../utils/constants';

const DB = APPWRITE.databaseId;
const COLLECTION = APPWRITE.collections.journals;

// Document-level permissions: only the owning user can read/update/delete.
// Passing the user's identity as Role.user keeps every document strictly private
// and lets a real auth system slot in later with no data-model change.
function ownerPermissions(userId) {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

/**
 * Create a journal.
 * @param {{ userId: string, title: string, content: string }} data
 */
export async function createJournal({ userId, title, content }) {
  // Timestamps are Appwrite system attributes ($createdAt / $updatedAt) — set
  // automatically on create/update, so we don't store our own.
  return databases.createDocument(
    DB,
    COLLECTION,
    ID.unique(),
    {
      userId,
      title: title ?? '',
      content: content ?? '',
    },
    ownerPermissions(userId)
  );
}

/**
 * Update an existing journal. Appwrite refreshes $updatedAt automatically.
 * @param {string} id
 * @param {{ title?: string, content?: string }} data
 */
export async function updateJournal(id, { title, content }) {
  const patch = {};
  if (title !== undefined) patch.title = title;
  if (content !== undefined) patch.content = content;
  return databases.updateDocument(DB, COLLECTION, id, patch);
}

/** Fetch a single journal by id. Throws (404) if missing / not owned. */
export async function getJournal(id) {
  return databases.getDocument(DB, COLLECTION, id);
}

/**
 * Every journal in the collection, newest first (shared history — not scoped
 * to the caller's anonymous session).
 */
export async function getAllJournals() {
  const res = await databases.listDocuments(DB, COLLECTION, [
    Query.orderDesc('$createdAt'),
    Query.limit(100),
  ]);
  return res.documents;
}

export async function deleteJournal(id) {
  return databases.deleteDocument(DB, COLLECTION, id);
}
