# InterJudaica Project Improvements

## Resolved in this pass

- Class materials now accept any file type instead of a narrow MIME allowlist.
- Each class material has editable title and description metadata.
- Enrolled students can access class materials from `/course/[slug]/classes`.
- The class-material download route remains protected by active course enrollment.
- Operators can download class materials through the authenticated admin file route.
- Deleting a class now also removes its stored class-material files and database records.
- Admin class editing now has a dedicated material manager with empty, loading, error, upload, edit, delete, and download states.
- Admin navigation now starts collapsed except for the active section, keeps the InterJudaica brand visible, and gives the AI assistant a clearer command treatment.
- Admin routes no longer inherit the public site header/footer chrome.
- Admin overview now includes operational signals and priority action shortcuts instead of only static record counts.
- A root `DESIGN.md` now documents the existing InterJudaica visual system and admin UI patterns.

## High-impact next improvements

1. Add a file library view under `/admin/courses/[uuid]` showing all classes and materials for a course in one place, with missing-description and empty-class warnings.
2. Add upload progress for large class files by switching the material upload client from `fetch` to `XMLHttpRequest` or a resumable upload strategy.
3. Add student-facing class completion tracking so the dashboard can show progress per purchased course.
4. Add course access diagnostics in admin user detail pages: enrolled courses, payment source, granted-by operator, and last access time.
5. Replace remaining placeholder admin pages for analytics, payments, and subscriptions with live operational views or mark them explicitly as not configured.
6. Add a global admin command palette that reuses `/api/admin/search` and supports quick actions such as “new course”, “grant enrollment”, and “open contact”.
7. Add a moderation queue for forum threads and contact messages, with status, owner, and due-date filters.
8. Add storage cleanup jobs for orphaned upload files in `uploads/classes`, `public/uploads/courses`, `public/uploads/books`, and forum assets.
9. Add audit logging for class material uploads, edits, downloads, and deletes, tied to operator/student UUIDs.
10. Add targeted Playwright coverage for the class material admin flow and enrolled-student download flow.

## UI/UX direction for admin

- Treat the admin as an operational workspace, not a marketing page: dense information, clear hierarchy, quick actions, and fewer decorative sections.
- Keep the left navigation persistent on desktop, collapsed-by-context, and searchable through a command palette.
- Use module dashboards for Courses, Sales, CRM, Email, and Content, each with the same structure: current state, attention-needed items, primary actions, and recent activity.
- Prefer inline editing or dedicated route screens over modals for complex admin work.
- Add empty states that explain the next real action, not generic copy.
- Keep destructive actions explicit, reversible where possible, and paired with visible result state.
