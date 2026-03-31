# 🌸 Flora — Frontend Master Plan v2
> Next.js E-Commerce for Flowers & Gifts | Turkmenistan | Soft Romantic Aesthetic
> **Total Prompts: 36** | **Phases: 12** | **Use this file as the single source of truth for every AI session.**
>
> ✅ v2 — Corrected version. Fixes applied: address field names, working hours format, analytics endpoint,
> JSON.parse for suggestion fields, seller bank details gap, bank-proofs listing gap, product_snapshot rule,
> autocomplete wiring, seller time slots required, analytics seller structure, prompt count header,
> added P34 (Seller Profile page), P35 (Analytics tracking), P25 updated with personalization templates.

---

## ⚠️ HOW TO USE THIS DOCUMENT

Every AI session MUST start by reading this file completely before writing any code.
At the end of each prompt's work, the AI should note which files it created/modified so the next session knows the current state.

---

# PART 1 — PROJECT_SPEC.md

---

## 1. Project Overview

**Platform name:** Flora
**Type:** Multi-seller flower & gift e-commerce platform
**Market:** Turkmenistan (currency: TMT)
**Language:** Primarily Turkmen (`tk`), structure should support i18n later
**Unique features:** Gift Builder (occasion-based), Personalization (laser engraving, 3D print), Subscriptions, Saved Occasions

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Component Library | shadcn/ui (selectively) |
| State Management | Zustand |
| Server State / Caching | TanStack Query (React Query) |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios (with interceptors for JWT refresh) |
| Icons | Lucide React |
| Animations | Framer Motion |
| Date handling | date-fns |
| Toast notifications | react-hot-toast |

---

## 3. Design System

### 3.1 Visual Style
**Direction:** Soft & Romantic — pastel tones, floral motifs, gentle curves, elegant typography.
**Mood:** A luxurious flower boutique. Feels premium but warm. Think: fresh peonies on white linen.

### 3.2 Color Palette
```css
/* CSS Variables — define in globals.css */
--color-blush:       #F9E8EC;   /* primary background tint */
--color-rose:        #E8A0B4;   /* primary brand color */
--color-rose-dark:   #C4667E;   /* hover, active states */
--color-sage:        #B5C9B7;   /* secondary accent */
--color-cream:       #FDF6F0;   /* page background */
--color-bark:        #5C3D2E;   /* primary text */
--color-mist:        #F0EBE3;   /* card backgrounds */
--color-border:      #E8DDD5;   /* borders, dividers */
--color-success:     #6BAB8B;
--color-warning:     #E8B86D;
--color-error:       #D9534F;
--color-white:       #FFFFFF;
```

### 3.3 Typography
```css
/* Google Fonts to import */
--font-display: 'Playfair Display', serif;   /* headings, hero text */
--font-body:    'DM Sans', sans-serif;        /* body text, UI */
--font-accent:  'Dancing Script', cursive;    /* decorative labels, badges */
```

### 3.4 Spacing Scale
Use Tailwind's default scale. Key values:
- Page max-width: `1280px` (`max-w-7xl`)
- Section padding: `px-4 md:px-8 lg:px-16`
- Card padding: `p-4 md:p-6`
- Component gap: `gap-4 md:gap-6`

### 3.5 Border Radius
- Cards: `rounded-2xl`
- Buttons: `rounded-full`
- Inputs: `rounded-xl`
- Badges: `rounded-full`

### 3.6 Shadows
```css
--shadow-soft: 0 4px 24px rgba(92, 61, 46, 0.08);
--shadow-hover: 0 8px 32px rgba(92, 61, 46, 0.14);
--shadow-card: 0 2px 12px rgba(92, 61, 46, 0.06);
```

### 3.7 Button Styles
- **Primary:** `bg-rose text-white rounded-full px-6 py-3 hover:bg-rose-dark transition`
- **Secondary:** `bg-transparent border border-rose text-rose-dark rounded-full px-6 py-3`
- **Ghost:** `bg-transparent text-bark hover:bg-blush rounded-full px-4 py-2`
- **Danger:** `bg-error text-white rounded-full`

---

## 4. Folder Structure

```
/flora-frontend
├── app/
│   ├── (public)/
│   │   ├── page.tsx                        # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx                    # Product listing
│   │   │   └── [id]/page.tsx               # Product detail
│   │   ├── categories/[slug]/page.tsx
│   │   ├── gift-builder/page.tsx
│   │   ├── sellers/[slug]/page.tsx         # ✅ Public seller profile page
│   │   └── search/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-otp/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (customer)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── orders/
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── subscriptions/
│   │   ├── wishlist/page.tsx
│   │   ├── occasions/
│   │   └── settings/
│   ├── (seller)/
│   │   ├── layout.tsx
│   │   ├── seller/dashboard/
│   │   ├── seller/products/
│   │   ├── seller/orders/
│   │   ├── seller/reviews/
│   │   └── seller/settings/
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── admin/dashboard/
│   │   ├── admin/sellers/
│   │   ├── admin/orders/
│   │   ├── admin/products/
│   │   ├── admin/promotions/
│   │   ├── admin/couriers/
│   │   ├── admin/banners/
│   │   ├── admin/refunds/
│   │   ├── admin/analytics/
│   │   └── admin/settings/
│   ├── (courier)/
│   │   ├── layout.tsx
│   │   └── courier/deliveries/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileMenu.tsx
│   │   ├── CartDrawer.tsx
│   │   └── SearchOverlay.tsx               # ✅ Autocomplete search overlay
│   ├── product/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductImageGallery.tsx
│   │   ├── VariantSelector.tsx
│   │   ├── AddonSelector.tsx
│   │   └── PersonalizationForm.tsx
│   ├── gift-builder/
│   ├── cart/
│   ├── checkout/
│   ├── order/
│   ├── review/
│   ├── seller/
│   └── shared/
│       ├── PageHeader.tsx
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       ├── ErrorMessage.tsx
│       └── IssueReportModal.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── products.ts
│   │   ├── orders.ts
│   │   ├── cart.ts
│   │   ├── sellers.ts
│   │   ├── occasions.ts
│   │   ├── payments.ts
│   │   ├── subscriptions.ts
│   │   ├── reviews.ts
│   │   ├── notifications.ts
│   │   ├── analytics.ts                    # ✅ POST /analytics/track helper
│   │   ├── admin.ts
│   │   └── courier.ts
│   ├── hooks/
│   ├── store/
│   ├── types/
│   └── utils/
│       ├── format.ts
│       ├── jwt.ts
│       ├── geo.ts
│       └── jsonFields.ts                   # ✅ JSON.parse helpers for JSONB string fields
├── middleware.ts
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## 5. API Configuration

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081/api/v1';

// Standard response envelopes
interface ApiSuccess<T> { data: T; message?: string; }
interface ApiPaginated<T> { data: T[]; total: number; }
interface ApiError { error: string; }

// Some endpoints return the object directly with NO envelope:
// GET /products/:id, POST /orders, POST /seller/apply, GET /occasions, GET /occasions/suggestions,
// GET /personalization/types, GET /subscriptions/plans, GET /notifications

// Auth header: Authorization: Bearer <access_token>
// Token storage: localStorage keys: 'flora_access_token', 'flora_refresh_token'
// JWT payload: { user_id: string, role: 'customer'|'seller'|'admin'|'courier' }
// Access token TTL: 15 min | Refresh token TTL: 7 days (both rotated on refresh)
```

---

## 6. Auth & Role System

### Roles and their home routes
| Role | Home Route |
|---|---|
| `customer` | `/dashboard` |
| `seller` | `/seller/dashboard` |
| `admin` | `/admin/dashboard` |
| `courier` | `/courier/deliveries` |
| Guest | `/` |

### Important auth notes
- Registration is phone-only (`POST /auth/register` — phone + password)
- After register, user must verify OTP via `POST /auth/verify-otp`
- Login accepts phone OR email (`POST /auth/login`)
- Cancellation is via `PUT /orders/:id/status { status: "cancelled" }` — 30 min window for customers
- Working hours validation is **frontend-only** — backend does NOT check
- Delivery zone matching (point-in-polygon) is **frontend-only** — fetch all zones from admin endpoint

---

## 7. Key Business Rules for the Frontend

1. **Seller working hours** — block checkout if delivery date/time is outside seller's hours. Fetch hours from seller data embedded in product response. Times are in `"HH:MM:SS"` format (day_of_week: 0=Sun, 6=Sat).

2. **Order cancellation** — customer can only cancel within 30 minutes of placing, and only if status is `pending`. Show countdown timer. Use `PUT /orders/:id/status { status: "cancelled" }` — there is no separate cancel endpoint.

3. **Bank transfer flow** — ⚠️ `GET /seller/profile` is a seller-only route. Customers have NO API endpoint to fetch the seller's bank details. Workaround: embed bank details in the order confirmation page using the seller data already fetched during checkout (store it in the order creation response or fetch seller profile before placing the order using `GET /sellers/:id` public endpoint). Show: `bank_name`, `account_number`, `account_holder_name`. After showing details, prompt user to upload receipt image URL via `POST /payments/:paymentId/proof { image_url }`.

4. **Cart quantity update** — `PUT /cart/items` exists after the P4 fix. Use it. If the backend has not yet deployed the fix, fall back to `DELETE /cart/items` then `POST /cart/items`.

5. **Address edit** — `PUT /addresses/:id` exists after the P4 fix. ⚠️ The P4 fix spec uses different field names than the original schema. Use the **original schema field names**: `label`, `city`, `district`, `street`, `building`, `apartment`, `lat`, `lng`, `is_default`. Do NOT use `address_line_1`, `address_line_2`, `state`, `country`, `instructions` — those appear to be a bug in the fix spec. If the edit endpoint fails, fall back to delete + re-create and show a note.

6. **Product price** = `base_price + variant.price_modifier + sum(selected addons prices)`

