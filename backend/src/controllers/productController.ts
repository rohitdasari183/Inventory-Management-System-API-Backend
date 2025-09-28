// src/controllers/productController.ts
// This is a thin controller layer that adapts HTTP-level data into service calls.
// Its job is to keep route handlers small and focused, while making it easy
// to reuse the same logic if you later add other transports (e.g., GraphQL, gRPC).

import {
  createProduct as svcCreate,
  listProducts as svcList,
  getProductById as svcGetById,
  updateProduct as svcUpdate,
  deleteProduct as svcDelete,
  increaseStock as svcIncrease,
  decreaseStock as svcDecrease,
  listLowStock as svcListLowStock,
} from '../services/productService';
import { Product } from '../models/product';
import { HttpError } from '../utils/httpErrors';

/**
 * Create a new product.
 * - expects a validated payload with at least `name` and `stock_quantity`
 * - `description` and `low_stock_threshold` are optional
 */
export async function createProduct(payload: {
  name: string;
  description?: string;
  stock_quantity: number;
  low_stock_threshold?: number;
  [k: string]: any;
}): Promise<Product> {
  // Basic safety check at the controller level
  if (!payload || typeof payload !== 'object') throw new HttpError(400, 'Invalid payload');
  return svcCreate(payload);
}

/**
 * List products.
 * - accepts an optional `limit`
 */
export async function listProducts(limit?: number): Promise<Product[]> {
  return svcList(limit);
}

/**
 * Fetch a single product by its id.
 */
export async function getProduct(id: string): Promise<Product> {
  if (!id) throw new HttpError(400, 'Missing product id');
  return svcGetById(id);
}

/**
 * Update product details.
 * - accepts partial updates (only the fields provided are changed)
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  if (!id) throw new HttpError(400, 'Missing product id');
  if (!updates || typeof updates !== 'object') throw new HttpError(400, 'Invalid updates');
  return svcUpdate(id, updates);
}

/**
 * Delete a product by id.
 */
export async function deleteProduct(id: string) {
  if (!id) throw new HttpError(400, 'Missing product id');
  return svcDelete(id);
}

/**
 * Increase stock for a given product.
 * - `amount` must be a positive integer
 */
export async function increaseStock(id: string, amount: number) {
  if (!id) throw new HttpError(400, 'Missing product id');
  if (!Number.isInteger(amount) || amount <= 0) throw new HttpError(400, 'amount must be an integer > 0');
  return svcIncrease(id, amount);
}

/**
 * Decrease stock for a given product.
 * - `amount` must be a positive integer
 */
export async function decreaseStock(id: string, amount: number) {
  if (!id) throw new HttpError(400, 'Missing product id');
  if (!Number.isInteger(amount) || amount <= 0) throw new HttpError(400, 'amount must be an integer > 0');
  return svcDecrease(id, amount);
}

/**
 * List products that are below their `low_stock_threshold`.
 */
export async function listLowStock() {
  return svcListLowStock();
}
