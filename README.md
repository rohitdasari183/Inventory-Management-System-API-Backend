# Inventory Management System API

## Project Overview

This is a backend-heavy Inventory Management System API built with **Next.js 15.5.4** and **TypeScript**, using **Firebase Firestore** for data storage.  
It allows managing products in a warehouse with full CRUD operations, stock management, and low-stock monitoring.

### Core Features

- **Product Management:** Create, read, update, and delete products.
- **Inventory Logic:** 
  - Prevents stock_quantity from going below zero.
  - Endpoints to increase or decrease stock safely.
- **Low Stock Monitoring:** Optional low_stock_threshold field; endpoint to list products below the threshold.
- **Error Handling:** Proper HTTP error responses for invalid operations.

---

## Environment Setup

1. Clone the repository:

```bash
git clone <your-repo-url>
cd <your-repo-folder>

2. Install dependencies:

npm install

3. Create .env.local and fill in your Firebase credentials:

FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
 Make sure you escape newlines in the private key as \n.

4. Run the development server:

npm run dev
By default, the API runs on http://localhost:3000.

API Endpoints

| Method | Endpoint                   | Description                             |
| ------ | -------------------------- | --------------------------------------- |
| GET    | /api/health                | Health check                            |
| GET    | /api/products              | List all products                       |
| POST   | /api/products              | Create a new product                    |
| GET    | /api/products/:id          | Get a product by ID                     |
| PUT    | /api/products/:id          | Update a product by ID                  |
| DELETE | /api/products/:id          | Delete a product by ID                  |
| POST   | /api/products/:id/increase | Increase product stock                  |
| POST   | /api/products/:id/decrease | Decrease product stock                  |
| GET    | /api/products/low-stock    | List products below low_stock_threshold |

Running Tests : 

Manual Test Cases (copy into README.md)

Below are concise, repeatable manual test cases to verify the backend API behavior. Each test has: purpose, preconditions, steps, and expected result. Use curl, Postman, or any HTTP client.

Preconditions: server running (npm run dev) and .env.local set correctly. Base URL: http://localhost:3000.

1. Health check

Purpose: basic server health
Request

GET http://localhost:3000/api/health

Expected
HTTP 200
Body: { "ok": true, "timestamp": "<ISO string>" }

2. Create product (happy path)

Purpose: create a new product with valid fields
Request

  POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","description":"My test product","stock_quantity":10,"low_stock_threshold":5}'

Expected
HTTP 201
JSON contains id, name, stock_quantity, createdAt, updatedAt
stock_quantity === 10

3. Create product (validation failure)

Purpose: ensure validation rejects bad payloads
Request (missing name)

  POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"description":"no name","stock_quantity":5}'

Expected
HTTP 400
JSON error describing missing name

4. List products

Purpose: list existing products
Request

GET http://localhost:3000/api/products

Expected
HTTP 200
Array of product objects (including the one created earlier)

5. Get single product (existing)

Purpose: fetch a product by id
Steps: use id from create step
Request

GET http://localhost:3000/api/products/<PRODUCT_ID>

Expected
HTTP 200
JSON product with matching id

6. Get single product (not found)

Purpose: 404 for missing id
Request

GET http://localhost:3000/api/products/not-a-real-id

Expected
HTTP 404
JSON error Product not found

7. Update product (happy path)

Purpose: update name and stock_quantity
Request

  PUT http://localhost:3000/api/products/<PRODUCT_ID> \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name","stock_quantity":20}'

Expected
HTTP 200
Returned JSON shows name === "New Name" and stock_quantity === 20
updatedAt changed

8. Update product (invalid stock)

Purpose: cannot set negative stock
Request

  PUT http://localhost:3000/api/products/<PRODUCT_ID> \
  -H "Content-Type: application/json" \
  -d '{"stock_quantity": -5}'

Expected
HTTP 400
JSON error saying stock_quantity must be an integer >= 0

9. Increase stock (happy path)

Purpose: increasing stock works atomically
Request

POST http://localhost:3000/api/products/<PRODUCT_ID>/increase \
  -H "Content-Type: application/json" \
  -d '{"amount": 5}'

Expected
HTTP 200
JSON { id: ..., stock_quantity: <old + 5> }

10. Decrease stock (happy path)

Purpose: decreasing stock works and prevents negative inventory
Request

  POST http://localhost:3000/api/products/<PRODUCT_ID>/decrease \
  -H "Content-Type: application/json" \
  -d '{"amount": 3}'

Expected
HTTP 200
JSON shows decreased stock_quantity

11. Decrease stock (insufficient stock)

Purpose: cannot decrease more than available
Request

POST http://localhost:3000/api/products/<PRODUCT_ID>/decrease \
  -H "Content-Type: application/json" \
  -d '{"amount": 9999}'

Expected
HTTP 400
JSON error Insufficient stock

12. Low-stock endpoint

Purpose: returns products with stock_quantity < low_stock_threshold
Setup: ensure at least one product has stock_quantity below its low_stock_threshold
Request

GET http://localhost:3000/api/products/low-stock

Expected
HTTP 200
Array of products matching the condition

13. Delete product

Purpose: remove product by id
Request
  DELETE http://localhost:3000/api/products/<PRODUCT_ID>

Expected
HTTP 200
JSON { id: "<PRODUCT_ID>" }
Subsequent GET /api/products/<PRODUCT_ID> returns 404

14. Concurrent decrease (transaction test)

Purpose: validate atomic behavior under concurrent decrements
Steps

Create a product with stock_quantity = 5.

From two shells/clients run simultaneous decrease requests:

   POST http://localhost:3000/api/products/<ID>/decrease -H "Content-Type: application/json" -d '{"amount":4}' &
   POST http://localhost:3000/api/products/<ID>/decrease -H "Content-Type: application/json" -d '{"amount":4}' &
   wait


Expected
  One request succeeds (stock goes to 1), the other returns 400 Insufficient stock (or one succeeds then the second fails), never negative.

Assumptions & Design Choices

   1. Used Firebase Firestore as a flexible document database; collection names are dynamic.
   2. All date fields (createdAt, updatedAt) are stored as ISO strings.
   3. Validation is handled with Zod via validateBody middleware.
   4. Controller layer (productController.ts) separates route logic from service/business logic.
   5. Centralized error handling via handleError ensures consistent API responses.
   6. Logging is lightweight (logger.ts) but can be replaced with a full-featured logger if needed.
   7. Backend is fully decoupled and can easily be connected to any frontend or mobile app.

Future Improvements

  1. Add pagination and filtering for product listing.
  2. Add authentication and authorization for secure API access.
  3. Add webhooks or notifications for low-stock products.
  4. Integrate OpenAPI / Swagger for API documentation.
