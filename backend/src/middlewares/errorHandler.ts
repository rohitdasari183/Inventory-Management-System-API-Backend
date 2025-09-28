// src/middlewares/errorHandler.ts
// Centralized error -> HTTP response helper for Next.js app routes.
//
// Example usage in route handlers (App Router):
// try {
//   // some logic
// } catch (err) {
//   return handleError(err);
// }
//
// The function returns a NextResponse with the correct status code and
// a JSON body describing the error.

import { NextResponse } from 'next/server';
import { HttpError } from '../utils/httpErrors';
import { logger } from '../lib/logger';

export function handleError(err: unknown) {
  // Default response values
  let status = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;

  // Custom HttpError: use its status, message, and details
  if (err instanceof HttpError) {
    status = err.status;
    message = err.message;
    details = err.details;

  // Generic JavaScript Error: fall back to its message
  } else if (err instanceof Error) {
    message = err.message || message;

  // String thrown directly: treat as message
  } else if (typeof err === 'string') {
    message = err;
  }

  // Logging
  // - For server errors (>= 500), log as error with stack trace if possible
  // - For handled/expected errors (< 500), log as info
  if (status >= 500) {
    logger.error(`Unhandled error: ${message}`, { err });
  } else {
    logger.info(`Handled error: ${message}`, { status, details });
  }

  // Response body structure
  const body: Record<string, any> = { error: message };
  if (details) body.details = details;

  // Always return a NextResponse with JSON
  return NextResponse.json(body, { status });
}
