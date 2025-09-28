// src/app/api/products/[id]/route.ts
// GET / PUT / DELETE product by ID

import { NextRequest, NextResponse } from 'next/server';
import { getProduct, updateProduct, deleteProduct } from '../../../../controllers/productController';
import { handleError } from '../../../../middlewares/errorHandler';
import { validateBody } from '../../../../middlewares/validateBody';
import { productUpdateSchema } from '../../../../lib/validate';

type Params = {
  params: Promise<{ id: string }>;
};
export async function GET(_: NextRequest, context: Params) {
  try {
    const { id } = await context.params;
    const product = await getProduct(id);
    return NextResponse.json(product);
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: NextRequest, context: Params) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const validated = validateBody(productUpdateSchema, body);
    const updated = await updateProduct(id, validated);
    return NextResponse.json(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_: NextRequest, context: Params) {
  try {
    const { id } = await context.params;
    const deleted = await deleteProduct(id);
    return NextResponse.json(deleted);
  } catch (err) {
    return handleError(err);
  }
}
