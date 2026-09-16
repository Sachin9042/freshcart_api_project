# FreshCart with REST API

This version adds a Node.js + Express REST API to the FreshCart front end. The API uses a local JSON database (`backend/db.json`) so you do not need MongoDB just to run the project.

## Requirements
- Node.js 18 or newer
- VS Code (recommended)

## Run
1. Open the `backend` folder in a terminal.
2. Run `npm install`
3. Run `npm start`
4. Open **http://localhost:5000** in your browser.

Do not open `public/index.html` directly when you want API features. Use `http://localhost:5000`.

## API endpoints
- `GET /api/health`
- `GET /api/categories`
- `GET /api/brands`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `PUT /api/me`
- `GET /api/addresses`
- `POST /api/addresses`
- `PUT /api/addresses/:id`
- `DELETE /api/addresses/:id`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `GET /api/admin/products`
- `PATCH /api/admin/products/:id/stock`

## What is connected
When the API is running, FreshCart uses the server for:
- account registration and login
- password hashing with Node's `scrypt`
- profile updates
- saved addresses
- order creation and order history
- server-side stock validation and stock deduction
- admin inventory stock updates
- product/stock synchronization

If the API is not running, the front end falls back to its browser LocalStorage demo behavior.

## Important
`backend/db.json` is a development database. For production, move users, sessions, products, inventory and orders to a real database such as MongoDB/PostgreSQL and use a production authentication/session strategy.
