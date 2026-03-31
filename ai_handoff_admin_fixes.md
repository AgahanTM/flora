# AI Handoff: Flora platform stabilization

This document summarizes the current state of the backend and frontend for the Flora platform, and outlines exactly what the next AI needs to do to finish the job.

## 1. What Has Been Completed So Far
*   **Build Errors Fixed:** Addressed `toast.info` usage in `useLocationTelemetry.ts` to `toast.success` and fixed the `sonner.tsx` import. Project now compiles with no TS errors via `npx tsc --noEmit`.
*   **Code Quality:** Replaced a duplicate local `<Edit3 />` component in `admin/settings/page.tsx` with the `lucide-react` import.
*   **Feature Completeness:** Implemented `lib/api/sellers.ts` with all required endpoints, and replaced the `admin/refunds/page.tsx` stub with a full management page UI.
*   **Database Seeding:**
    *   Inserted a test customer (`test@flora.tm`, password: `Test123!`) using `seed_test_customer.sql`.
    *   **CRITICAL FIX:** Updated the `password_hash` in the `users` table for both `admin@flora.com` and `seller1@flora.com` to use a native Go bcrypt hash for `Test123!`. You can successfully log into the local frontend using `admin@flora.com` / `Test123!`.

## 2. Current Broken State (Admin Portal Crashes)
When logging into the admin portal and navigating the sidebar, about 50% of the pages immediately crash the React tree, displaying a "System Interruption" error boundary. The browser console reveals the error is consistently: **`TypeError: [variable]?.filter is not a function`** (e.g. `orders?.filter`, `sellers?.filter`, `promotions?.filter`).

### The Root Cause
The admin frontend pages are directly fetching data using `apiClient.get()` inside `useQuery`, but they are destructuring the Axios response incorrectly.

The backend Go controllers return paginated data inside an object wrapper. For example: `c.JSON(http.StatusOK, gin.H{"data": orders, "total": total})`.
When the frontend executes:
```typescript
const { data } = await apiClient.get('/admin/orders');
return data as Order[]; // MISTAKE! `data` is the API JSON response `{ data: [], total: 0 }`
```
They return the *object* `{ data: [], total: 0 }` instead of the inner array. When the React component attempts to call `.filter()` on the object, it crashes.

## 3. How to Proceed
Your immediate next step is to fix these incorrect data mappings across the admin pages in the Next.js `app/(admin)/` directory.

### Action Plan
1.  **Search for Affected Pages:** Use `grep_search` to find `apiClient.get` inside the `app/(admin)/admin` directory.
    *   Known affected pages: `orders/page.tsx`, `sellers/page.tsx`, `promotions/page.tsx`, `refunds/page.tsx` (the one created recently), `products/page.tsx`, `analytics/page.tsx`, `users/page.tsx`, `banners/page.tsx`.
2.  **Fix the `queryFn` Returns:** Replace `return data as Type[];` with `return (data.data || []) as Type[];`.
    *   If the backend returns `{ data: null }` for empty results, `data.data || []` will safely cast it to an empty array so `?.filter` behaves properly.
    *   *Example fix for `orders/page.tsx`:*
        ```typescript
        const { data } = await apiClient.get(url);
        return (data.data || []) as Order[]; // Replaces: return data as Order[]
        ```
3.  **Check `adminApi.ts` vs inline queries:** Some pages use `adminApi.getOrders()`, while others use inline `apiClient.get(url)` calls. Check both patterns. If `lib/api/admin.ts` has the same flaw in its return statements, fix it there too.
4.  **Re-verify:** Once the queries are updated, use the `browser_subagent` to browse the admin dashboard again to verify the crashes are resolved. The backend and frontend are currently running in the background.
