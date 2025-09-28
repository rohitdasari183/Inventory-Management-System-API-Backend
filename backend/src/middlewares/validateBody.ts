// src/middlewares/validateBody.ts
import { z } from 'zod';
import { HttpError } from '../utils/httpErrors';

/**
 * Validate JSON body with the provided Zod schema.
 * If validation fails, it throws an HttpError with status 400 (Bad Request).
 *
 * Example usage inside an App Router endpoint:
 *
 *   const body = await req.json();
 *   const data = validateBody(productCreateSchema, body);
 */
export function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    // Collect detailed validation error messages
    const msg = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');

    // Throw a structured 400 error with details
    throw new HttpError(400, `Invalid request body: ${msg}`);
  }

  // Return the validated and typed data
  return parsed.data;
}
