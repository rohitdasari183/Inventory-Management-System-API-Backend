// src/lib/logger.ts
// A tiny wrapper around console logging so we don’t scatter console.log calls everywhere.
// This makes it easy to later swap in a proper logger like pino or winston
// without having to rewrite the entire codebase.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Format log output consistently.
 * - Adds a timestamp
 * - Uppercases the log level
 * - Handles optional metadata (stringified if it’s an object)
 */
function format(level: LogLevel, message: string, meta?: any) {
  const ts = new Date().toISOString();
  const base = `[${ts}] [${level.toUpperCase()}]`;

  if (meta !== undefined) {
    try {
      // Ensure metadata is logged safely and compactly
      const m = typeof meta === 'string' ? meta : JSON.stringify(meta);
      return `${base} ${message} — ${m}`;
    } catch {
      return `${base} ${message} — (meta)`;
    }
  }
  return `${base} ${message}`;
}

/**
 * Logger object with different log levels.
 * For now, it just wraps console methods, but you can expand it later.
 */
export const logger = {
  debug: (msg: string, meta?: any) => {
    // You could enable/disable debug logs via an environment variable
    // eslint-disable-next-line no-console
    console.debug(format('debug', msg, meta));
  },
  info: (msg: string, meta?: any) => {
    // eslint-disable-next-line no-console
    console.info(format('info', msg, meta));
  },
  warn: (msg: string, meta?: any) => {
    // eslint-disable-next-line no-console
    console.warn(format('warn', msg, meta));
  },
  error: (msg: string, meta?: any) => {
    // eslint-disable-next-line no-console
    console.error(format('error', msg, meta));
  },
};
