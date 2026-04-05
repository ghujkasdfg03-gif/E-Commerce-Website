# E-Commerce Website

ElectroStore is a full-stack electronics storefront prepared for a university MERN-style submission. The repository now includes a client/server structure that matches the rubric more closely:

- `client/`: React + Vite + React Router
- `server/`: Node.js + Express REST APIs
- `MongoDB`: Mongoose models for users, carts, orders, addresses, and wishlists

The earlier Next.js code is still present in the repo as a backup/reference, but the submission-oriented path is the new MERN structure above.

## Features

- React component-based customer and admin UI
- Responsive storefront
- Signup and login with JWT authentication
- Password hashing with bcrypt
- Role-based access control
- Product listing and product details
- Cart persistence for logged-in users
- Wishlist management
- Saved addresses
- Checkout and order history
- Admin dashboard with order status updates

## Tech Stack

- Frontend: React, React Router, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Authentication: JWT, bcryptjs

## Project Structure

```text
client/
  src/
    App.tsx
    pages/
    shims/
server/
  src/
    index.ts
    routes/
app/
components/
lib/
models/
```

## Environment Variables

Create a `.env` file in the project root using `.env.example`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
ADMIN_EMAILS=your_email@example.com
CLIENT_URL=http://localhost:5173
PORT=5000
```

## Run the MERN Version Locally

Install dependencies:

```bash
npm install
```

Start frontend and backend together:

```bash
npm run dev:mern
```

This starts:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

Useful scripts:

```bash
npm run client:dev
npm run client:build
npm run server:dev
npm run server:start
npm run dev:mern
```

## API Areas

- `/api/auth`
- `/api/cart`
- `/api/addresses`
- `/api/wishlist`
- `/api/orders`
- `/api/admin`

## Submission Notes

- The MERN-oriented submission path is `client/` + `server/`
- MongoDB is used for schema design and CRUD operations
- JWT, bcrypt, and admin/customer role separation are implemented
- The legacy Next.js app remains only as a fallback while the MERN path is being finalized