7. **Inventory** — show "Low stock" badge when `quantity_total - quantity_reserved <= low_stock_threshold (5)`

8. **Gift builder sessions** — fully client-side (no backend session API routes are registered). Use `GET /occasions` and `GET /occasions/suggestions?occasionId=X` for data. Manage state in Zustand/localStorage.

9. **⚠️ JSONB string fields require JSON.parse()** — the following fields come back from the API as raw JSON strings, NOT parsed arrays. Always run `JSON.parse()` before using them:
   - `occasion_suggestion.product_ids` → `string` → parse to `string[]`
   - `occasion_suggestion.addon_ids` → `string` → parse to `string[]`
   - `personalization_type.available_materials` → `string` → parse to `string[]`
   - `personalization_type.available_colors` → `string` → parse to `string[]`
   - `review.images` → `string` → parse to `string[]`
   - `order_item.addons` → `string` → parse to addon object array
   Example: `const productIds: string[] = JSON.parse(suggestion.product_ids || '[]')`

10. **Order history must use `product_snapshot`** — `order_items` contains a `product_snapshot` JSONB field storing the full product data at the time of purchase. When displaying order history or order detail pages, always read product name, price, and image from `item.product_snapshot`, NOT from a live product fetch. This ensures accuracy if the product was later edited or deleted.

11. **Promo code** — applied at cart stage (`POST /cart/promo`). Must also pass `promotion_id` in order body.

12. **Notifications** — no WebSocket. Poll `GET /notifications` every 30 seconds when user is logged in. Response is an array directly (no envelope), hard-coded limit of 50.

13. **Payment currency** — always TMT. Format as `150.00 TMT`.

14. **Delivery zones** — no geo-lookup API. Fetch all zones from `GET /admin/delivery/zones`, do point-in-polygon in the browser using the `polygon` GeoJSON field (see `lib/utils/geo.ts`).

15. **No file upload API** — all image/document URLs must be pre-uploaded to S3 externally. For now, accept URL input fields everywhere an image is needed.

16. **Analytics event tracking** — call `POST /analytics/track` at key user journey moments (see lib/api/analytics.ts). Events to track: `product_view`, `search_performed`, `gift_builder_started`, `gift_builder_completed`, `gift_builder_converted_to_order`, `order_placed`, `coupon_applied`.

17. **`GET /admin/bank-proofs`** — ⚠️ This listing endpoint may not have been implemented in the P4 fix (only the approve/reject actions were confirmed). If it returns 404, fall back to filtering from `GET /admin/orders?payment_method=bank_transfer&payment_status=pending` and show bank proof details inline in the order detail. Flag this in the UI.

---

## 8. All API Endpoints Reference

### Public (No Auth)
```
GET    /health
POST   /auth/register                    { phone, password }
POST   /auth/login                       { phone|email, password } → { access_token, refresh_token }
POST   /auth/refresh                     { refresh_token } → new pair (both tokens rotated)
POST   /auth/send-otp                    { phone }
POST   /auth/verify-otp                  { phone, code }
POST   /auth/request-password-reset      { email }
POST   /auth/confirm-password-reset      { token, new_password }
GET    /products                         ?q, category_id, seller_id, status, limit(20), offset(0)
GET    /products/:id                     Full product — NO envelope, direct object
GET    /products/search                  ?q, limit, offset — tsvector, status=active forced
GET    /products/featured                (P4 fix) ?limit(10)
GET    /products/autocomplete            (P4 fix) ?q (min 2 chars), limit(10)
GET    /categories                       Nested tree with children[] preloaded
GET    /occasions                        Array directly — NO envelope
GET    /occasions/suggestions            ?occasionId=uuid — array directly — ⚠️ product_ids/addon_ids are JSON strings, parse them
GET    /promotions/validate              ?code=SPRING25 — returns Promotion object directly
GET    /banners                          (P4 fix) ?position=home_top|home_mid|category_page
GET    /settings                         (P4 fix) Public non-sensitive settings
GET    /sellers/:id                      (P4 fix) Public seller profile — supports UUID or slug
GET    /products/:id/reviews             (P4 fix) ?limit(50), offset(0)
```

### Protected — Any Authenticated User
```
POST   /auth/logout                      { refresh_token }
GET    /profile                          → { data: { user + profile + addresses } }
PUT    /profile                          { full_name, avatar_url, date_of_birth, preferred_language }
GET    /addresses                        → { data: Address[] }
POST   /addresses                        { label, city, district, street, building, apartment, lat, lng, is_default }
PUT    /addresses/:id/default            (no body)
DELETE /addresses/:id
PUT    /addresses/:id                    (P4 fix) ⚠️ Use original schema fields: { label, city, district, street, building, apartment, lat, lng, is_default }
GET    /cart                             → { data: { id, items: [{ product_id, variant_id, quantity, product }] } }
POST   /cart/items                       { product_id, variant_id, quantity }
DELETE /cart/items                       { product_id, variant_id }
PUT    /cart/items                       (P4 fix) { product_id, variant_id, quantity } — quantity=0 removes item
POST   /cart/promo                       { code }
DELETE /cart/promo
POST   /orders                           Full order body (see checkout spec)
GET    /orders                           ?limit(20), offset(0) → { data, total }
GET    /orders/:id                       Full order + items + messages + status_history + address + slot + promotion
PUT    /orders/:id/status                { status, note } — customer: "cancelled" only (30 min window, pending only)
GET    /delivery/slots                   ?seller_id=uuid&date=YYYY-MM-DD → array directly
POST   /reviews                          { order_id, seller_id, product_id, rating(1-5), comment, images(JSON string) }
PUT    /reviews/:id/respond              { response } — seller responds to review (one response per review max)
PUT    /reviews/:id                      (P4 fix) { rating, comment, images }
DELETE /reviews/:id                      (P4 fix) — soft delete (is_visible=false)
GET    /notifications                    Array directly, hard limit 50
PUT    /notifications/:id/read           Pass literal string "all" as :id to mark all read
GET    /notifications/preferences        (P4 fix) → { data: { sms_enabled, email_enabled, push_enabled, marketing_enabled } }
PUT    /notifications/preferences        (P4 fix) { sms_enabled, email_enabled, push_enabled, marketing_enabled }
GET    /personalization/types            ?active_only=true → array directly — ⚠️ available_materials/colors are JSON strings
POST   /personalization/types            Create new type (admin intended, no role check)
GET    /personalization/types/:typeId/templates  ?active_only=true
GET    /personalization/jobs/:id         (no role check — any auth user)
PUT    /personalization/jobs/:id/status  { status: "pending"|"in_production"|"completed"|"failed" }
GET    /subscriptions/plans              Array directly
POST   /subscriptions                    { seller_id, plan_id, delivery_address_id, next_delivery_date }
PUT    /subscriptions/:id/pause
GET    /subscriptions                    (P3 fix) ?status, limit(50), offset(0)
PUT    /subscriptions/:id/cancel         (P3 fix)
PUT    /subscriptions/:id/resume         (P4 fix)
GET    /wishlist
POST   /wishlist                         { product_id }
DELETE /wishlist                         { product_id }
GET    /wishlist/check/:product_id
POST   /saved-occasions                  (P3 fix) { occasion_id, title, date, recipient_name, reminders }
GET    /saved-occasions                  (P3 fix)
POST   /payments/:paymentId/proof        { image_url }
POST   /payments/:paymentId/refund       { reason, amount }
GET    /payments/:paymentId              (P4 fix)
POST   /issue-reports                    (P4 fix) { review_id?, order_id?, issue_type, description }
POST   /analytics/track                  { event_type, data } — ✅ call at key journey points
POST   /gift-builder/sessions            (P3 fix) { occasion_id, recipient_name, budget }
GET    /gift-builder/sessions/:id        (P3 fix)
PUT    /gift-builder/sessions/:id/step   (P3 fix) { step, data }
PUT    /gift-builder/sessions/:id/complete (P3 fix)
```

### Seller Routes (role: seller)
```
POST   /seller/apply                     { shop_name, description }
GET    /seller/profile                   → { data: { seller + documents + bank_details + working_hours + stats } }
PUT    /seller/profile                   { shop_name, description, logo_url, cover_url }
POST   /seller/documents                 { type: "id_card"|"business_license"|"tax_certificate", file_url }
PUT    /seller/bank-details              { bank_name, account_number, account_holder_name }
PUT    /seller/working-hours             Array of 7: [{ day_of_week(0-6), open_time("HH:MM:SS"), close_time("HH:MM:SS"), is_closed }]
                                         ⚠️ Times MUST be in "HH:MM:SS" format. 0=Sunday, 6=Saturday.
PUT    /seller/delivery-zones            { zone_ids: string[] }
POST   /seller/delivery/time-slots       { slot_date, start_time, end_time, max_orders, price_modifier }
                                         ✅ REQUIRED feature — sellers MUST create time slots to be bookable
GET    /seller/products                  ?limit, offset
POST   /seller/products                  (returns created product directly, no envelope)
PUT    /seller/products/:id
DELETE /seller/products/:id              (soft delete)
POST   /seller/products/:id/variants     { name, price_modifier, sku, is_active }
POST   /seller/products/:id/addons       { name, description, price, addon_type, max_quantity, is_active }
PUT    /seller/products/:id/inventory    { variant_id(nullable), total, reserved }
GET    /seller/products/low-stock
GET    /seller/orders                    ?status, limit(20), offset(0)
GET    /seller/reviews                   → { data, total }
```

