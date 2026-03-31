# Gifts & Flowers API Documentation

This guide explains how to connect a frontend (like React, Vue, or an Admin Dashboard builder) to the totally rebuilt Go backend API.

## 🚀 Getting Started

**Base URL (Local):** `http://localhost:8081/api/v1`

**Authentication:** 
The API uses **JWT Bearer Tokens**. After logging in, include the token in every protected request:
```http
Authorization: Bearer <your_access_token>
Content-Type: application/json
```
*(There is also a refresh token endpoint used inside `POST /auth/refresh` to keep sessions alive).*

### Role Decoding & UI Guards
Our generated JWT Access Token contains the user's `role` (`customer`, `seller`, `admin`, `courier`) directly in the payload!
Your frontend can securely base64 decode the JWT payload on the client side to instantly know which Dashboard UI elements to render for the user.

---

## 📦 Standard Response Envelopes
To make building your frontend generic HTTP hooks easy, our responses follow a strict pattern:

**Success Responses (Usually `200 OK` or `201 Created`):**
```json
{
  "message": "Optional success message",
  "data": { ... } // Or an array []
}
```
*(Note: Paginated endpoints might include `"total": 45` at the root).*

**Error Responses (`400`, `401`, `403`, `404`, `500`):**
```json
{
  "error": "Human readable error string why it failed"
}
```
Your Axios/Fetch interceptor should catch `401 Unauthorized` errors globally, attempt to hit `/auth/refresh`, and then automatically replay the original failed request!

---

## 🔑 Authentication Endpoints

> **Note:** Base path for authentication is `/auth`.

### 1. Register a Customer
**`POST /auth/register`**
```json
// Request Body
{
  "phone": "+15551234567",
  "password": "securepassword"
}
```

### 2. Login
**`POST /auth/login`**
```json
// Request Body
{
  "phone": "+15551234567",
  "password": "securepassword"
}
// Response -> store access_token and refresh_token
```

---

## 🛍️ Public Endpoints (No Auth Required)

### Products
**`GET /products`** -> Get list of products with filters.
**`GET /products/:id`** -> Get product details.
**`GET /products/search`** -> Vector-Indexed product search.

### Occasions (Gift Builder)
**`GET /occasions`** -> View all holiday themes.
**`GET /occasions/suggestions?occasionId=xxx`** -> Get gift builder ideas.

### Promotions
**`GET /promotions/validate?code=SPRING25`** -> Check if a promo code is active before checkout.

---

## 🛡️ Protected Customer Routes (Requires Auth)

All following routes expect the `Bearer` token.
Checkout flows start at `POST /orders` expecting a verified JWT session.

```http
POST /seller/apply             // Apply to be a merchant
POST /orders                   // Place a new unified checkout order
GET /orders/:id                // View order history
POST /reviews                  // Write a product review
GET /subscriptions/plans       // View auto-buy subscriptions
POST /subscriptions            // Start a delivery subscription
GET /notifications             // Get pushed events
PUT /notifications/:id/read    // Mark seen
```

---

## 👩‍💼 Dedicated Role Routes 

Roles: `seller`, `courier`, `admin`.

### 🚚 Courier Routing
```http
PUT /courier/location 
PUT /courier/deliveries/:id/process 
```

### 👑 Admin Root Routing
All endpoints under `/admin` enforce `RequireAdmin` middleware.

```http
GET /admin/settings          // View feature flags
PUT /admin/settings          // Update config flags
GET /admin/logs              // Access compliance system metrics
GET /admin/analytics/daily   // KPI Daily Aggregation
POST /admin/promotions       // Create new coupons
```

---

## 🧪 Quick Health Verification

Verify that the system is fully operational:

```bash
curl -X GET http://localhost:8081/api/v1/health
# Expect: {"message":"Gifts API", "status":"UP"}
```
