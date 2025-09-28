// src/utils/httpErrors.ts
// Simple HttpError class to throw errors with HTTP status codes

export class HttpError extends Error {
  public status: number;
  public details?: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
