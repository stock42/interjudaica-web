# InterJudaica Project Improvements

## Resolved

- Class materials now accept any file type instead of a narrow MIME allowlist.
- Each class material has editable title and description metadata.
- Enrolled students can access class materials from `/course/[slug]/classes`.
- The class-material download route remains protected by active course enrollment.
- Operators can download class materials through the authenticated admin file route.
- Deleting a class now also removes its stored class-material files and database records.
- Admin class editing now has a dedicated material manager with empty, loading, error, upload, edit, delete, and download states.
- `/admin/courses/[uuid]` now has a course-level material library with missing-description and empty-class warnings.
- Class material uploads now show browser upload progress.
- Purchased course class pages now support student completion tracking, and the student dashboard shows per-course progress.
- `/admin/users` now links into `/admin/users/[uuid]` access diagnostics with enrollments, payment source, granted-by operator, progress, and last access.
- Analytics, payments, and subscriptions now show live operational metrics and attention-needed signals.
- The admin has a global command palette using `/api/admin/search` plus quick actions for course creation, enrollment grants, contacts, and moderation.
- `/admin/moderation` provides contact/forum queue filters for status, owner, and due date.
- `/admin/config` now includes upload cleanup scanning/deletion for orphaned upload files.
- `audit_logs` now records class material upload, edit, admin download, student download, and delete events tied to operator/student UUIDs.
- Playwright API E2E coverage now exercises class material upload, edit, admin download, enrolled-student download, and progress update.
- Admin navigation now starts collapsed except for the active section, keeps the InterJudaica brand visible, and gives the AI assistant a clearer command treatment.
- Admin routes no longer inherit the public site header/footer chrome.
- Admin overview now includes operational signals and priority action shortcuts instead of only static record counts.
- A root `DESIGN.md` now documents the existing InterJudaica visual system and admin UI patterns.

## Remaining real improvements

1. Add resumable/chunked upload support for very large class files if course materials exceed the configured upload limit.
2. Add background scheduling for upload cleanup so the admin tool can be run automatically with a dry-run notification first.
3. Add richer activity analytics from audit logs, including per-course material download rates and inactive enrolled students.
4. Add batch moderation actions for assigning owners and due dates to multiple queue items.
5. Add visual regression coverage for the new admin surfaces after the operational flows stabilize.

## UI/UX direction for admin

- Treat the admin as an operational workspace, not a marketing page: dense information, clear hierarchy, quick actions, and fewer decorative sections.
- Keep the left navigation persistent on desktop, collapsed-by-context, and searchable through a command palette.
- Use module dashboards for Courses, Sales, CRM, Email, and Content, each with the same structure: current state, attention-needed items, primary actions, and recent activity.
- Prefer inline editing or dedicated route screens over modals for complex admin work.
- Add empty states that explain the next real action, not generic copy.
- Keep destructive actions explicit, reversible where possible, and paired with visible result state.
