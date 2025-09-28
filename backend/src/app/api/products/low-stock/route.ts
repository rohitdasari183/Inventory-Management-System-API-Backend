// src/app/api/products/low-stock/route.ts
// GET /api/products/low-stock -> products with stock_quantity < low_stock_threshold

import { NextResponse } from 'next/server';
import { listLowStock } from '../../../../controllers/productController';
import { handleError } from '../../../../middlewares/errorHandler';

export async function GET() {
  try {
    const items = await listLowStock();
    return NextResponse.json(items);
  } catch (err) {
    return handleError(err);
  }
}
