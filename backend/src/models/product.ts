// src/models/product.ts
// Product TypeScript interface used across the backend

export interface Product {
  id?: string;                // Firestore document ID (optional, auto-generated)
  name: string;               // Product name (required)
  description?: string;       // Optional product description
  stock_quantity: number;     // Current inventory count
  low_stock_threshold?: number; // Optional threshold to flag low stock
  createdAt: string;          // Timestamp (ISO string) when created
  updatedAt: string;          // Timestamp (ISO string) when last updated
  // Flexible extension: allow additional fields if needed
  [key: string]: any;
}
