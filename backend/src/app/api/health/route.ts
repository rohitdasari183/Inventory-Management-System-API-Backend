// src/app/api/health/route.ts
// Simple health check endpoint

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}
