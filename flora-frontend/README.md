# Flora Frontend — Premium Floral E-commerce

Flora is a high-end, agentic e-commerce platform for fresh flowers and artisanal gifts in Turkmenistan. Designed with a soft, romantic aesthetic and powered by a robust Next.js 14 architecture.

## 🌸 Key Features

### 🛍️ For Customers
- **Gift Builder**: AI-inspired curated package selection.
- **Personalization**: Custom engravings, materials, and colors for gifts.
- **Smart Cart**: Quantity management, promo code application, and delivery zone validation.
- **Secure Checkout**: Support for Cash on Delivery and direct Bank Transfers with receipt upload.

### 🏪 For Sellers
- **Boutique Settings**: Manage shop identity, working hours (HH:MM:SS), and delivery zones.
- **Time Slots**: Granular bookable delivery windows.
- **Inventory & Orders**: Real-time management of floral variants and addons.

### 🛡️ For Admins
- **Global Nexus**: Consolidated analytics for all vendors.
- **Visual Merchandising**: Hero banner and campaign management.
- **Operations Control**: Seller approval, refund processing, and issue resolution.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- NPM or PNPM

### 2. Installation
```bash
npm install
```

### 3. Configuration
Copy the example environment file:
```bash
cp .env.local.example .env.local
```
Update `NEXT_PUBLIC_API_URL` to point to your backend.

### 4. Development
```bash
npm run dev
```

## 🏗️ Architecture

- **Framework**: Next.js 14 (App Router)
- **Styling**: Vanilla CSS + Tailwind (per user request) + Framer Motion
- **State Management**:
  - Server State: TanStack Query (React Query)
  - Client State: Zustand
- **Forms**: React Hook Form + Zod
- **API**: Axios with role-based interceptors
- **Icons**: Lucide React

## 🎯 Production Readiness
- ✅ All `<img>` tags replaced with `next/image`.
- ✅ SEO Metadata implemented globally.
- ✅ Dynamic Sitemap & Robots.txt.
- ✅ Analytics event tracking (`trackEvent`).
- ✅ Role-based Route Protection (Middleware).

## 📄 License
Privately held. All rights reserved by Flora Team.