### Admin Routes (role: admin)
```
GET    /admin/settings
PUT    /admin/settings                   { key, value }
GET    /admin/logs                       (limit 50)
GET    /admin/sellers                    ?status, limit(50), offset(0)
PUT    /admin/sellers/:id/approve
PUT    /admin/sellers/:id/reject         { reason }
PUT    /admin/sellers/:id/suspend        { reason }
GET    /admin/orders                     ?status, limit(50), offset(0)
GET    /admin/promotions
POST   /admin/promotions
GET    /admin/categories
POST   /admin/categories                 { name, slug, parent_id, icon_url, is_active, sort_order }
GET    /admin/couriers
POST   /admin/couriers                   { user_id, full_name, phone, vehicle_type }
PUT    /admin/deliveries/:id/assign      { courier_id }
GET    /admin/refunds                    ?status=pending
PUT    /admin/payments/refunds/:refundId/process  { approve: bool }
GET    /admin/analytics/daily            ?date=YYYY-MM-DD → single day KPIs for ALL sellers
GET    /admin/analytics/seller           ?date=YYYY-MM-DD → array of ALL sellers' stats for that date
                                         ⚠️ NO seller_id filter — returns all sellers for the date
GET    /admin/delivery/zones
POST   /admin/delivery/zones             { name, city, polygon(GeoJSON), base_delivery_fee, estimated_minutes }
POST   /admin/personalization/templates  ✅ Create personalization template — { type_id, name, preview_image_url, description, example_text, is_active, sort_order }
GET    /admin/banners                    (P4 fix)
POST   /admin/banners                    (P4 fix) { title, image_url, link_url, position, is_active, sort_order, starts_at, ends_at }
PUT    /admin/banners/:id                (P4 fix)
DELETE /admin/banners/:id                (P4 fix)
PUT    /admin/products/:id/featured      (P4 fix) { is_featured }
GET    /admin/bank-proofs                (P4 fix) ⚠️ MAY NOT EXIST — see Business Rule #17 for fallback
PUT    /admin/payments/:id/approve-proof (P4 fix)
PUT    /admin/payments/:id/reject-proof  (P4 fix) { reason }
GET    /admin/issue-reports              (P4 fix) ?status
PUT    /admin/issue-reports/:id/status   (P4 fix) { status }
POST   /admin/occasions                  (P3 fix) { name, description, slug, icon_url }
POST   /admin/subscriptions/:id/deliveries (P3 fix) { dates: string[] }
```

### Courier Routes (role: courier)
```
GET    /courier/deliveries               ?status
PUT    /courier/location                 { latitude, longitude }
PUT    /courier/deliveries/:deliveryId/process  { status: "picked_up"|"en_route"|"delivered"|"failed" }
```

---

## 9. State Management Rules

- **Auth state** (tokens, user, role): Zustand `authStore` + localStorage persistence
- **Cart state**: TanStack Query for server state + Zustand for optimistic UI
- **UI state** (modals, drawers, loading): Zustand `uiStore`
- **Server data** (products, orders, etc.): TanStack Query only
- **Gift builder session**: Zustand + localStorage (fully client-side, expires 24h)
- **Search/autocomplete state**: local component state only

---

## 10. Naming Conventions

- Components: PascalCase (`ProductCard.tsx`)
- Hooks: camelCase with `use` prefix (`useCart.ts`)
- API functions: camelCase (`getProducts`, `createOrder`)
- Types: PascalCase with suffix (`ProductType`, `OrderStatus`)
- CSS classes: Tailwind only — no custom CSS except globals.css
- Route params: kebab-case in URLs, camelCase in code

---

# PART 2 — ALL PROMPTS

---

## 📐 PHASE 0 — Project Scaffold & Foundations

---

### PROMPT P00 — Project Initialization

```
You are building the Flora frontend — a soft romantic flower & gift e-commerce platform for Turkmenistan.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully before starting.

Your task: Initialize the Next.js project and install all dependencies.

1. Create project:
   npx create-next-app@latest flora-frontend --typescript --tailwind --app --src-dir=false --import-alias="@/*"

2. Install dependencies:
   npm install axios zustand @tanstack/react-query react-hook-form @hookform/resolvers zod framer-motion date-fns react-hot-toast lucide-react clsx tailwind-merge

3. Install shadcn/ui:
   npx shadcn@latest init
   npx shadcn@latest add button input badge card dialog sheet skeleton toast separator

4. Create the full folder structure from PROJECT_SPEC section 4.
   Create placeholder files (just a comment) for each file listed.

5. Update next.config.js:
   - Allow image remote patterns for localhost and wildcard S3/Cloudflare domains

6. Create middleware.ts:
   - Protect all /dashboard, /seller, /admin, /courier routes
   - Redirect unauthenticated users to /login
   - Redirect authenticated users away from /login, /register to their role's home
   - Read role from JWT. Store tokens in both localStorage and httpOnly cookies for SSR compatibility.

7. Create .env.local.example:
   NEXT_PUBLIC_API_URL=http://localhost:8081/api/v1

Deliverable: Clean running Next.js project. All folders and placeholder files created. Middleware in place.
Do NOT write any page UI yet.
```

---

### PROMPT P01 — Design System & Tailwind Config

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (PROJECT_SPEC section 3 — Design System) fully before starting.
Previous: P00 complete.

1. Update tailwind.config.js:
   - Extend colors with all CSS variables: blush, rose, rose-dark, sage, cream, bark, mist, border (as 'border-color')
   - Add font families: display (Playfair Display), body (DM Sans), accent (Dancing Script)
   - Add custom shadows: shadow-soft, shadow-hover, shadow-card

2. Update app/globals.css:
   - Import Google Fonts: Playfair Display (400,600,700), DM Sans (400,500,600), Dancing Script (600)
   - Define all CSS custom properties
   - Set body defaults: background cream, color bark, font-family body
   - Add thin scrollbar styling (rose-tinted)
   - Add .bg-floral-texture utility (subtle CSS radial-gradient pattern)

3. Create components/ui/button.tsx — extend shadcn with Flora variants: primary, secondary, ghost, danger

4. Create components/ui/input.tsx — extend shadcn with Flora styling (rounded-xl, border-color, focus:border-rose)

5. Create lib/utils/format.ts:
   - formatPrice(amount: number): string → "150.00 TMT"
   - formatDate(date: string): string → "March 22, 2026"
   - formatRelativeTime(date: string): string → "2 hours ago"

6. Create lib/utils/jsonFields.ts:
   ⚠️ CRITICAL — several API fields return JSON strings that must be parsed.
   Create safe parse helpers:
   - parseJsonArray<T>(value: string | T[]): T[] — returns [] on error
   Use this for: suggestion.product_ids, suggestion.addon_ids,
   personalization_type.available_materials, personalization_type.available_colors,
   review.images, order_item.addons

7. Create app/design-system/page.tsx — visual preview of all colors, typography, buttons, inputs.

Deliverable: Full design system configured. jsonFields.ts helper created and documented.
```

---

### PROMPT P02 — API Client & Auth Utilities

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (sections 5, 6, 7, 9) fully before starting.
Previous: P00, P01 complete.

1. Create lib/api/client.ts:
   - Axios instance with baseURL from NEXT_PUBLIC_API_URL
   - Request interceptor: attach Authorization: Bearer <token>
   - Response interceptor: on 401 → attempt POST /auth/refresh
     - Success: store new tokens, retry original request
     - Failure: clear tokens, redirect to /login
   - Error transformer: extract error.response.data.error string

2. Create lib/types/api.ts:
   - ApiSuccess<T>, ApiPaginated<T>, ApiError
   - All enums: OrderStatus, PaymentMethod, PaymentStatus, UserRole, SellerStatus,
     DeliveryStatus, NotificationChannel, AddonType, PersonalizationStatus,
     SubscriptionStatus, SubscriptionFrequency, IssueReportStatus, VehicleType

3. Create lib/types/ — full TypeScript interfaces:
   - auth.ts: User, UserProfile, Address, Session
   - product.ts: Product, ProductVariant, ProductAddon, ProductImage, Category, Inventory
   - order.ts: Order, OrderItem, OrderMessage, OrderStatusHistory
   - seller.ts: Seller, SellerDocument, SellerBankDetails, SellerWorkingHours, SellerDeliveryZone, SellerStats
   - cart.ts: Cart, CartItem
   - occasion.ts: Occasion, OccasionSuggestion (with product_ids as string — parse with jsonFields.ts), SavedOccasion
   - personalization.ts: PersonalizationType (available_materials as string), PersonalizationTemplate, PersonalizationJob
   - payment.ts: Payment, Refund, BankTransferProof
   - notification.ts: Notification, NotificationPreference
   - subscription.ts: SubscriptionPlan, Subscription, SubscriptionDelivery
   - review.ts: Review, ReviewResponse, SellerRatings
   - courier.ts: Courier, Delivery
   - analytics.ts: AnalyticsEvent, DailyStats

4. Create lib/store/authStore.ts (Zustand):
   - State: user, accessToken, refreshToken, isAuthenticated, role
   - Actions: setTokens, setUser, logout, initialize
   - Persist to localStorage

5. Create lib/utils/jwt.ts:
   - decodeToken(token): { user_id, role, exp }
   - isTokenExpired(token): boolean

6. Create lib/api/auth.ts — all auth API functions.

7. Create lib/api/analytics.ts:
   - trackEvent(eventType: string, data?: object): Promise<void>
   - Silently catches errors (never block user flow for analytics)
   - Events: product_view, search_performed, gift_builder_started,
     gift_builder_completed, gift_builder_converted_to_order, order_placed, coupon_applied

8. Create lib/hooks/useAuth.ts — wraps authStore, provides isCustomer, isSeller, isAdmin, isCourier.

9. Create app/providers.tsx:
   - Wrap with QueryClientProvider, Toaster
   - Initialize auth store on mount
   - Poll GET /notifications every 30 seconds if authenticated (store unread count in uiStore)

10. Update app/layout.tsx to wrap with Providers.

Deliverable: Working API client, full TypeScript types, auth store, analytics helper.
```

---

## 🧱 PHASE 1 — Layout Shell

---

