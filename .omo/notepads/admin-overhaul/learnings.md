# Admin Overhaul Learnings

## Subscription Plans — AI Create

- Added `AiCreateModal` to both the subscription plans form (`subscription-plan-form.tsx`) and list (`subscription-plans-list.tsx`).
- Used `entityType="subscription-plan"` and `entityName="Subscription Plan"`.
- Form button located alongside "Back to list" link; on create, redirects to the new plan's edit page.
- List button located alongside "New plan" link; on create, refreshes the list.
- `onCreate` handler POSTs to `/api/admin/subscription-plans` with the AI-generated JSON body.
- Follows the same pattern as `social-proof`, `papers`, `pages`, and `paper-categories`.
