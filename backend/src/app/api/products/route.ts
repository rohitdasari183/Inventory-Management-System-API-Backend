// src/app/api/products/route.ts
// GET /api/products -> list products
// POST /api/products -> create a product

import { NextRequest, NextResponse } from 'next/server';
import { listProducts, createProduct } from '../../../controllers/productController';
import { handleError } from '../../../middlewares/errorHandler';
import { validateBody } from '../../../middlewares/validateBody';
import { productCreateSchema } from '../../../lib/validate';

export async function GET() {
  try {
    const products = await listProducts();
    return NextResponse.json(products);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = validateBody(productCreateSchema, body);
    const product = await createProduct(validated);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
