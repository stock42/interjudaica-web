# Admin Overhaul Learnings

## Subscription Plans — AI Create

- Added `AiCreateModal` to both the subscription plans form (`subscription-plan-form.tsx`) and list (`subscription-plans-list.tsx`).
- Used `entityType="subscription-plan"` and `entityName="Subscription Plan"`.
- Form button located alongside "Back to list" link; on create, redirects to the new plan's edit page.
- List button located alongside "New plan" link; on create, refreshes the list.
- `onCreate` handler POSTs to `/api/admin/subscription-plans` with the AI-generated JSON body.
- Follows the same pattern as `social-proof`, `papers`, `pages`, and `paper-categories`.

## CRM Groups

- Created CRM Contact Groups module following the email groups pattern exactly.
- Model has: uuid, name, slug (auto), description, query (JSON string), contactCount (cached number).
- Used `crm_groups` collection (NOT `email_groups`).
- Admin CRUD at `/api/admin/crm/groups` with preview endpoints.
- Preview endpoint: `GET /api/admin/crm/groups/[uuid]/preview` → parses query → `CrmContactStorage.getMatchingContacts()` → `{ items, count }`.
- AI create button: `AiCreateModal` with `entityType="crm-group"`, system prompt describing `crm_contacts` collection fields.
- Form uses `description` field (not `promoting` like email groups).
- List shows: Name, Description, Contact Count, Has Query, Actions.
- Run button on list page fetches preview inline (same pattern as email groups).
- Nav: CRM section → Contacts, Campaigns, Groups (→ `/admin/crm/groups`); Email section → Templates, Campaigns, Groups (→ `/admin/email/groups`).

## Final Verification Fixes (2026-06-12)

### Embla Carousel v8 API — `perView` removal
- Embla v8 removed the `slides: { perView, spacing }` options object (the `slides` option is now `string | HTMLElement[] | NodeListOf<HTMLElement> | null` — a DOM reference).
- Removed `slides` and `breakpoints` (which also used `slides: { perView }`) from `testimonial-carousel.tsx` opts.
- Slide visibility in v8 is controlled via CSS on the slide elements; `CarouselItem` uses `basis-full` (1 slide visible).
- For multi-slide layouts at breakpoints, add responsive `basis-*` classes to `CarouselItem`.

### Owner Bio rename residuals
- `app/ernesto-yattah/page.tsx` still referenced `getRabbiBio()` and `RabbiBioPage` — renamed to `getOwnerBio()` and `OwnerBioPage`.
- `app/admin/owner-bio/page.tsx` still had `RabbiBioPage` function — renamed to `OwnerBioPage`.
