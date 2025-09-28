// src/services/productService.ts
// Product business logic (CRUD + atomic stock ops) using Firestore.
// All methods accept an optional collectionName parameter (default 'products') so collection access is dynamic.

import { db } from '../../firebase/admin';
import { Product } from '../models/product';
import { HttpError } from '../utils/httpErrors';

/**
 * Default collection name used when none provided.
 */
const DEFAULT_COLLECTION = 'products';

/**
 * Helper to get a document reference for a given collection & id.
 */
function docRef(collectionName: string, id: string) {
  return db.collection(collectionName).doc(id);
}

/**
 * Create a new product.
 *
 * Ensures:
 *  - name is present (string)
 *  - stock_quantity is integer >= 0
 *
 * Returns created product object with id, createdAt and updatedAt.
 */
export async function createProduct(
  payload: {
    name: string;
    description?: string;
    stock_quantity: number;
    low_stock_threshold?: number;
    [k: string]: any;
  },
  collectionName: string = DEFAULT_COLLECTION
): Promise<Product> {
  // Basic validation
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(400, 'Invalid payload');
  }
  if (!payload.name || typeof payload.name !== 'string') {
    throw new HttpError(400, 'Product name is required');
  }
  if (!Number.isInteger(payload.stock_quantity) || payload.stock_quantity < 0) {
    throw new HttpError(400, 'stock_quantity must be an integer >= 0');
  }
  if (payload.low_stock_threshold !== undefined && (!Number.isInteger(payload.low_stock_threshold) || payload.low_stock_threshold < 0)) {
    throw new HttpError(400, 'low_stock_threshold must be an integer >= 0 when provided');
  }

  // Prepare document data with readable timestamps so result is immediately usable
  const now = new Date().toISOString();
  const docRef = db.collection(collectionName).doc();

  const docData: any = {
    id: docRef.id,
    name: payload.name,
    description: payload.description ?? '',
    stock_quantity: payload.stock_quantity,
    ...(payload.low_stock_threshold !== undefined ? { low_stock_threshold: payload.low_stock_threshold } : {}),
    createdAt: now,
    updatedAt: now,
    // allow any other custom fields
    ...Object.keys(payload)
      .filter((k) => !['name', 'description', 'stock_quantity', 'low_stock_threshold'].includes(k))
      .reduce((acc: any, k) => {
        acc[k] = (payload as any)[k];
        return acc;
      }, {}),
  };

  await docRef.set(docData);
  return docData as Product;
}

/**
 * Get a product by ID. Throws 404 if not found.
 */
export async function getProductById(id: string, collectionName: string = DEFAULT_COLLECTION): Promise<Product> {
  const snap = await docRef(collectionName, id).get();
  if (!snap.exists) throw new HttpError(404, 'Product not found');
  return { id: snap.id, ...(snap.data() as Product) } as Product;
}

/**
 * List products. Optionally pass `limit`.
 * Returns array of Product objects sorted by createdAt desc.
 */
export async function listProducts(limit?: number, collectionName: string = DEFAULT_COLLECTION): Promise<Product[]> {
  let q: FirebaseFirestore.Query = db.collection(collectionName).orderBy('createdAt', 'desc');
  if (limit && Number.isInteger(limit) && limit > 0) q = q.limit(limit);
  const snaps = await q.get();
  const items: Product[] = [];
  snaps.forEach((s) => items.push({ id: s.id, ...(s.data() as Product) }));
  return items;
}

/**
 * Update product fields (name, description, stock_quantity, low_stock_threshold).
 * Validates stock_quantity if provided and ensures it doesn't go < 0.
 * Throws 404 if product not found.
 */
export async function updateProduct(
  id: string,
  updates: Partial<Product>,
  collectionName: string = DEFAULT_COLLECTION
): Promise<Product> {
  const allowed = ['name', 'description', 'stock_quantity', 'low_stock_threshold'] as const;
  const payload: any = {};
  for (const k of allowed) if ((updates as any)[k] !== undefined) payload[k] = (updates as any)[k];

  if (payload.stock_quantity !== undefined) {
    if (!Number.isInteger(payload.stock_quantity) || payload.stock_quantity < 0) {
      throw new HttpError(400, 'stock_quantity must be an integer >= 0');
    }
  }
  if (payload.low_stock_threshold !== undefined) {
    if (!Number.isInteger(payload.low_stock_threshold) || payload.low_stock_threshold < 0) {
      throw new HttpError(400, 'low_stock_threshold must be an integer >= 0');
    }
  }

  payload.updatedAt = new Date().toISOString();

  const ref = docRef(collectionName, id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, 'Product not found');

  await ref.update(payload);
  const updated = await ref.get();
  return { id: updated.id, ...(updated.data() as Product) } as Product;
}

/**
 * Delete product by id. Throws 404 if product not found.
 */
export async function deleteProduct(id: string, collectionName: string = DEFAULT_COLLECTION) {
  const ref = docRef(collectionName, id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpError(404, 'Product not found');
  await ref.delete();
  return { id };
}

/**
 * Increase stock atomically using Firestore transaction.
 * - amount must be integer > 0
 * Returns { id, stock_quantity } after update.
 */
export async function increaseStock(id: string, amount: number, collectionName: string = DEFAULT_COLLECTION) {
  if (!Number.isInteger(amount) || amount <= 0) throw new HttpError(400, 'amount must be an integer > 0');

  const ref = docRef(collectionName, id);
  const newQty = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpError(404, 'Product not found');
    const current = (snap.data() as Product).stock_quantity ?? 0;
    const updated = current + amount;
    tx.update(ref, { stock_quantity: updated, updatedAt: new Date().toISOString() });
    return updated;
  });

  return { id, stock_quantity: newQty };
}

/**
 * Decrease stock atomically using Firestore transaction.
 * Throws 400 if insufficient stock.
 * Returns { id, stock_quantity } after update.
 */
export async function decreaseStock(id: string, amount: number, collectionName: string = DEFAULT_COLLECTION) {
  if (!Number.isInteger(amount) || amount <= 0) throw new HttpError(400, 'amount must be an integer > 0');

  const ref = docRef(collectionName, id);
  const newQty = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpError(404, 'Product not found');
    const current = (snap.data() as Product).stock_quantity ?? 0;
    if (current < amount) throw new HttpError(400, 'Insufficient stock');
    const updated = current - amount;
    tx.update(ref, { stock_quantity: updated, updatedAt: new Date().toISOString() });
    return updated;
  });

  return { id, stock_quantity: newQty };
}

/**
 * List all products that have low_stock_threshold set and stock_quantity < low_stock_threshold.
 * Note: Firestore queries cannot directly compare two fields; we query for docs that have a low_stock_threshold value,
 * then filter in memory by comparing the two numbers.
 */
export async function listLowStock(collectionName: string = DEFAULT_COLLECTION): Promise<Product[]> {
  const snaps = await db.collection(collectionName).where('low_stock_threshold', '!=', null).get();
  const items: Product[] = [];
  snaps.forEach((s) => {
    const data = s.data() as Product;
    if (typeof data.low_stock_threshold === 'number' && typeof data.stock_quantity === 'number') {
      if (data.stock_quantity < data.low_stock_threshold) {
        items.push({ id: s.id, ...(data as Product) });
      }
    }
  });
  return items;
}
