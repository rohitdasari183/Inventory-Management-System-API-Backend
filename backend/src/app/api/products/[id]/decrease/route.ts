// src/app/api/products/[id]/decrease/route.ts
// POST /api/products/:id/decrease -> body: { amount }

import { NextRequest, NextResponse } from 'next/server';
import { decreaseStock } from '../../../../../controllers/productController';
import { handleError } from '../../../../../middlewares/errorHandler';
import { validateBody } from '../../../../../middlewares/validateBody';
import { stockAmountSchema } from '../../../../../lib/validate';

type Params = {
  params: Promise<{ id: string }>;
}
export async function POST(req: NextRequest, context: Params) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const validated = validateBody(stockAmountSchema, body);
    const result = await decreaseStock(id, validated.amount);
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err);
  }
}
