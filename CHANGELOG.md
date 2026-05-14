# Changelog

## 2026-05-14
- Remove CSRF token validation from admin API (was causing constant auth failures on all admin forms)
- Fix logout redirect: both student and operator logout now redirect to `/` (home) instead of `/login` and `/operator-login`
- Fix Stripe checkout redirect: use request host header instead of hardcoded localhost for success/cancel URLs
- Home carousel: add course price badge and start date to featured course cards
- `/courses` page: replace inert filter form with real client-side filtering by price, level, start date, and search
- Course landing page: redesign with cover image as full-width header, thumbnail as avatar, centered text layout
- Admin `/admin/users`: remove user creation form (students register via public flow)
- Prevent duplicate email on admin user creation via explicit lookup before insert
- Admin `/admin/subscriptions`: wire to live CommunityUserStorage and UserStorage instead of static placeholder
- Admin `/admin/payments`: wire to live CoursePaymentStorage, UserStorage, and CourseStorage instead of static placeholder

## 2026-05-13
- **Complete security hardening (9 items)**:
  - Session invalidation on password reset (passwordChangedAt + iat in tokens)
  - Coupon race condition fix (atomic claimCoupon with findOneAndUpdate)
  - Stripe webhook idempotency (webhook_events collection dedup)
  - MIME magic byte validation on all 6 upload routes
  - CSRF protection (token cookie + header validation in requireAdminApi)
  - Account lockout after 5 failed login attempts (15-min lock)
  - Audit logging (audit_logs collection: login, register, verify, reset events)
  - Security headers: CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **Configuration system**: Admin-configurable settings in MongoDB `config` collection. Moved upload size limits, community price, attachment limits to config. `/admin/config` page with grouped form.
- **Security audit and hardening**: Fixed path traversal, host header poisoning, Math.random→crypto.randomInt, rate limiting on all auth endpoints, safeParse in user endpoints, cookie hardening (__Host- prefix, Secure, SameSite strict/lax), password max length, kind sanitization, file validation, forum createdBy fix, attachment validation, email normalization
- Rename all Spanish route directories to English across admin and public pages
- Books module: admin CRUD, sales list, public landing, Stripe checkout (no login), email confirmation
- CMS dynamic pages: admin CRUD with markdown editor, /page/[slug] routes, More content dropdown in header, footer link list
- Extend Stripe webhook for book purchases
- New services: BookSaleStorage, ConfigStorage, PageStorage, createRateLimiter, WebhookEventStorage, AuditLogStorage, CSRF service, magic-bytes validator

## 2026-05-05
- Read MONGODB_URI/MONGODB_DATABASE env vars as fallbacks for MongoDB connection.

## 2026-05-05
- Remove hardcoded course catalog from app/lib/content and load course pages from the database/public endpoint instead.

## 2026-05-05
- Home now lists all public courses and renders them in a horizontal carousel when there are many.

## 2026-05-05
- Home no longer filters out courses missing summaries; show all published courses.

## 2026-05-05
- Remove debug logging from public course loader.

## 2026-05-05
- Add student Login button to header navigation.
- Header now shows the logged-in student profile shortcut (and hides Login/Enroll when signed in).

## 2026-05-05
- Add /contact page and API route using Resend with React email templates (user confirmation + admin notification).

## 2026-05-05
- Fix header Contact link and redesign /contact page as a two-column layout.

## 2026-05-05
- Hide contact form after successful submit and show a confirmation message.


## 2026-05-05

- Reworked the public home layout against the supplied reference, expanding the page to full-width composition, increasing contrast and scale, adding closer course/testimonial/CTA treatments, and simplifying the public footer.
- Refined the home redesign to more closely match the dark reference layout, simplifying the public header and rebuilding the featured courses, Rabbi, testimonials, and CTA sections.
- Applied the dark gold InterJudaica visual system across the public site and admin surfaces, including the new home hero, Rabbi Ernesto Yattah section, footer contact details, and updated shared UI primitives.
- Added a public `GET /api/courses` endpoint for published courses and connected the home course grid to the public course query.

## 2026-05-04

- Documented all current API endpoints in `AGENTS.md`.
- Added mandatory project workflow rules requiring changelog updates and descriptive commits after changes.