### PROMPT P03 — Navbar, Search Overlay & Cart Drawer

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully. Focus on section 3 (Design System) and section 8 (autocomplete endpoint).
Previous: P00–P02 complete.

Files:
- components/layout/Navbar.tsx
- components/layout/SearchOverlay.tsx   ← NEW — search with autocomplete
- components/layout/CartDrawer.tsx

1. Navbar:
   - Sticky, backdrop-blur, bg-white/80
   - Logo: "Flora" in Playfair Display + small rose SVG
   - Nav links: Home, Products, Gift Builder, Occasions
   - Right side icons: Search, Wishlist (count badge), Notifications bell (unread count), Cart (count badge)
   - Auth: if logged out → Login (ghost) + Register (primary). If logged in → avatar dropdown by role.
   - Mobile: hamburger → full-screen slide-in menu (framer-motion)

2. SearchOverlay (opens when search icon clicked):
   - Full-screen overlay with dark backdrop
   - Centered search input (large, autofocused)
   - Calls GET /products/autocomplete?q= after 300ms debounce (min 2 chars)
   - Shows up to 8 autocomplete results: product image, name, price
   - On result click: navigate to /products/:id, close overlay, track search_performed event
   - On Enter: navigate to /search?q=... for full results
   - Call POST /analytics/track { event_type: "search_performed", data: { query } } on submit
   - ESC key closes overlay
   - framer-motion: fade in/out

3. CartDrawer:
   - Right slide-in sheet (framer-motion)
   - Cart items from GET /cart
   - Each item: image, name, variant, quantity controls, price, remove button
   - Quantity change: use PUT /cart/items if available, else DELETE + POST
   - Subtotal + "View Cart" + "Checkout" buttons
   - Empty state with link to /products

Deliverable: Navbar + SearchOverlay + CartDrawer. Autocomplete wired to GET /products/autocomplete.
```

---

### PROMPT P04 — Footer & All Layout Shells

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully.
Previous: P00–P03 complete.

1. components/layout/Footer.tsx:
   - 4-column grid → 2-col tablet → 1-col mobile
   - Columns: Brand (logo + tagline + socials), Shop, Help, Legal
   - cream background, bark text, rose accent links
   - Subtle floral CSS pattern in background

2. app/(public)/layout.tsx — Navbar + Footer + PageTransition (framer-motion fade)

3. app/(customer)/layout.tsx:
   - Desktop: left sidebar with avatar, name, nav links (Orders, Wishlist, Subscriptions, Occasions, Settings)
   - Mobile: bottom tab bar (5 tabs)

4. app/(seller)/layout.tsx:
   - Sidebar: Dashboard, Products, Orders, Reviews, Settings
   - Show seller approval status badge

5. app/(admin)/layout.tsx:
   - Dark sidebar (bark-colored) with rose accents
   - Links: Dashboard, Sellers, Orders, Products, Promotions, Couriers, Banners, Refunds, Analytics, Settings

6. app/(courier)/layout.tsx:
   - Simple mobile-first layout
   - Header: courier name + location toggle

7. app/(auth)/layout.tsx:
   - Split screen: left floral illustration, right form
   - Mobile: form only

Deliverable: All layout shells complete. Navigation between all sections works.
```

---

## 🏠 PHASE 2 — Homepage

---

### PROMPT P05 — Homepage: Hero & Banners

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully.
Previous: P00–P04 complete.

Files:
- app/(public)/page.tsx (start)
- components/home/HeroBanner.tsx
- components/home/BannerCarousel.tsx

API: GET /banners?position=home_top, GET /settings

1. HeroBanner:
   - Full-width, soft rose/cream gradient background
   - Headline: "Send Love, One Bloom at a Time" — Playfair Display, large
   - Subheading tagline, two CTAs: "Shop Flowers" + "Build a Gift"
   - Floating badge: "Same-day delivery in Ashgabat"
   - framer-motion: staggered text reveal on load

2. BannerCarousel:
   - Fetches GET /banners?position=home_top
   - Auto-advancing (4s), smooth framer-motion slide, dot indicators + arrows
   - Fallback to HeroBanner if no banners
   - Each banner links to link_url

Deliverable: Above-the-fold hero experience. Fully responsive.
```

---

### PROMPT P06 — Homepage: Occasions & Featured Products

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully (business rule #9 — JSON.parse).
Previous: P00–P05 complete.

Files:
- components/home/OccasionsGrid.tsx
- components/home/FeaturedProducts.tsx
- components/product/ProductCard.tsx    ← PRIMARY reusable component, used everywhere

API: GET /occasions, GET /products/featured

1. OccasionsGrid:
   - "Shop by Occasion" section
   - 4 cols desktop / 2 cols mobile
   - Cards: icon_url + name + description, hover scale + shadow
   - Click → /gift-builder?occasion=slug
   - framer-motion: staggered scroll entrance

2. ProductCard (global component — must be pixel-perfect, used on every product surface):
   - Primary image from product.images[] (is_primary: true, fallback to index 0)
   - compare_price strikethrough if present
   - base_price formatted as TMT
   - Title (2-line clamp)
   - Seller name
   - "Low Stock" badge if quantity_total - quantity_reserved <= 5
   - "Featured" badge if is_featured
   - Wishlist heart toggle (top-right)
   - "Add to Cart" button (hover-reveal)
   - Links to /products/:id
   - Call POST /analytics/track { event_type: "product_view" } when card is clicked

3. FeaturedProducts:
   - "Our Favourites" section
   - GET /products/featured (up to 8 products)
   - Horizontal scroll on mobile, grid on desktop
   - Skeleton loading (4 cards)
   - "View All" → /products

Deliverable: Occasions grid + FeaturedProducts. ProductCard is complete and reusable.
```

---

### PROMPT P07 — Homepage: Remaining Sections

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully.
Previous: P00–P06 complete. ProductCard exists.

Add to app/(public)/page.tsx:

1. How It Works — 3-step process with icons + connecting line decoration

2. Mid-page Banner — GET /banners?position=home_mid — fallback to seasonal section

3. Subscriptions teaser — GET /subscriptions/plans — 3 plan cards, CTA to /subscriptions

4. Personalization teaser — GET /personalization/types — laser/3D print cards
   ⚠️ Parse available_materials and available_colors with parseJsonArray() from lib/utils/jsonFields.ts

5. Static testimonials section — 3 hard-coded cards, carousel on mobile

6. SEO metadata export:
   export const metadata = { title: 'Flora — Fresh Flowers & Gifts in Turkmenistan', description: '...' }

Deliverable: Complete polished homepage. All sections connected.
```

---

## 🛍️ PHASE 3 — Product Pages

---

### PROMPT P08 — Product Listing & Search Page

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully.
Previous: P00–P07 complete. ProductCard exists.

Files:
- app/(public)/products/page.tsx
- app/(public)/search/page.tsx
- components/product/ProductGrid.tsx
- components/product/ProductFilters.tsx

API: GET /products, GET /products/search, GET /categories

NOTE: price_min, price_max, occasion, sort are NOT API params — handle client-side.

1. ProductGrid — responsive grid with loading skeletons and empty state

2. ProductFilters:
   - Category tree (collapsible, from GET /categories)
   - Price range slider (client-side)
   - Sort: Price Low/High, Newest, Most Popular (client-side)
   - Active filter chips + "Clear all"
   - Desktop: sidebar. Mobile: bottom sheet.

3. Products page:
   - URL params: ?q=, ?category=, ?sort=
   - When q present: use GET /products/search, else GET /products
   - Product count display
   - Breadcrumb
   - Track POST /analytics/track { event_type: "search_performed" } when search submitted

4. Search page (/search?q=):
   - Same layout as products page but search-focused
   - "Results for: roses" heading

Deliverable: Product listing + search pages with filters and analytics tracking.
```

---

