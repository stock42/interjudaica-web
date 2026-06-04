# Subscription Plans Module

Multi-plan subscription system for InterJudaica. Users can choose from different subscription plans, each with its own price. Stripe prices are created on-the-fly from plan data.

## Phase 0: Foundation (15 min)

### 0.1 — Prerequisites
No new env vars needed. Reuses:
- `lib/stripe.ts` → `getStripe()`
- `.env` → `STRIPE_SECRET_KEY` (already set)
- Existing `services/community-users-storage.ts`, `services/community-memberships.ts`

### 0.2 — Update Model: `models/community-users.ts`
Add `planUuid: z.string().trim().default("")` to `schemaCommunityUser`.

### 0.3 — Update Index: `services/community-users-storage.ts`
Add `collection.createIndex({ "data.planUuid": 1 })` in `ensureIndexes()`.

## Phase 1: Plan Model & Storage (20 min)

### 1.1 — Model: `models/subscription-plans.ts`
```typescript
export const billingIntervals = ["month", "year"] as const;
export const schemaSubscriptionPlan = z.object({
  uuid: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().default(""),
  price: z.coerce.number().int().min(0),          // cents
  billingInterval: z.enum(billingIntervals).default("month"),
  stripePriceId: z.string().trim().default("").nullable().optional(),
  active: z.coerce.boolean().default(true),
});
export type TypeSubscriptionPlan = z.infer<typeof schemaSubscriptionPlan>;
export class SubscriptionPlanModel { … }
```

### 1.2 — Storage: `services/subscription-plans-storage.ts`
Class `SubscriptionPlanStorage` extending `MongoDBStorage<TypeSubscriptionPlan>`:
- `static readonly COLLECTION = "subscription_plans"`
- `ensureIndexes()`: uuid unique, data.active
- `list(includeArchived?)`: reads all docs (filter by active), sorted by _added desc
- `get(uuid)`: single doc by uuid
- `create(input)`: validates with SubscriptionPlanModel, inserts
- `update(uuid, input)`: _getByUUID + merge + _replaceData
- `remove(uuid)`: _deleteOne

## Phase 2: API Routes (20 min)

### 2.1 — `app/api/admin/subscription-plans/route.ts`
- `GET`: `requireAdminApi`, returns `{ items }` from list(true)
- `POST`: `requireAdminApi`, validates with `schemaSubscriptionPlan`, returns `{ item }` (201)

### 2.2 — `app/api/admin/subscription-plans/[uuid]/route.ts`
- `GET`: `requireAdminApi`, find by uuid, 404 if missing
- `PATCH`: `requireAdminApi`, partial update
- `DELETE`: `requireAdminApi`, remove by uuid

## Phase 3: Admin UI (25 min)

### 3.1 — List: `app/admin/subscription-plans/subscription-plans-list.tsx`
Client component `SubscriptionPlansList`:
- Fetches `GET /api/admin/subscription-plans`
- Table: Name, Price ($X.XX USD/month), Status (Active/Archived badge), Actions (Edit/Delete)
- "New plan" button at top
- Delete with confirm dialog

### 3.2 — Form: `app/admin/subscription-plans/subscription-plan-form.tsx`
Client component `SubscriptionPlanForm`:
- Fields: name, description (textarea), price in cents (number), active (checkbox)
- POST (create) or PATCH (update) depending on `plan` prop
- Navigate to list on success

### 3.3 — Pages:
- `page.tsx` (list) — wraps `AdminShell` + `SubscriptionPlansList`
- `new/page.tsx` — wraps `AdminShell` + `SubscriptionPlanForm`
- `[uuid]/page.tsx` — server component, fetches plan, wraps `AdminShell` + `SubscriptionPlanForm({ plan })`

## Phase 4: Update Existing Flow (30 min)

### 4.1 — Update `services/community-memberships.ts`
- Add `planUuid?: string` to `CommunityActivationInput`
- Pass it through to `CommunityUserStorage.upsertActive`

### 4.2 — Update `app/api/community/checkout/route.ts`
- Add `planUuid: z.string().uuid()` to checkout schema
- Look up plan via `SubscriptionPlanStorage.get(planUuid)`
- Create Stripe price from plan data: `name`, `description`, `unit_amount: plan.price`, `interval: plan.billingInterval`
- Pass `planUuid` in Stripe metadata + subscription_data metadata
- Pass `planUuid` to `activateCommunityMembership`

### 4.3 — Update `app/api/stripe/webhook/route.ts`
- Extract `planUuid` from `session.metadata?.planUuid`
- Pass it to `activateCommunityMembership`

### 4.4 — Update `app/community/page.tsx`
- Fetch active plans via `SubscriptionPlanStorage.list()`
- Replace the single plan card with a responsive grid (sm:grid-cols-2 lg:grid-cols-3)
- Each card shows: plan name, price (formatted: $X.XX), description, Subscribe button
- Subscribe button links to `/checkout-community?planUuid=...`
- If user is already member, show "Community forum" button instead (redirect to /community/forum)

### 4.5 — Update `app/checkout-community/page.tsx`
- Read `planUuid` from searchParams
- Redirect to `/community` if missing

### 4.6 — Update `app/checkout-community/checkout-community-form.tsx`
- Accept `planUuid` prop
- Pass `planUuid` in the POST body to `/api/community/checkout`

### 4.7 — Update `app/admin/subscriptions/page.tsx`
- Fetch plans from `SubscriptionPlanStorage.list(true)`
- Add "Plan" column showing plan name
- Add plan filter pills at top: "All" + each plan name clickable
- Filter `communityUsers` by `planUuid` when `searchParams.plan` is set

### 4.8 — Update `app/components/portal-ui.tsx`
- Add nav link before Subscriptions: `{ href: "/admin/subscription-plans", label: "Subscription Plans" }`

### 4.9 — Cleanup: remove existing community_users
```bash
node -e "const {MongoClient}=require('mongodb');new MongoClient(process.env.MONGODB_URI||'mongodb://localhost:27017/interjudaica').connect().then(c=>c.db().collection('community_users').deleteMany({}).then(r=>{console.log('removed',r.deletedCount);c.close()}))"
```

## Phase 5: Verify (10 min)

### 5.1 — Build Check
```bash
bun run tsc --noEmit && bun run build
```

### 5.2 — Route verification
Verify in build output:
- `/api/admin/subscription-plans`
- `/api/admin/subscription-plans/[uuid]`
- Admin UI pages render
- `/community` shows plan grid
- `/checkout-community?planUuid=...` shows checkout form

---

## Implementation Order

| Phase | What | Depends On |
|-------|------|------------|
| 0 | Update community_users model + storage index | — |
| 1 | subscription-plants model + storage | — |
| 2 | API routes (2 files) | Phase 1 |
| 3 | Admin UI (5 files) | Phase 2 |
| 4 | Update checkout, community page, subscriptions admin, webhook, nav | Phase 0, 1 |
| 5 | Verify build | All |
