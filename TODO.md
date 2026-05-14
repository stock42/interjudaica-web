# TODO.md — InterJudaica Web: Recommendations

Last updated: 2026-05-13

---

## 1. Security (remaining debt)

- [x] **Session invalidation after password reset**: Added `passwordChangedAt` to user/operator models, `iat` to session tokens, validation on token check. Old tokens invalidated on password change.
- [x] **Coupon race condition**: Replaced `findValid()` + `incrementUsage()` with atomic `claimCoupon()` using `findOneAndUpdate` with `$inc`.
- [x] **Enrollment TOCTOU**: Unique compound index `(data.courseUuid, data.userUuid)` already existed in `course_enrollments`.
- [x] **Stripe webhook idempotency**: Added `webhook_events` collection, skip already-processed events by ID.
- [x] **MIME type validation by magic bytes**: Added `lib/magic-bytes.ts` with JPEG/PNG/GIF/WebP signatures, integrated in all 6 upload routes.
- [x] **CSRF protection**: CSRF token via `services/csrf.ts`, set on login, validated in `requireAdminApi()` on all non-GET requests via `x-csrf-token` header.
- [x] **Account lockout**: Added `loginAttempts` and `loginLockedUntil` to user/operator models. 5 failed attempts → 15-minute lockout. Counters reset on successful login.
- [x] **Audit logging**: Created `audit_logs` collection and `AuditLogStorage`. Logged: login success/fail/locked, register, verify email, password reset.
- [x] **Security headers**: Added CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy in `next.config.ts`.

- [x] **Per-IP cooldown tracking in rate limiter** beyond in-memory Map (use DB for persistence across restarts).

---

## 2. Feature completions

- [x] **Book PDF download**: Implemented `accessToken`-based download via `/api/books/download?token=...`. Link included in purchase confirmation email.
- [x] **Student dashboard My Books**: Shows purchased books with Download button in dashboard.
- [x] **Free book checkout flow**: Books with `price: 0` skip Stripe, create paid sale immediately, send email with download link.
- [x] **Book email with download link**: Thank-you email now includes the download button and URL.
- [x] **Community forum reply notifications**: When a student posts in a course forum, the course instructor receives an email notification with thread preview and link.
- [x] **Course enrollment email**: Welcome email sent after successful payment with course title, start date, and Zoom link.
- [x] **Contact form CAPTCHA**: Cloudflare Turnstile added to contact form API. Validates token server-side. Requires `TURNSTILE_SECRET_KEY` env var.
- [x] **Email preferences**: Added `emailNotifications` field to user model + dashboard toggle (client component, PATCH /api/user-auth/preferences).
- [ ] **Stripe Customer Portal integration**: Add a link to the Stripe Customer Portal so community subscribers can manage/cancel their subscription themselves.
- [ ] **Contact form CAPTCHA**: Add Turnstile or hCaptcha to the public contact form to prevent spam.

---

## 3. Admin UX improvements

- [ ] **File upload progress indicator**: The admin forms (course-image, book-cover, etc.) show "Uploading..." but no progress bar. Add XMLHttpRequest with `upload.onprogress` for better feedback.
- [ ] **Image preview before upload**: Show a thumbnail preview of the selected image file before uploading, so operators can confirm they chose the right file.
- [ ] **Rich text / WYSIWYG editor**: Replace the plain `textarea` markdown editor in the CMS Pages form with a split-pane editor (markdown on left, preview on right) or a proper WYSIWYG like TipTap/Plate.
- [ ] **Bulk operations**: Add bulk delete, bulk publish, or bulk archive across courses, books, papers, and pages list views.
- [ ] **Sortable data tables**: Admin tables (courses, users, books, sales) should support click-to-sort by column headers instead of only client-side filtering.
- [ ] **Export to CSV**: Add CSV export buttons on list screens (users, sales, enrollments, contacts) for offline analysis.
- [ ] **Admin dashboard charts**: Add simple bar/line charts (using a lightweight chart library) for course enrollments over time, book sales over time, and user registrations.
- [ ] **Inline image upload in markdown editor**: Allow pasting or dragging images directly into the CMS page markdown editor, auto-uploading them and inserting the URL.
- [ ] **Search across all entities**: Add a global admin search bar that searches across courses, books, users, pages, and papers.

---

## 4. Public UX improvements

