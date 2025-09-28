// src/lib/validate.ts
import { z } from 'zod';

/**
 * Schema for creating a product.
 * - name: required string
 * - description: optional string
 * - stock_quantity: must be an integer >= 0
 * - low_stock_threshold: optional integer >= 0
 */
export const productCreateSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
  stock_quantity: z.number().int().nonnegative(),
  low_stock_threshold: z.number().int().nonnegative().optional(),
});

/**
 * Schema for updating a product.
 * All fields are optional (so you can update just one field if needed).
 */
export const productUpdateSchema = productCreateSchema.partial();

/**
 * Schema for stock adjustments (increase or decrease).
 * Expects a positive integer amount.
 */
export const stockAmountSchema = z.object({
  amount: z.number().int().positive(),
});

/**
 * Validate data against a schema.
 * - Returns parsed data if valid
 * - Throws an Error with a readable message if invalid
 */
export function validateOrThrow<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    // Collect all validation issues into a single error message
    const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(message);
  }
  return result.data;
}