### PROMPT P09 — Product Detail Page

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully (business rules #6, #9 JSON.parse).
Previous: P00–P08 complete.

Files:
- app/(public)/products/[id]/page.tsx
- components/product/ProductImageGallery.tsx
- components/product/VariantSelector.tsx
- components/product/AddonSelector.tsx
- components/product/PersonalizationForm.tsx

API: GET /products/:id (direct object, no envelope), GET /products/:id/reviews (P4 fix),
     GET /personalization/types, POST /cart/items

1. On page load: call POST /analytics/track { event_type: "product_view", data: { product_id } }

2. ProductImageGallery: main + thumbnails, zoom on hover, framer-motion fade

3. Product info:
   - Title (Playfair Display), seller name + rating (link to /sellers/:slug)
   - Price = base_price + selected variant.price_modifier + sum of selected addon prices
   - compare_price strikethrough, stock badge, shelf_life_hours info

4. VariantSelector: pills, updates price display, disabled if out of stock

5. AddonSelector:
   - Checkbox cards grouped by addon_type
   - Updates running price total

6. PersonalizationForm (if personalization addon selected):
   - Select type from GET /personalization/types
   - ⚠️ Parse available_materials and available_colors with parseJsonArray() before rendering selects
   - Material, color dropdowns, text input (max_text_length), template picker
   - File URL input (no upload API — user pastes S3 URL)

7. Greeting card: optional message text (max 200 chars) + font style selector

8. Quantity selector + Add to Cart (sticky on mobile)

9. Working hours note: parse product.seller.working_hours (times are "HH:MM:SS" format),
   display human-readable: "Seller delivers Mon–Fri 9:00–18:00"

10. Reviews section: GET /products/:id/reviews — rating summary + review cards + pagination

11. Related products: GET /products?category_id=&limit=4

Deliverable: Complete product detail. Price calculation exact. JSON fields parsed correctly.
```

---

## 🎁 PHASE 4 — Gift Builder

---

### PROMPT P10 — Gift Builder Page

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully (business rule #8: gift builder is client-side,
business rule #9: JSON.parse product_ids and addon_ids from suggestions).
Previous: P00–P09 complete.

Files:
- app/(public)/gift-builder/page.tsx
- components/gift-builder/OccasionPicker.tsx
- components/gift-builder/BudgetSlider.tsx
- components/gift-builder/SuggestionCard.tsx
- lib/store/giftBuilderStore.ts

API: GET /occasions, GET /occasions/suggestions?occasionId=, POST /cart/items

IMPORTANT: No backend session API routes exist. All state is client-side.

1. lib/store/giftBuilderStore.ts (Zustand + localStorage, expires 24h):
   State: selectedOccasion, budget, selectedSuggestion, recipientName, personalMessage,
   selectedProductIds, selectedAddonIds
   Actions: setOccasion, setBudget, selectSuggestion, reset

2. Multi-step page (slide transitions, framer-motion):

   Step 1 — Pick Occasion:
   - Occasion cards from GET /occasions
   - Call POST /analytics/track { event_type: "gift_builder_started" } on first step entry

   Step 2 — Budget:
   - Slider 50–2000 TMT
   - 4 quick-select chips: Budget, Standard, Premium, Luxury

   Step 3 — Choose Package:
   - GET /occasions/suggestions?occasionId=selected_id
   - ⚠️ Parse product_ids and addon_ids: JSON.parse(suggestion.product_ids || '[]')
   - Filter suggestions by: min_budget <= budget <= max_budget
   - SuggestionCard: preview image, title, budget range, personalization badge

   Step 4 — Personalize:
   - Recipient name input
   - Greeting message (pre-filled from suggestion.suggested_message)
   - PersonalizationForm if suggestion has personalization_type_id

   Step 5 — Add to Cart:
   - Summary of selection + total price
   - "Add to Cart" → POST /cart/items for each product_id in parsed product_ids array
   - On success: POST /analytics/track { event_type: "gift_builder_converted_to_order" }
   - Redirect to /cart

Deliverable: Full client-side gift builder. JSON parsing correct. Analytics tracked.
```

---

## 🔐 PHASE 5 — Authentication

---

### PROMPT P11 — Auth Pages

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (section 6 — Auth) fully.
Previous: P00–P10 complete.

Files:
- app/(auth)/login/page.tsx
- app/(auth)/register/page.tsx
- app/(auth)/verify-otp/page.tsx
- app/(auth)/reset-password/page.tsx

API: auth endpoints as listed in section 8.

1. Register: phone (+993... format) + password. POST /auth/register → redirect to /verify-otp?phone=...

2. OTP page: 6 individual digit inputs (auto-advance), 5-min countdown timer, resend button.
   POST /auth/verify-otp → redirect to /login with success toast.

3. Login: phone/email toggle + password. POST /auth/login → decode JWT role → redirect to role home.
   Rate limit error: "Too many attempts. Try again in 15 minutes."

4. Reset password: Step 1 (email) → POST /auth/request-password-reset
   Step 2 (?token=): new password → POST /auth/confirm-password-reset → redirect to login.

Validation (React Hook Form + Zod):
- Phone: starts with +993, 12 digits total
- Password: min 8 chars
- OTP: exactly 6 digits

Deliverable: All auth flows complete. Tokens stored. Role-based redirect.
```

---

## 🛒 PHASE 6 — Cart & Checkout

---

### PROMPT P12 — Cart Page

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (business rules #4, #9, #11) fully.
Previous: P00–P11 complete.

Files:
- app/(customer)/cart/page.tsx
- components/cart/CartItem.tsx
- components/cart/CartSummary.tsx

API: GET /cart, DELETE /cart/items, PUT /cart/items (P4 fix, fallback to DELETE+POST),
     POST /cart/promo, DELETE /cart/promo, GET /promotions/validate

1. CartItem:
   - Product image + name + variant (from product data in cart item)
   - Quantity controls with debounced update (PUT /cart/items or DELETE+POST fallback)
   - Remove button
   - Line total

2. CartSummary:
   - Subtotal, delivery fee (TBD at checkout), discount, total
   - Promo code input:
     - GET /promotions/validate?code= for preview before applying
     - POST /cart/promo to apply
     - DELETE /cart/promo to remove
     - On apply: call POST /analytics/track { event_type: "coupon_applied" }
   - "Proceed to Checkout" button
   - "Continue Shopping" link

3. Empty cart state with illustration + "Shop Now" button

Deliverable: Cart page with quantity management, promo code, totals.
```

---

### PROMPT P13 — Checkout Flow

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully — especially business rules #1 (working hours in HH:MM:SS),
#3 (bank transfer — seller bank details via GET /sellers/:id), #14 (delivery zones client-side).
Previous: P00–P12 complete.

Files:
- app/(customer)/checkout/page.tsx
- components/checkout/AddressStep.tsx
- components/checkout/DeliverySlotStep.tsx
- components/checkout/PaymentStep.tsx
- components/checkout/OrderReviewStep.tsx

API: GET /addresses, POST /addresses, GET /delivery/slots, GET /admin/delivery/zones,
     GET /sellers/:id (fetch seller bank details for bank transfer), POST /orders

Step 1 — Delivery Address:
- Saved address cards + "Add new" inline form
- Fields: label, city, district, street, building, apartment, lat, lng
- Zone check: fetch GET /admin/delivery/zones, run point-in-polygon (lib/utils/geo.ts)
  Show warning if address is outside all zones

Step 2 — Delivery Date & Time:
- Date picker (future dates only)
- Working hours guard:
  ⚠️ Times from API are "HH:MM:SS" format. Parse with: time.split(':').slice(0,2).join(':')
  Disable dates on seller's closed days. Show "Seller open Mon–Fri 9:00–18:00"
- Slot grid: GET /delivery/slots?seller_id=&date=
  Disabled if booked_orders >= max_orders or is_blocked
  Express slots: show "+X TMT" badge
- Special instructions textarea, greeting card field

Step 3 — Payment:
- Cash on Delivery: select card
- Bank Transfer: select card → show instructions panel
  ⚠️ Fetch seller bank details via GET /sellers/:id (the public seller profile endpoint)
  Show: bank_name, account_number, account_holder_name, amount to transfer
  Note: "Complete the transfer within 24 hours to confirm your order"

Step 4 — Review & Place:
- Full summary
- POST /orders with correct body (see section 8 order body)
- On success: POST /analytics/track { event_type: "order_placed" } → redirect to /orders/:id?new=true
- On ErrInventoryShortage: highlight which item is out of stock

Deliverable: Multi-step checkout. Working hours and zone guards active. Seller bank details shown via public API.
```

---

### PROMPT P14 — Order Confirmation & Order Detail

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (business rule #10 — use product_snapshot, not live product data).
Previous: P00–P13 complete.

Files:
- app/(customer)/orders/[id]/page.tsx
- components/order/OrderTimeline.tsx
- components/order/OrderStatusBadge.tsx

API: GET /orders/:id, PUT /orders/:id/status, POST /payments/:paymentId/proof,
     GET /payments/:paymentId (P4 fix), POST /payments/:paymentId/refund

1. ?new=true state: confetti animation, "Order Placed!" heading, order number.
   If bank_transfer: show bank details again + proof upload form
   → POST /payments/:paymentId/proof { image_url }

2. Order detail:
   OrderStatusBadge: color-coded per status
   OrderTimeline: vertical status_history entries (from, to, who, note, timestamp)
   
   Order items:
   ⚠️ Read product name, price, image from item.product_snapshot (frozen JSONB), NOT from
   live product fetch. product_snapshot contains full product data at time of purchase.
   If product_snapshot is null (edge case), fall back to product_id label only.
   
   Show: address, delivery date + slot, payment method + status, instructions, greeting message

3. Cancel button:
   Only show if status === 'pending' AND time since order.created_at < 30 minutes
   Live countdown: "You can cancel for 28:14 more"
   Confirm modal → PUT /orders/:id/status { status: "cancelled", note: reason }

4. Request refund: show if status === 'delivered'
   Modal: reason + amount → POST /payments/:paymentId/refund

5. Report Issue button (links to IssueReportModal from P27)

Deliverable: Order confirmation + detail page. product_snapshot used correctly.
```

---

## 👤 PHASE 7 — Customer Dashboard

---

### PROMPT P15 — Customer Profile & Addresses

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (business rule #5 — address edit field names) fully.
Previous: P00–P14 complete.

Files:
- app/(customer)/dashboard/page.tsx
- app/(customer)/settings/profile/page.tsx
- app/(customer)/settings/addresses/page.tsx

API: GET /profile, PUT /profile, GET /addresses, POST /addresses,
     PUT /addresses/:id (P4 fix), PUT /addresses/:id/default, DELETE /addresses/:id

1. Dashboard home:
   - Welcome banner (name from profile)
   - Stats: total orders, active subscriptions, wishlist count
   - Recent orders (GET /orders?limit=3)
   - Quick action links

2. Profile settings:
   - Avatar (URL input), full_name, date_of_birth, preferred_language (tk/en/ru)
   - PUT /profile on save

3. Addresses page:
   - Address cards with label, default star badge
   - Actions: Set Default, Edit, Delete
   - Edit form uses PUT /addresses/:id
   ⚠️ IMPORTANT: The P4 fix spec showed different field names (address_line_1 etc.)
   but those appear to be a bug. Use the ORIGINAL schema field names:
   { label, city, district, street, building, apartment, lat, lng, is_default }
   If PUT /addresses/:id returns a 400 or 404, fall back to DELETE + POST and show a user note.
   - "Add New Address" expandable form

Deliverable: Profile and address management. Correct field names used for address edit.
```

---

### PROMPT P16 — Customer Orders Page

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (business rule #10 — product_snapshot) fully.
Previous: P00–P15 complete.

Files:
- app/(customer)/orders/page.tsx
- components/order/OrderCard.tsx

API: GET /orders?limit=20&offset=0

1. Status filter tabs: All, Pending, Confirmed, Preparing, Out for Delivery, Delivered, Cancelled

2. OrderCard:
   - Order number, date, status badge, payment status badge
   - Product name + image from order item product_snapshot (NOT live product fetch)
   - "and X more items" if multiple items
   - Total in TMT
   - "View Details" → /orders/:id
   - If pending + < 30 min old: "Cancel" button with live countdown

3. Pagination, empty state per tab

Deliverable: Orders list with filter, pagination, cancellation.
```

---

### PROMPT P17 — Wishlist & Notifications

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (business rule #12 — poll notifications every 30s) fully.
Previous: P00–P16 complete.

Files:
- app/(customer)/wishlist/page.tsx
- app/(customer)/settings/notifications/page.tsx

API: GET /wishlist, POST /wishlist, DELETE /wishlist, GET /wishlist/check/:product_id,
     GET /notifications, PUT /notifications/:id/read (pass "all" as literal :id for mark-all),
     GET /notifications/preferences (P4 fix), PUT /notifications/preferences (P4 fix)

1. Wishlist page:
   - ProductCard grid
   - Remove button per item
   - "Move to Cart" → POST /cart/items → remove from wishlist
   - Empty state with CTA

2. Notifications page:
   - Unread (white bg) vs read (muted) styling
   - "Mark all as read" → PUT /notifications/all/read
     ⚠️ The path is PUT /notifications/:id/read where :id = the literal string "all"
     So the request goes to: PUT /api/v1/notifications/all/read
   - Click notification → mark read + navigate to context (order, product, etc.)

3. Notification preferences (tab or section):
   - Toggle switches: SMS, Email, Push, Marketing
   - Load: GET /notifications/preferences → defaults if empty
   - Save: PUT /notifications/preferences on each toggle (optimistic update)

Deliverable: Wishlist + notifications + preference toggles.
```

---

### PROMPT P18 — Subscriptions & Saved Occasions

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully.
Previous: P00–P17 complete.

Files:
- app/(customer)/subscriptions/page.tsx
- app/(customer)/occasions/page.tsx

API: GET /subscriptions/plans, POST /subscriptions, GET /subscriptions (P3),
     PUT /subscriptions/:id/pause, PUT /subscriptions/:id/cancel (P3),
     PUT /subscriptions/:id/resume (P4),
     GET /saved-occasions (P3), POST /saved-occasions (P3), GET /occasions

1. Subscriptions page:
   - No subscription: plan cards from GET /subscriptions/plans
     Subscribe modal: seller (text input for seller_id), address picker, start date
   - Has subscription: status card
     Active: Pause button, Cancel button
     Paused: Resume button, Cancel button
     Cancelled: "Subscribe again" link

2. Saved occasions page:
   - Occasion cards: name, recipient, date, countdown ("5 days away" — red if < 7 days)
   - "Add Occasion" modal: select occasion (GET /occasions), recipient, date, reminder days
   - "Shop for [recipient]" → /gift-builder?occasion=slug
   - Empty state

Deliverable: Subscription management + saved occasions with countdown.
```

---

## 🏪 PHASE 8 — Seller Dashboard

---

### PROMPT P19 — Seller Application & Dashboard Home

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (Seller Routes section) fully.
Previous: P00–P18 complete.

Files:
- app/(public)/become-seller/page.tsx
- app/(seller)/seller/dashboard/page.tsx

API: POST /seller/apply, GET /seller/profile

1. Become a Seller page (public):
   - Benefits marketing page
   - Form: shop_name, description
   - Requires auth: redirect to /login?next=/become-seller if not logged in
   - POST /seller/apply → "Application submitted!" message

2. Seller dashboard — status-aware:
   Pending: application review banner + document status
   Approved: stats cards (orders, revenue, rating), recent orders, low stock alerts, quick actions
   Rejected / Suspended: warning banner with reason

Deliverable: Seller application flow + status-aware dashboard.
```

---

### PROMPT P20 — Seller Product Management

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (Seller product endpoints, business rule #9 JSON fields) fully.
Previous: P00–P19 complete.

Files:
- app/(seller)/seller/products/page.tsx
- app/(seller)/seller/products/new/page.tsx
- app/(seller)/seller/products/[id]/edit/page.tsx

API: GET /seller/products, POST /seller/products, PUT /seller/products/:id,
     DELETE /seller/products/:id, POST /seller/products/:id/variants,
     POST /seller/products/:id/addons, PUT /seller/products/:id/inventory,
     GET /seller/products/low-stock, GET /categories

1. Product list: table with image, title, category, price, status badge, stock level
   Status toggle, low stock indicator, Edit/Delete actions

2. Create/Edit form (5 sections):
   Section 1: Basic info (title, description, category, prices, status, shelf life)
   Section 2: Images (up to 5 URL inputs, preview thumbnails, mark primary)
   Section 3: Variants (dynamic add/remove list)
   Section 4: Addons (dynamic add/remove list)
   Section 5: Inventory (per variant quantity inputs)
   
   Save flow: POST /seller/products → then POST variants → POST addons → PUT inventory

Deliverable: Full seller product CRUD with variants, addons, inventory.
```

---

### PROMPT P21 — Seller Orders & Reviews

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (business rule #10 — product_snapshot) fully.
Previous: P00–P20 complete.

Files:
- app/(seller)/seller/orders/page.tsx
- app/(seller)/seller/orders/[id]/page.tsx
- app/(seller)/seller/reviews/page.tsx

API: GET /seller/orders, GET /orders/:id, PUT /orders/:id/status,
     GET /seller/reviews, PUT /reviews/:id/respond

1. Seller orders:
   - Tabs: New, Confirmed, Preparing, Out for Delivery, Delivered, Cancelled
   - Order row: order #, items summary (from product_snapshot), total, delivery date + slot, status
   - Quick actions by status: "Accept" (→ confirmed), "Start Preparing" (→ preparing)
   - Order detail: items from product_snapshot, personalization job status, delivery info, timeline

2. Reviews page:
   - Review cards: product, rating, comment, images, date, seller response if exists
   - Reply form: textarea → PUT /reviews/:id/respond
   - Average rating summary

Deliverable: Seller order management + review response system.
```

---

### PROMPT P22 — Seller Settings

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (business rule #1 — HH:MM:SS format) fully.
Previous: P00–P21 complete.

File: app/(seller)/seller/settings/page.tsx (tabbed)

API: GET /seller/profile, PUT /seller/profile, POST /seller/documents, PUT /seller/bank-details,
     PUT /seller/working-hours, PUT /seller/delivery-zones,
     GET /admin/delivery/zones,
     POST /seller/delivery/time-slots  ← REQUIRED feature, not optional

Tabs:

Tab 1 — Shop Profile: name, description, logo URL, cover URL

Tab 2 — Documents (KYC): list by type with verification status, add form per type

Tab 3 — Bank Details: form for bank_name, account_number, account_holder_name

Tab 4 — Working Hours:
   - 7-day schedule editor (0=Sun to 6=Sat)
   ⚠️ Times MUST be sent as "HH:MM:SS" format: "09:00:00", "18:00:00"
   - Use time input and append ":00" to the HH:MM value before sending to API
   - Toggle "Closed" per day
   - "Copy to all weekdays" shortcut

Tab 5 — Delivery Zones:
   - Checkboxes from GET /admin/delivery/zones
   - PUT /seller/delivery-zones { zone_ids } on save

Tab 6 — Time Slots (REQUIRED — sellers need these to be bookable):
   - Calendar view showing existing slots
   - Add slot form: slot_date, start_time("HH:MM:SS"), end_time("HH:MM:SS"), max_orders, price_modifier
   - POST /seller/delivery/time-slots
   - Show booked_orders vs max_orders per slot

Deliverable: All 6 setting tabs. Working hours in HH:MM:SS format. Time slots tab required.
```

---

## 👑 PHASE 9 — Admin Dashboard

---

### PROMPT P23 — Admin Dashboard & Seller Management

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (Admin Routes section) fully.
Previous: P00–P22 complete.

Files:
- app/(admin)/admin/dashboard/page.tsx
- app/(admin)/admin/sellers/page.tsx
- app/(admin)/admin/sellers/[id]/page.tsx

API: GET /admin/analytics/daily?date=today, GET /admin/sellers, PUT /admin/sellers/:id/approve,
     PUT /admin/sellers/:id/reject, PUT /admin/sellers/:id/suspend

1. Dashboard home:
   - Stats from GET /admin/analytics/daily (total_orders, revenue, new_customers, avg_order_value)
   - top_products and top_sellers come as JSONB — parse before rendering
   - Quick action cards: pending sellers, bank proofs, refunds
   - System health (GET /health)

2. Seller management:
   - Status filter tabs: All, Pending, Approved, Suspended, Rejected
   - Table: shop_name, applied date, status, documents count
   - Approve (green button) / Reject (reason modal) / Suspend (reason modal)
   - Seller detail: full profile, documents, stats, action buttons

Deliverable: Admin dashboard with KPIs + seller KYC workflow.
```

---

### PROMPT P24 — Admin Orders & Payments

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (business rule #10 product_snapshot, business rule #17 bank-proofs fallback) fully.
Previous: P00–P23 complete.

Files:
- app/(admin)/admin/orders/page.tsx
- app/(admin)/admin/orders/[id]/page.tsx
- app/(admin)/admin/payments/page.tsx

API: GET /admin/orders, GET /orders/:id, PUT /orders/:id/status,
     GET /admin/bank-proofs (P4 fix — may not exist, see business rule #17),
     PUT /admin/payments/:id/approve-proof, PUT /admin/payments/:id/reject-proof,
     GET /admin/refunds, PUT /admin/payments/refunds/:refundId/process

1. Admin orders: full table with all orders, status filter, date filter
   Admin can set ANY status. Override modal: status selector + required note.
   ⚠️ Product names in order items come from product_snapshot — use that field.

2. Bank Proofs tab:
   ⚠️ Try GET /admin/bank-proofs?status=pending first.
   If 404: fall back to filtering GET /admin/orders for bank_transfer + pending payment orders.
   Show warning to admin: "Bank proof listing endpoint may be unavailable, showing pending bank transfer orders instead."
   Approve: PUT /admin/payments/:id/approve-proof
   Reject + reason: PUT /admin/payments/:id/reject-proof

3. Refunds tab: GET /admin/refunds, approve/reject per refund

Deliverable: Admin order management + bank proof review with fallback + refund processing.
```

---

### PROMPT P25 — Admin Products, Promotions, Banners & Personalization Templates

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (Admin Routes — including POST /admin/personalization/templates) fully.
Previous: P00–P24 complete.

Files:
- app/(admin)/admin/products/page.tsx
- app/(admin)/admin/promotions/page.tsx
- app/(admin)/admin/banners/page.tsx

API: GET /admin/categories, POST /admin/categories, GET /products,
     PUT /admin/products/:id/featured,
     GET /admin/promotions, POST /admin/promotions,
     GET /admin/banners (P4), POST/PUT/DELETE /admin/banners (P4),
     POST /admin/occasions (P3),
     POST /admin/personalization/templates  ← ✅ REQUIRED — fully implemented endpoint

1. Products page:
   - All products across all sellers
   - Feature/unfeature toggle per product
   - Category management: tree + add form (POST /admin/categories)
   - Occasions management: list + add form (POST /admin/occasions)

2. Personalization Templates section (on products page or sub-tab):
   - List templates per type (GET /personalization/types with templates preloaded)
   - Create template form → POST /admin/personalization/templates:
     { type_id, name, preview_image_url, description, example_text, is_active, sort_order }
   - Toggle is_active per template

3. Promotions page:
   - Promotion list: code, type, value, usage/max, expiry, status toggle
   - Create promotion modal: full form with all fields including seller scope picker

4. Banners page:
   - Banners grouped by position (home_top, home_mid, category_page)
   - Image preview + title + date range + active status
   - Create/edit modal, delete with confirmation

Deliverable: Product features, promotions, banners, AND personalization template management.
```

---

### PROMPT P26 — Admin Couriers, Zones & Analytics

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (Admin Routes — analytics endpoint has NO seller_id param) fully.
Previous: P00–P25 complete.

Files:
- app/(admin)/admin/couriers/page.tsx
- app/(admin)/admin/analytics/page.tsx
- app/(admin)/admin/settings/page.tsx

API: GET /admin/couriers, POST /admin/couriers, PUT /admin/deliveries/:id/assign,
     GET /admin/delivery/zones, POST /admin/delivery/zones,
     GET /admin/analytics/daily?date=, GET /admin/analytics/seller?date=,
     GET /admin/settings, PUT /admin/settings, GET /admin/logs

1. Couriers: list, add courier, assign to delivery. Status badges.

2. Delivery zones: zone cards + create form (polygon as GeoJSON textarea)

3. Analytics page:
   - Date picker
   - GET /admin/analytics/daily?date= → KPI cards
   - top_products and top_sellers parsed from JSONB strings
   - GET /admin/analytics/seller?date= → returns array of ALL sellers for that date
     ⚠️ There is NO seller_id filter. This endpoint returns stats for all sellers on the chosen date.
     Display as a sortable table: seller name, orders, revenue, avg rating
     DO NOT implement per-seller drill-down from this endpoint (it doesn't support it)

4. Settings: key/value table, edit inline. Admin logs paginated table.

Deliverable: Courier management + delivery zones + analytics (all-sellers table, no per-seller filter).
```

---

### PROMPT P27 — Admin Issue Reports

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully.
Previous: P00–P26 complete.

Files:
- app/(admin)/admin/reports/page.tsx
- components/shared/IssueReportModal.tsx

API: POST /issue-reports (P4), GET /admin/issue-reports (P4), PUT /admin/issue-reports/:id/status (P4)

1. IssueReportModal (shared component used across the app):
   - Triggered from order detail, product detail pages
   - Fields: issue_type (defective_product, late_delivery, wrong_item, other), description
   - order_id or review_id auto-filled from context
   - POST /issue-reports

2. Admin reports page:
   - Tabs: Open, Investigating, Resolved, Dismissed
   - Report table: type, description, target type+id, reporter, date, status
   - Actions: Investigating, Resolve (+ admin note), Dismiss (+ admin note)

3. Add IssueReportModal trigger to:
   - app/(customer)/orders/[id]/page.tsx (P14)
   - app/(public)/products/[id]/page.tsx (P09)

Deliverable: Issue reporting system — customer UI + admin resolution workflow.
```

---

## 🌸 PHASE 10 — Public Seller Profile

---

### PROMPT P34 — Public Seller Profile Page

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully (GET /sellers/:id public endpoint).
Previous: P00–P27 complete.

File: app/(public)/sellers/[slug]/page.tsx

API: GET /sellers/:id (supports both UUID and slug — P4 fix)
     GET /products?seller_id=uuid (to list seller's products)
     GET /products/:id/reviews (P4 fix — for seller's product reviews overview)

Note: This is a PUBLIC page, no authentication required.
The GET /sellers/:id endpoint is the public seller profile — it does NOT expose
bank details, documents, or internal stats.

Page sections:

1. Seller hero:
   - Cover image (cover_url) as full-width banner
   - Logo (logo_url) as overlapping circle avatar
   - Shop name (Playfair Display, large)
   - Description
   - Status badge (approved / show nothing if not approved — don't show unapproved sellers)
   - Average rating + total reviews count (from seller's seller_ratings data)

2. Working hours card:
   ⚠️ Working hours times come as "HH:MM:SS". Display as "09:00 – 18:00"
   Show as a 7-day table with open/closed per day
   Highlight today's row

3. Delivery zones:
   - Show zone names the seller delivers to (from seller.delivery_zones)

4. Products grid:
   - GET /products?seller_id=uuid
   - ProductCard grid with pagination
   - Category filter tabs if seller has multiple categories

5. Reviews:
   - GET /products/:id/reviews for seller's most popular product (or aggregate)
   - Show avg rating breakdown (5-star, 4-star, etc.)
   - Recent review cards

6. SEO metadata: seller shop_name + description in metadata

Deliverable: Full public seller storefront page. Times formatted correctly from HH:MM:SS.
```

---

## 🚴 PHASE 11 — Courier Interface

---

### PROMPT P28 — Courier Deliveries Interface

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (Courier Routes section) fully.
Previous: P00–P27, P34 complete.

Files:
- app/(courier)/courier/deliveries/page.tsx
- app/(courier)/courier/deliveries/[id]/page.tsx

API: GET /courier/deliveries?status=, PUT /courier/deliveries/:deliveryId/process,
     PUT /courier/location { latitude, longitude }

Mobile-first design. Large touch targets. Minimal scrolling.

1. Delivery list:
   - Tabs: Active (assigned/picked_up/en_route), Completed, Failed
   - Large delivery cards: order #, address, ETA, status badge
   - "Update Status" button per delivery

2. Delivery detail:
   - Pickup + dropoff addresses (prominent)
   - Customer special instructions
   - Status action buttons (full-width, large):
     "Picked Up" → picked_up
     "On the Way" → en_route
     "Delivered" → delivered
     "Failed" — requires failure reason input → failed

3. Location sharing toggle:
   - Browser Geolocation API → PUT /courier/location every 60 seconds
   - Show last updated timestamp
   - Store preference in localStorage

Deliverable: Mobile-optimized courier interface.
```

---

## ✨ PHASE 12 — Analytics Tracking & Polish

---

### PROMPT P35 — Analytics Event Tracking Audit

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md (business rule #16 — analytics tracking, lib/api/analytics.ts) fully.
Previous: All previous prompts complete.

Your task: Audit the entire app and wire in POST /analytics/track at all required touchpoints.
lib/api/analytics.ts was created in P02 with trackEvent() that silently catches errors.

Go through each page/component and add the following tracking calls:

1. Product detail page (P09):
   useEffect on mount → trackEvent('product_view', { product_id, category_id, seller_id })

2. Search (P08):
   On search submit → trackEvent('search_performed', { query, results_count })

3. Gift builder (P10):
   On Step 1 entry → trackEvent('gift_builder_started', { occasion_id })
   On Step 5 "Add to Cart" success → trackEvent('gift_builder_converted_to_order', { suggestion_id })

4. Checkout (P13):
   On POST /orders success → trackEvent('order_placed', { order_id, total, payment_method })

5. Cart (P12):
   On promo code applied → trackEvent('coupon_applied', { code, discount_type, discount_value })

6. Product card click (P06):
   On card click before navigating → trackEvent('product_view', { product_id })

Verify all tracking calls:
- Never block the user flow (all calls are fire-and-forget)
- Never show errors to the user if tracking fails
- Wrap all calls in try/catch or use the silently-failing trackEvent helper

Deliverable: Full analytics tracking wired across the app.
```

---

### PROMPT P29 — Loading States & Skeleton Loaders

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully.
Previous: All previous prompts complete.

1. Create skeleton variants:
   - ProductCardSkeleton, OrderCardSkeleton, ProfileSkeleton, TableRowSkeleton, BannerSkeleton

2. Apply skeletons to ALL pages:
   - Products listing: 8 ProductCardSkeleton
   - Homepage featured: 4 ProductCardSkeleton
   - Orders: OrderCardSkeleton list
   - Profile: ProfileSkeleton
   - Admin tables: 5 TableRowSkeleton rows

3. Route transition: thin rose progress bar at top (framer-motion)

4. All submit/action buttons: spinner inside when mutation is pending, disabled during load

5. Error boundaries per route group with "Try Again" button

Deliverable: All pages have skeletons. No content flashes.
```

---

### PROMPT P30 — Toast Notifications & Error Handling

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully.
Previous: All previous prompts complete.

1. react-hot-toast themed with Flora design system (cream bg, bark text, rose accent)
   Position: top-right desktop, top-center mobile

2. Create lib/utils/toast.ts:
   - success(msg), error(msg), loading(msg), dismiss(id)
   - apiError(error): extracts error.error field from API error

3. Wire toast notifications to all API mutations:
   - Cart add: "Added to cart 🌸"
   - Order placed: "Order placed successfully!"
   - Auth: login "Welcome back!", logout "See you soon!"
   - All admin actions: specific messages
   - 401: "Please log in to continue"
   - 403: "You don't have permission"
   - 500: "Something went wrong. Please try again."

4. Form validation errors: field-level display via React Hook Form + FormError component

5. Empty states on all list/grid pages: illustration + title + description + CTA

Deliverable: Consistent toast and error system across the entire app.
```

---

### PROMPT P31 — Mobile Responsiveness Audit

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully.
Previous: All previous prompts complete.

Test at: 375px (iPhone SE), 390px (iPhone 14), 768px (tablet), 1024px (laptop)

Fix every page for mobile. Priority issues to check:

1. Navbar: badges visible, CartDrawer no overflow, SearchOverlay full-screen on mobile
2. Homepage: hero text readable, 2-col occasions grid on mobile, horizontal scroll for featured
3. Product listing: filter → bottom sheet on mobile, 2-col grid
4. Product detail: sticky "Add to Cart" bar at bottom, gallery full-width, selectors stacked
5. Checkout: steps fit on small screen, slots grid horizontal scroll
6. Customer dashboard: verify bottom tab bar works (from P04)
7. Admin: tables with horizontal scroll wrapper, sidebar → hamburger
8. All modals: full-screen on mobile
9. Seller settings: tabs scroll horizontally on mobile

Responsive text sizes:
- Hero headline: text-5xl → text-3xl on mobile
- Section titles: text-3xl → text-xl on mobile

Deliverable: Fully responsive at all breakpoints.
```

---

### PROMPT P32 — SEO, Metadata & Performance

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully.
Previous: All previous prompts complete.

1. Metadata per page:
   - Root: title template "Flora | %s", default og:image
   - Homepage: "Flora — Fresh Flowers & Gifts in Turkmenistan"
   - Product detail: dynamic (product title + price)
   - Category: "Category Name — Flora"
   - Seller profile: seller shop_name + description
   - Auth pages: noindex

2. Replace all <img> with Next.js <Image>. Add priority to above-fold images.

3. Dynamic imports for heavy components:
   - CartDrawer, SearchOverlay, framer-motion heavy sections

4. React.memo on ProductCard, OrderCard

5. TanStack Query staleTime:
   - Products: 5 min | Categories: 30 min | Cart: 30s | Notifications: 30s

6. app/robots.txt: allow all, disallow /admin, /courier, /seller
   app/sitemap.ts: dynamic sitemap with product and category URLs

Deliverable: SEO optimized. Performance tuned.
```

---

### PROMPT P33 — Final Integration & End-to-End Checklist

```
You are building the Flora frontend.
Read FLORA_FRONTEND_MASTER_PLAN_v2.md fully.
Previous: ALL prompts P00–P35 complete.

Run through this checklist and fix any failing item:

CUSTOMER JOURNEY:
[ ] Register with phone → OTP → verify → login → redirect to /dashboard
[ ] Browse products → filter by category → product detail page loads
[ ] Select variant → select addon → price updates correctly
[ ] Personalization form: available_materials and available_colors are arrays (not raw strings)
[ ] Add to cart → view CartDrawer → quantity change works
[ ] Cart page: promo code applied → discount shows → promo id in order body
[ ] Checkout: address zone check shown, delivery date blocks closed days, slot time shows correctly
[ ] Checkout: bank transfer selected → seller bank details shown (from GET /sellers/:id)
[ ] Place order → confirmation → product_snapshot used in order items display
[ ] Cancel order (within 30 min): countdown shows, cancellation works
[ ] Gift builder: occasion → budget → suggestions shown (product_ids parsed correctly) → add to cart
[ ] Search autocomplete: type in navbar → results appear → click navigates
[ ] Seller profile page (/sellers/slug) loads publicly
[ ] Subscription: create, pause, resume, cancel
[ ] Saved occasion: add, see countdown, "Shop for" link works
[ ] Notifications: unread badge in navbar, mark all read works
[ ] Notification preferences: toggles save

SELLER JOURNEY:
[ ] Apply to sell → pending state shown
[ ] Add product → variants + addons → inventory set
[ ] Working hours: saved with HH:MM:SS format
[ ] Time slots: create a slot (REQUIRED, not optional)
[ ] View orders → accept → advance statuses
[ ] Respond to review

ADMIN JOURNEY:
[ ] Login as admin → analytics shows all-sellers table (no per-seller filter)
[ ] Approve pending seller
[ ] Override order status with note
[ ] Bank proof tab: loads (or fallback message shown if endpoint missing)
[ ] Process refund
[ ] Create promotion
[ ] Create banner → appears on homepage
[ ] Create personalization template
[ ] Admin issue reports: resolve one

COURIER JOURNEY:
[ ] Assigned deliveries load
[ ] Status updates work (picked_up → en_route → delivered)
[ ] Location sharing toggles on/off

ANALYTICS:
[ ] product_view fires on product detail page load
[ ] search_performed fires on search submit
[ ] gift_builder_started fires on first gift builder step
[ ] order_placed fires after checkout success
[ ] coupon_applied fires on promo code apply
[ ] All tracking is fire-and-forget (never blocks UI)

Final cleanup:
- Remove /design-system page or move behind admin auth
- Remove all console.log statements
- Verify .env.local is in .gitignore
- Create .env.local.example with NEXT_PUBLIC_API_URL documented

Create README.md:
- Project description + setup instructions
- All environment variables
- Architecture overview
- Phase completion checklist

Deliverable: Fully tested, production-ready Flora frontend.
```

---

## 📋 PHASE SUMMARY TABLE

| Phase | Prompts | What Gets Built |
|---|---|---|
| 0 — Scaffold | P00, P01, P02 | Project setup, design system, API client, analytics helper, JSON parse utils |
| 1 — Layout | P03, P04 | Navbar + SearchOverlay + CartDrawer, Footer, all layout shells |
| 2 — Homepage | P05, P06, P07 | Hero, banners, occasions, featured products, all homepage sections |
| 3 — Products | P08, P09 | Product listing + search, product detail + personalization |
| 4 — Gift Builder | P10 | Complete client-side gift builder with JSON parse |
| 5 — Auth | P11 | Register, OTP, Login, Password reset |
| 6 — Cart/Checkout | P12, P13, P14 | Cart, checkout (working hours + bank details), order confirmation |
| 7 — Customer | P15, P16, P17, P18 | Profile, orders, wishlist, notifications, subscriptions, occasions |
| 8 — Seller | P19, P20, P21, P22 | Application, dashboard, products, orders, reviews, settings (incl. time slots) |
| 9 — Admin | P23, P24, P25, P26, P27 | Sellers, orders/payments, products/banners/personalization templates, analytics, reports |
| 10 — Seller Profile | P34 | Public seller storefront page |
| 11 — Courier | P28 | Mobile-first courier delivery interface |
| 12 — Polish | P35, P29, P30, P31, P32, P33 | Analytics tracking audit, loading states, toasts, mobile, SEO, final testing |

**Total: 36 Prompts across 12 Phases**

---

## 🔁 HOW TO HAND OFF BETWEEN AI SESSIONS

At the start of EVERY new AI session, paste this:

> "You are working on the Flora frontend project. First, read the full FLORA_FRONTEND_MASTER_PLAN_v2.md file completely. The current state is: [list which prompts P00–P35 are complete]. Your task is Prompt [PXX]. Do not change anything from previously completed phases unless the current prompt explicitly instructs it."

At the end of each session, note:
- Which prompt was completed
- Which files were created or modified
- Any deviations from the spec that future sessions should know about

---

## 📝 CHANGES FROM v1

| Fix # | What Changed |
|---|---|
| 1 | Address edit fields corrected to original schema names (label, city, district, etc.) with fallback note |
| 2 | Working hours format corrected to "HH:MM:SS" everywhere (P01, P09, P22, P34) |
| 3 | Admin analytics seller endpoint: removed seller_id param, now returns all sellers table |
| 4 | Added lib/utils/jsonFields.ts with parseJsonArray helper, documented all affected fields |
| 5 | Added P34 — Public Seller Profile page (was in folder structure but had no prompt) |
| 6 | Added lib/api/analytics.ts in P02 + P35 analytics audit prompt + wired into P06, P08, P09, P10, P12, P13 |
| 7 | Added personalization templates (POST /admin/personalization/templates) to P25 |
| 8 | Bank transfer seller bank details: corrected to use GET /sellers/:id (public endpoint) in P13, P14 |
| 9 | Added bank-proofs fallback logic in P24 with user-visible warning |
| 10 | product_snapshot rule added to business rules section + called out in P14, P16, P21, P24 |
| 11 | Added SearchOverlay component to P03 wired to GET /products/autocomplete |
| 12 | Seller time slots moved from "Bonus" to REQUIRED in P22 (Tab 6) |
| 13 | mark-all-read clarified: PUT /notifications/all/read with literal "all" as :id param |
| 14 | Analytics seller endpoint: displays as all-sellers table, no per-seller drill-down |
| 15 | Header prompt count corrected from 52 to 36 |

---

*Flora Frontend Master Plan v2 — Corrected 2026-03-22*
*Backend: Flora Go API v1 | Frontend: Next.js 14 App Router | Design: Soft Romantic*
