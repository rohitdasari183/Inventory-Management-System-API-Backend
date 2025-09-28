// firebase/admin.ts
// Firebase Admin setup for server-side Next.js usage.
// Requires environment variables from .env.local:
//   - FIREBASE_PROJECT_ID
//   - FIREBASE_CLIENT_EMAIL
//   - FIREBASE_PRIVATE_KEY
//
// Exports:
//   - admin: the firebase-admin instance
//   - db: Firestore instance
//   - helper functions: createDocument, getDocumentById, updateDocument, deleteDocument
//
// NOTE: The private key in .env.local should have newlines escaped as \n.
//       This file converts them back to real newlines.

import admin from 'firebase-admin';

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase environment variables. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env.local'
    );
  }

  // Turn escaped \n characters into real newlines for the private key
  privateKey = privateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    } as admin.ServiceAccount),
  });
}

// Firestore instance
const db = admin.firestore();

/**
 * Create a document in a collection.
 * This helper automatically sets `id`, `createdAt`, and `updatedAt`.
 * - collectionName: e.g. "products"
 * - data: object with fields (validation happens in services)
 *
 * Returns the created document (including its `id`).
 */
export async function createDocument(collectionName: string, data: Record<string, any>) {
  const docRef = db.collection(collectionName).doc(); // generate id locally
  const now = new Date().toISOString();

  const payload = {
    id: docRef.id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(payload);
  return payload;
}

/**
 * Get a document by id.
 * Returns the raw data or null if the document doesn’t exist.
 */
export async function getDocumentById(collectionName: string, id: string) {
  const snap = await db.collection(collectionName).doc(id).get();
  return snap.exists ? (snap.data() as Record<string, any>) : null;
}

/**
 * Update a document (partial update).
 * Automatically updates the `updatedAt` timestamp.
 */
export async function updateDocument(collectionName: string, id: string, updates: Record<string, any>) {
  const now = new Date().toISOString();
  await db.collection(collectionName).doc(id).update({ ...updates, updatedAt: now });
  const snap = await db.collection(collectionName).doc(id).get();
  return snap.exists ? (snap.data() as Record<string, any>) : null;
}

/**
 * Delete a document by id.
 */
export async function deleteDocument(collectionName: string, id: string) {
  await db.collection(collectionName).doc(id).delete();
  return { id };
}

// Export the firebase-admin instance and Firestore
export { admin, db };