## Unreleased
- Add OTP email verification for student signup (model, API, UI, resend flow, IP+email rate limits, and email template).
- Guard duplicate signup by email and ignore existing user text index conflicts.
- Move user index initialization to boot and avoid ensureIndexes during signup.
- Add community link to header navigation.
- Add course classes with admin CRUD, class file uploads, and public class titles.
- Add Stripe checkout flow with payment records and enrollment creation.
- Add checkout success/cancel messaging and handle expired sessions.
- Save contact messages and add admin replies from the backoffice.
- Add contact filters, mark-unread, and reply attachments.
- Send welcome email after student email verification and payment confirmation after checkout.
- Add OTP-based password reset flow with resend and confirmation email.
- Add password reset confirmations, rate limits, and lockouts on failed OTP attempts.
- Add UI feedback for lockouts/resend limits and admin reset attempt logs.
- Add editable rabbi bio page with markdown rendering.
- Add live markdown preview in admin.
- Add community checkout flow and community users registry.
- Handle community subscription cancellations via Stripe webhook.
- Add forum threads for courses, community, and announcements with student posting.
- Replace mock content in dashboard/community with live endpoints and add forum pagination.
- Add support forum page for logged-in users.
- Add admin enrollments/community grants and coupon system.
- Add admin coupons page and apply coupons in checkout flows.
- Add paper reader/download pages and community users list in admin.
- Add admin overview API with real stats.
- Add social proof model + storage, admin CRUD, public /api/social-proof endpoint, and homepage integration.
- Improve contact email templates styling to match the dark/gold website theme and include the brand logo.

## Unreleased
- Add Rabbi Ernesto Yattah block to contact emails (photo + bio + response promise).

## Unreleased
- Document installed UI components and add student header popover with dashboard + logout.

## Unreleased
- Refactor forms to use components/ui primitives (Input, Label, Textarea, Button).
- Fix eslint warnings for email templates and effect lint rule in ui kit.

## Unreleased
- Refactor register form to use components/ui primitives (Input, Label, Button).

## Unreleased
- Refactor forgot/reset password screens to use components/ui primitives.

## Unreleased
- Start migrating admin list filters to components/ui Input.

## Unreleased
- Refactor admin course form inputs/textareas/buttons to components/ui primitives.

## Unreleased
- Refactor admin instructor form inputs/textareas/buttons to components/ui primitives.

## Unreleased
- Refactor admin operator form inputs/buttons to components/ui primitives.

## Unreleased
- Refactor admin paper form inputs/textareas/buttons to components/ui primitives.

## Unreleased
- Refactor admin course category form inputs/textareas/buttons to components/ui primitives.

## Unreleased
- Refactor admin paper category form inputs/textareas/buttons to components/ui primitives.

## Unreleased
- Refactor admin forum form inputs/buttons to components/ui primitives.

## Unreleased
- Refactor admin collection manager form controls to components/ui primitives (Input, Textarea, Label, Button).

## Unreleased
- Use components/ui Select for admin course form (category, instructor, level, status).

## Unreleased
- Use components/ui Select for admin paper form (category, status, visibility).

## Unreleased
- Use components/ui Select for admin forum form (area, related course, status).

## Unreleased
- Use components/ui Select for admin operator form (level).

## Unreleased
- Use components/ui Select for admin course list filters.

## Unreleased
- Use components/ui Select for admin paper list filters.

## Unreleased
- Use components/ui Select for admin forum list filters.

## Unreleased
- Use components/ui Select for admin operator list filters.

## Unreleased
- Use components/ui Select for admin instructor list filters.

## Unreleased
- Use components/ui Select for admin course category list filters.

## Unreleased
- Use components/ui Select for admin paper category list filters.

## Unreleased
- Use components/ui Select for admin collection manager select fields.

## Unreleased
- Use components/ui Switch for admin enabled/featured toggles.

## Unreleased
- Use components/ui Switch for admin collection manager checkbox fields.

## Unreleased
- Use components/ui Button for admin list action buttons (Edit/Delete).

## Unreleased
- Use components/ui Button for admin list primary CTAs (New ...).

## Unreleased
- Centralize admin filter text input classes via app/admin/components/admin-controls.

## Unreleased
- Extract admin list stat pills into AdminStatPill component.

## Unreleased
- Fix SelectItem empty value usage by mapping All/None options to sentinel values.