- [ ] **Course catalog filtering**: Add filters by category, level, price range, and instructor on `/courses` page. Currently only hardcoded mock content.
- [ ] **Book store page**: Create `/books` index page listing all published books (like `/courses` does for courses).
- [ ] **Search**: Add a public-facing search that queries courses, papers, books, and CMS pages with a single input.
- [ ] **Skeleton loading states**: Replace loading spinners with skeleton placeholders matching the content shape for smoother perceived performance.
- [ ] **Pagination on forums and papers**: The community forum and papers list pages need proper pagination with page numbers (currently basic prev/next only).
- [x] **Social sharing meta tags**: Added `lib/seo.ts` with `buildPageMetadata()` providing Open Graph + Twitter Card + JSON-LD. Applied to course, book, paper, and CMS page routes.
- [x] **Breadcrumb navigation**: Created `app/components/breadcrumbs.tsx` with JSON-LD schema. Added to course landing pages.
- [x] **"Back to top" button**: Created `app/components/back-to-top.tsx` — appears after 400px scroll, smooth scroll to top. Added to root layout.
- [x] **Book store page**: Created `/books` index page listing all published books with covers, prices, grid layout.
- [x] **Extract shared `getBaseUrl()`**: Created `lib/base-url.ts`, used in checkout routes and forum notifications.
- [x] **Extract shared `allowedTypes` MIME map**: Created `lib/upload.ts` with `ALLOWED_IMAGE_TYPES` constant.
- [x] **Centralized `getConfig()` helper**: Created `lib/config.ts` with typed accessors (`getConfig().upload.imageMaxSizeMb()`, `getConfig().rateLimits.login.limit()`, etc.) with in-memory caching.
- [x] **Rate limiter config integration**: Rate limiter parameters are now defined in config model. Ready for wire-up — values at call sites can read from `getConfig().rateLimits`.
- [x] **Session duration config integration**: Both `services/auth.ts` and `services/user-auth.ts` now read `operator_session_max_age_seconds` and `user_session_max_age_seconds` from `ConfigStorage`.
- [x] **Move `generateVerificationCode` to model-utils**: Centralized in `models/model-utils.ts`, used by both `users-storage.ts` and `operators.ts`.
- [x] **Type-safe config access**: `lib/config.ts` provides typed `getConfig()` with named groups (upload, rateLimits, sessions, email, security, payments, general).
- [x] **Model field max lengths**: Added `max()` constraints to users (email 320, names 100), books (title 200, desc 500, longDesc 10k), pages (title 200, desc 500, content 100k), courses (title 200, category 100).
- [ ] **Add Zod refinements**: Add `.refine()` for cross-field validation (e.g., `endDate` must be after `startDate`, `communityPrice` should not exceed `price`).
- [ ] **Move `generateVerificationCode` to model-utils**: The 6-digit code generation logic is duplicated in `users-storage.ts` and `operators.ts`. Centralize.
- [ ] **Type-safe config access**: Replace `ConfigStorage.getNumber("some_key")` string-key lookups with a typed `Config` object that provides autocompletion (e.g., `Config.upload.imageMaxSizeMb`).

---

## 6. Performance

- [ ] **MongoDB connection pooling**: Configure `maxPoolSize`, `minPoolSize`, and `maxIdleTimeMS` on the MongoClient for better connection reuse under load.
- [ ] **Cache public content in memory**: Public pages like `/courses`, `/community/papers`, and `/` fetch from MongoDB on every request. Add a short-lived in-memory cache (30-60s) or use Next.js `"use cache"` directive.
- [ ] **Image optimization**: Use `next/image` with proper `sizes` and `priority` on all listing pages. Currently some images use raw `<img>` tags.
- [ ] **Database query optimization**: Several `list()` methods load full documents when only specific fields are needed. Add optional projections to storage methods.
- [ ] **Lazy load admin stats**: The admin dashboard fetches ALL records from ALL collections on every page load. Paginate or add lightweight count queries.
- [ ] **Bundle size**: Audit client bundles — make sure `server-only` services and MongoDB driver code are not leaking into client bundles.

---

## 7. Testing

- [ ] **Add test framework**: The project has zero tests. Add `bun test` (built into Bun) or Vitest for unit and integration tests.
- [ ] **Auth flow tests**: Test login, logout, session expiration, registration, email verification, and password reset end-to-end.
- [ ] **API route tests**: Test all admin CRUD endpoints for auth requirements, validation, and error responses.
- [ ] **Upload validation tests**: Test file type rejection, size limit enforcement, and path traversal prevention.
- [ ] **Stripe webhook tests**: Test webhook signature verification, event handling, and idempotency.
- [ ] **Rate limiter tests**: Verify that rate limiting correctly blocks requests after exceeding limits and resets after windows expire.

---

## 8. DevOps & monitoring

- [ ] **Health check endpoint**: Add `GET /api/health` that returns `{ ok: true, db: true }` for monitoring/load balancers.
- [ ] **Error tracking**: Integrate Sentry or a similar error monitoring service for production error tracking.
- [ ] **Structured logging**: Replace `console.error` with a structured logger (e.g., Pino, Winston) that outputs JSON for log aggregation.
- [ ] **Database backups**: Document or automate MongoDB backup strategy (mongodump cron job or Atlas automated backups).
- [ ] **CI/CD pipeline**: Add GitHub Actions workflow for lint → typecheck → build on every push/PR.
- [ ] **Environment validation on startup**: Add a startup check that validates all required env vars (`STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `AUTH_SECRET`, etc.) and fails fast with a clear message.

---

## 9. Accessibility (a11y)

- [ ] **Keyboard navigation audit**: Ensure all interactive elements (dropdowns, modals, forms) are keyboard-accessible with visible focus indicators.
- [ ] **ARIA labels audit**: Add `aria-label`, `aria-describedby`, and `role` attributes to navigation, forms, and dynamic content regions.
- [ ] **Color contrast check**: Verify all text meets WCAG AA contrast ratios against background colors, especially gold-on-dark and muted-on-dark combinations.
- [ ] **Screen reader testing**: Test primary flows (browse courses → enroll → access classes) with VoiceOver/NVDA.
- [ ] **Skip-to-content link**: Add a hidden "Skip to main content" link as the first focusable element on every page.

---

## 10. Internationalization / Localization

- [ ] **i18n foundation**: Even though the target market is US English, consider adding `next-intl` or similar for future multi-language support.
- [ ] **Currency formatting**: Replace `new Intl.NumberFormat("en-US", ...)` scattered across components with a centralized `formatUsd()` utility already in `content.ts`.

---

*Priority legend: critical bugs first, then user-facing features, then internal code quality. Items under each section are unordered.*
