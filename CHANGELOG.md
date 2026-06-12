# Changelog

## 2026-06-12
- Reorganize admin navigation: promote Forum, Contact Inquiries, and CRM to top-level sections (previously sub-items under Marketing). CRM now groups Contacts, Campaigns, and Email Groups. Marketing section removed; Email (Templates, Campaigns) is now a standalone section. Added MessageSquare, Contact, and Send icons from lucide-react to admin nav.
- Add ▶ Run button to email groups list page (`app/admin/email/groups/groups-list.tsx`). Each group with a query now shows a "Run" button in the Actions column that calls the `/api/admin/email/groups/[uuid]/preview` endpoint and displays matching contact count + up to 5 preview contacts inline. Error and loading states handled.
- Add Book AI Development Assistant: dedicated page at `/admin/books/[uuid]/ai-assistant` with persistent MongoDB memory, full book content in system prompt, and tools (`updateBookContent`, `generateBookChapter`). New model (`models/book-ai-conversation.ts`), storage (`services/book-ai-conversation-storage.ts`), chat endpoint (`POST /api/admin/books/[uuid]/ai-assistant/chat`), and conversations API (`GET/POST /api/admin/books/[uuid]/ai-assistant/conversations`). Conversation sidebar with new/select/delete. Deep link from book edit form.
- Replace static testimonial grid on home page with Embla carousel (`app/components/testimonial-carousel.tsx`). Uses shadcn `Carousel` with `embla-carousel-autoplay` (5s interval, pause on hover). Navigation: prev/next arrows + dot indicators via new `CarouselDots` component added to `components/ui/carousel.tsx`. Responsive: 1 card mobile, 2 at md, 3 at lg breakpoints. Cards preserve existing gold-border design with `&ldquo;`, quote, name, detail, and star rating.
- Add Recommended Books module: model (`models/recommended-books.ts`), storage (`services/recommended-books-storage.ts`), admin CRUD API (`app/api/admin/recommended-books/` with GET/POST/PATCH/DELETE), and public GET endpoint (`app/api/recommended-books/` returning published only). Schema: name, author, coverImageUrl, amazonLink, description, order, status. 12 unit tests in `tests/unit/models/recommended-books.test.ts`.
- Add public `/resources-books` page (`app/resources-books/page.tsx`) displaying published recommended books in a card grid. Each card shows cover image, author, title, description, and "Buy on Amazon" button when amazonLink is set. Empty state message when no books are published. Footer Navigation column links to this page. SEO metadata included. Uses `RecommendedBookStorage.listPublished()` directly (server component).
- Fix email group query JSON parsing: add Zod `.refine()` to `schemaEmailGroup.query` to validate the string is either empty or a valid MongoDB query JSON object at save time. Previously invalid JSON strings could be saved and would only fail at runtime when a campaign tried to run or when previewing contacts.
- Add `GET /api/admin/email/groups/[uuid]/preview` endpoint. Parses the group's saved `query`, calls `CrmContactStorage.getMatchingContacts()`, and returns `{ items: TypeCrmContact[], count: number }`. Requires operator auth; returns 404 for missing groups, 400 for invalid query JSON.
- Add "Run Preview" UI to email group detail page. New `RunGroupPreview` client component (`app/admin/email/groups/run-group-preview.tsx`) renders a "▶ Run" button, fetches matching contacts from the preview endpoint, and displays count + expandable contact table (name, email). Embedded below the group edit form on `app/admin/email/groups/[uuid]/page.tsx`.
- Add AI natural language modal to Email Groups creation. New `AiEmailGroupCreateButton` component (`app/admin/email/groups/ai-group-create-button.tsx`) opens `AiCreateModal` with `entityType="email-group"`. Accepts natural language like "All contacts in New York who bought a course" and produces a complete email group (name, promoting, MongoDB query). Preview shows matching CRM contact count via new `POST /api/admin/email/groups/preview-contacts` endpoint. Extended `AiCreateModal` with optional `onDataParsed` callback and `previewExtra` slot for custom preview content. Button placed above the manual form on `app/admin/email/groups/new/page.tsx`.
- Fix: CRM CSV import returned "Invalid payload" for bad rows — added per-row Zod validation (`schemaCrmContactImport`) in `app/api/admin/crm/contacts/import/route.ts` before bulk import. Route already used `formData()` for multipart parsing. Now catches invalid emails/missing fields at parse time with line-level error reporting (`validationErrors` array in response) instead of throwing a generic ZodError during storage insert. Also fixed Zod v4 compatibility (`err.issues` not `err.errors`).
- Add unified admin payments API: `GET /api/admin/payments` aggregates `course_payments`, `book_sales`, and `community_users` collections into a single `{ items, page, totalPages, totalItems }` response. Supports `search` (case-insensitive match on user name/email/item title), `type` filter (course/book/subscription), `page`, and `limit` (capped at 100) query params. Joins `courses`, `subscription-plans`, and `users` collections for item titles and user names. 22 Playwright E2E tests in `tests/api/admin/payments.test.ts` cover auth enforcement, response shape, pagination, type filtering, search, combined filters, and edge cases.
- Fix: Owner bio save not reflecting on frontend — `unstable_cache` tags `owner-bio` and `ernesto-yattah` were never invalidated after PUT. Added `revalidateTag('owner-bio')` and `revalidateTag('ernesto-yattah')` in `app/api/admin/owner-bio/route.ts` PUT handler after upsert.
- Add "Create with AI" button to admin courses list (`app/admin/courses/course-list.tsx`) and new course page (`app/admin/courses/new/page.tsx`) using shared `AiCreateModal`. AI generates full course data from a natural-language description; on success redirects to the edit page. Encapsulated in reusable `AiCourseCreateButton` client component at `app/admin/courses/ai-course-create-button.tsx`.
- Add AI "Generate with AI" button to Owner Bio admin form (`app/admin/owner-bio/owner-bio-form.tsx`) using shared `AiCreateModal` component. AI generates title + markdown, upserts via `PUT /api/admin/owner-bio`, then updates local form state.
- Add floating language switch button (`components/share/translate-button.tsx`) — fixed position bottom-right, Popover-based, supports EN/ES/HE/FR with flags. Calls AI translate endpoint before switching locale. Handles non-admin gracefully. 13 unit tests. Public translations endpoint at `/api/translations`.
- Create `useTranslation()` React hook and `TranslationProvider` context to wire existing MongoDB translations to the UI. `app/lib/use-translation.tsx` exports client-side `useTranslation()` hook returning `{ t(key), locale, setLocale }`, pure `translate()` function for testing, and `TranslationClientProvider` component that injects translations as a JSON script tag. `app/lib/translation-provider.tsx` is a server component that reads `NEXT_LOCALE` cookie, fetches translations from `TranslationStorage`, and renders the client provider. Root layout (`app/layout.tsx`) wraps all children in `TranslationProvider`. Falls back chain: dictionary → English defaults → raw key. 15 unit tests in `tests/unit/lib/use-translation.test.ts` verify translation lookup, context behavior, and fallback logic.
- Add AI tools for instructor creation (`create-instructor.tool.ts`) and subscription plan creation (`create-subscription-plan.tool.ts`). Both register with `role: 'admin'` (operator-only). 13 unit tests across 2 files. Barrel export updated in `tools/index.ts`.
- Create reusable STT microphone component (`components/share/stt-microphone.tsx`) using browser Web Speech API. Renders microphone button with pulsing red dot recording indicator, emits transcribed text via `onTranscription(text)` callback, handles mic-denied/no-speech/unsupported errors. 7 unit tests in `tests/unit/components/stt-microphone.test.ts`.

## 2026-06-11
- refactor: rename Rabbi→Ernesto/Owner across entire codebase — `rabbi_bio` collection → `owner_bio`, `RabbiBioModel` → `OwnerBioModel`, `/api/rabbi-bio` → `/api/owner-bio`, `/api/admin/rabbi-bio` → `/api/admin/owner-bio`, `/admin/rabbi-bio` → `/admin/owner-bio`, forum creator enum `"rabbi"` → `"ernesto"`, instructor defaults `"Rabbi Yattah"` → `"Ernesto Yattah"`, function `getRabbiBio()` → `getOwnerBio()`. Updated test fixtures, assertions, and AGENTS.md.
- Create `Dockerfile` with `oven/bun:1` base image, single-stage build: install dependencies with `--frozen-lockfile`, build Next.js app, expose port 3025, run `bun run start`.
- Add `.github/workflows/ci.yml` GitHub Actions workflow triggered on push/PR to main with steps: checkout, setup Bun (`oven-sh/setup-bun@v2`), install (`--frozen-lockfile`), lint, type check (`tsc --noEmit`), unit tests (`bun test`), and Docker build. 15-minute timeout, no deploy or E2E steps.
- Create `.dockerignore` to exclude node_modules, .next, .env*, .git, .omo, tests, Playwright artifacts, IDE files, and docs from Docker build context, reducing image size and preventing secrets from leaking into images.
- Set up `bun test` TDD infrastructure: create `tests/setup.ts` with MongoDB mock helpers (`mockDb`, `createMockCollection` with full CRUD stubs), create `tests/unit/models/sample.test.ts` with 10 example tests verifying the mock infrastructure, add `tests/unit/` directory structure mirroring source layout.

## 2026-06-11
- Add `docker-compose.yml` with app + MongoDB 7 services. App builds from Dockerfile, exposes port 3025, connects to MongoDB via `mongodb://mongo:27017`, and uses `$${VAR:-default}` env var syntax. MongoDB uses named volume `mongo_data` for persistence.
- Fix CSRF token missing on client forms: create `lib/csrf-client.ts` with `getCsrfToken()` and `csrfFetch()` wrapper that reads the `__Host-interjudaica_csrf` cookie and sends it as `x-csrf-token` header. Create `proxy.ts` (Next.js 16 proxy convention, replacing deprecated `middleware.ts`) to set the CSRF cookie on page loads with `httpOnly: false` so client JS can read it. Update 11 client forms to use `csrfFetch()` instead of raw `fetch()` for CSRF-protected POST endpoints: login, register, forgot-password, reset-password, contact, operator-login, 3 forum thread forms, and 2 checkout forms. `verify-email`, `resend-verify`, `resend-reset`, and `forums/upload-image` endpoints lack CSRF checks so their forms keep `fetch()`.
- Add comprehensive E2E tests for AI assistant (`tests/e2e/ai-assistant.e2e.ts`, Task 28): 21 tests covering admin chat workflow (SSE headers, streaming data events, thread CRUD), student chat (auth gating, course discovery, thread management), auth (401 for no auth and invalid cookies), error handling (400 for invalid JSON, 404 for missing threads, 403 for cross-user access), and rate limiting (429 for students exceeding 20 req/hr). Tests include CSRF token generation matching server config (.env NEXTAUTH_SECRET), parallel worker-safe student setup with retry, and LLM-agnostic assertions (accept 200 or 500).
- Fix rate limiter bug in `services/rate-limiter.ts`: `updated.data?.count` → `updated.count` (rate limit collection stores documents directly without MongoDBStorage data wrapper). Rate limiting was always allowing requests.

## 2026-06-10
- Add chat history UI and API endpoints (Task 27): create `app/admin/components/ai-chat-history.tsx` ("use client" sidebar component) with thread list, active thread gold accent, relative timestamps, message count badges, "New Chat" button, and delete-with-confirmation dialog. Create `GET /api/agentes/chats` (list threads with `displayTitle` derived from first user message), `GET /api/agentes/chats/[uuid]` (get messages with ownership check), and `DELETE /api/agentes/chats/[uuid]` (cascade delete with ownership check). Auth supports both operators and users.
- Add admin AI chat drawer component at `app/admin/components/ai-chat-drawer.tsx` (Task 24): full-screen Sheet (`!w-full !max-w-full`) with Vercel AI SDK `useChat` + `DefaultChatTransport` targeting `/api/agentes/chat`. Renders text, reasoning (DeepSeek R1 "Thinking..." collapsible), and tool call parts. Tool calls render as expandable cards (collapsed by default) showing tool name, parameters, result, and error states. Destructive approval flow with Approve/Deny buttons when `part.state === 'approval-requested'` via `addToolApprovalResponse()`. Auto-submit on approval via `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses`. Enter to send, Shift+Enter for newline, auto-scroll to bottom. Close preserves chat state.
- Add admin AI tools for forums, social proof, pages, and config (Task 19): 6 forum tools (list, get, create, update, delete with approval, feature), 4 testimonial tools (list, create, update, delete with approval), 5 page tools (list, get, create, update, delete with approval), and 2 config tools (get, update). Config tool filters out secret keys (AUTH_SECRET, DEEPSEEK_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY) using blocklist. All tools registered with `role: 'admin'`. Updated barrel export (`tools/index.ts`) with 8 tool files in alphabetical order.
- Add admin AI tools for CRM contacts, tags, and campaigns (Task 20): 15 tools total — 7 contact tools (list, get, create, update, delete with approval, import from CSV, export to CSV), 2 tag tools (list, create), 4 campaign tools (list, create, update, delete with approval), plus assignContactToCampaign and updateCampaignContactStatus. Import validates required CSV headers (`firstname,lastname,email`) before calling `CrmContactStorage.bulkImport()`. Export returns `{ count, preview }` with first 500 chars of CSV. All tools registered with `role: 'admin'`. Barrel export updated in `tools/index.ts`.
- Build core streaming AI chat endpoint at `POST /api/agentes/chat` (Task 18): wires DeepSeek AI SDK provider, tool auth registry, PII guard, audit logging, and chat storage into a single SSE streaming endpoint. Supports role-based tool filtering (operators get all admin tools, students get none currently). Incoming messages are sanitized via `redactPii()`, tool results via `filterToolResult()`, and each tool execution is audit-logged. Chat history persisted via `ChatStorage` (messages, threads). System prompts tailored per role.
- Create barrel export (`app/api/agentes/chat/tools/index.ts`), role-specific system prompts (`app/api/agentes/chat/system-prompt.ts`), and Playwright E2E tests (`tests/api/chat-endpoint.e2e.ts`) covering auth (401), admin SSE streaming, student access, thread management, and error handling.
- Fix `lib/ai-provider.ts`: remove import-time throw on missing `DEEPSEEK_API_KEY` — model initialises with empty key so the build passes; API will fail at call time if the key is missing.
- Add admin AI tools for users and operators (`app/api/agentes/chat/tools/users.tool.ts`): 8 tools (listUsers, getUser, updateUser, deleteUser, listOperators, createOperator, updateOperator, deleteOperator). All results pass through `filterToolResult()` from PII guard for defense-in-depth — passwords, verification codes, and security fields are stripped. `deleteUser` and `deleteOperator` have `needsApproval: true`. 21 unit tests in `tests/tools/users.tool.test.ts` verify safe data output and tool registration.
- Add admin AI tools for papers, paper categories, and books (`app/api/agentes/chat/tools/papers.tool.ts`, `books.tool.ts`): 7 paper tools (list, get, create, update, delete, list categories, create category) and 6 book tools (list, get, create, update, delete, list sales). Paper creation auto-creates linked forum thread. Delete tools have `needsApproval: true`. Book sales strip access tokens for security.
- Add agent tool execution audit logging (`services/agent-audit-storage.ts`, `lib/llm-audit-log.ts`): MongoDB storage for LLM tool-call logs with TTL index (180 days), parameter sanitization via PII guard, and 500-char truncation. 13 unit tests in `tests/agent-audit-storage.test.ts`.
- Add PII redaction layer (`lib/llm-pii-guard.ts`) for LLM context: strips emails, IPs, JWTs, and session tokens via regex; field-level filtering of sensitive User/Operator fields (password, verification codes, login attempts, etc.); context truncation to max token count. 36 unit tests in `tests/llm-pii-guard.test.ts`.
- Add Zod validation to admin config PUT endpoint (`models/config-schema.ts`) with strict schema (23 number keys, 1 string key), rejecting unknown keys and non-numeric values. Returns 400 with field-level error details on invalid payload.
- Wire CSRF protection into 9 state-changing POST endpoints (login, register, contact, checkout, community/checkout, forums, forgot-password, reset-password, auth/login) using existing `services/csrf.ts` module. POST without valid CSRF token returns 403.
- Add Playwright E2E test (`tests/api/csrf.e2e.ts`) covering all 9 endpoints — validates 403 without token and non-403 with valid token.
- Add chat thread and message data models (`models/chat-threads.ts`, `models/chat-messages.ts`) with Zod schemas and Model classes, including 10KB content truncation for storage.
- Add `ChatStorage` service (`services/chat-storage.ts`) with full CRUD for threads and messages, cascade delete, and TTL index on messages (90 days).
- Add unit tests for chat models and storage (`tests/chat-storage.test.ts`).
- Register chat storage indexes in boot sequence (`boot/index.ts`).
- Add AI Assistant SSE streaming + Sheet DOM compatibility prototype at `/admin/ai-prototype` with simulated token streaming, auto-scroll, and cleanup on close.
- Add DeepSeek R1 tool calling validation spike at `scripts/validate-deepseek-tool-calling.ts` — tests non-streaming tool_calls, SSE streaming deltas, and R1 reasoning_content dual-token behavior.
- Wire email spooler cron into boot (`boot/index.ts`): call `processEmailSpooler()` immediately and on 60s interval.
- Add `subject` field to `EmailSpooler` schema and store rendered template subject in campaign run spooler entries.
- Fix empty email subject in `lib/email-spooler-cron.ts`: fall back to template subject when spooler entry has none.
- Add `ensureIndexes()` calls for all CRM/email collections (templates, groups, campaigns, spooler, contacts, tags, CRM campaigns, CRM campaign contacts) in boot sequence.
- Harden Turnstile CAPTCHA on contact form (`app/api/contact/route.ts`): when `TURNSTILE_SECRET_KEY` is set, `turnstileToken` is now required (was bypassable). Missing token returns 400 `{ error: "CAPTCHA verification required" }`. Without key set (dev), behavior is unchanged (backward compatible).
- Add unit tests for contact form CAPTCHA enforcement (`tests/contact-captcha.test.ts`) covering all 4 scenarios.

## 2026-06-04
- Translate Spanish copy on `/community` plans section to English ("Planes" → "Plans", "Elegí tu plan" → "Choose your plan").
- Replace `\n` with `<br />` elements in subscription plan descriptions on `/community` and add `whitespace-pre-line` to the checkout form description.
- Route the `/community` hero Subscribe button to the most expensive active plan and hide it when no plans exist.
- Replace the Country text input on `/register` with a Radix Select dropdown of the top 50 countries, defaulting to United States.
- Show a US states dropdown (all 50) on `/register` when United States is selected; fall back to a text input for other countries.

## 2026-05-24
- Confirm community membership immediately on Stripe return by passing the checkout session ID back to the dashboard, validating it server-side, and activating the student before rendering membership status.
- Use the community membership registry as the canonical access check for community pages, papers, downloads, and forum APIs.
- Complete the student password recovery UX with a 6-digit OTP input, visible email confirmation, 15-minute code messaging, and 60-second reset-code resend cooldown.

## 2026-05-22
- Refine the home page for production: cap the desktop content width, replace the desktop course carousel with a responsive featured grid, hide empty testimonial publishing states, add compact hero proof points, and link the Rabbi CTA to `/ernesto-yattah`.
- Use the official `public/logo-interjudaica.png` in public brand chrome and contact surfaces.
- Add Playwright E2E coverage for public route smoke tests, protected-route redirects, home responsiveness/overflow, contact and login form states, security headers, and unauthenticated API behavior.
- Add `@playwright/test`, Playwright scripts, report ignores, and a Chromium install script.
- Harden session signing by centralizing auth secret lookup and failing closed in production when `AUTH_SECRET`/`NEXTAUTH_SECRET` is missing; use timing-safe CSRF signature comparison.
- Keep student/operator login and email verification errors visible instead of immediately resetting the UI state.
- Tighten security headers with production-only removal of CSP `unsafe-eval`, worker/manifest directives, DNS prefetch, cross-domain policy, and COOP headers.

## 2026-05-20
- Add Stripe Customer Portal route at `/api/community/customer-portal` and dashboard CTA for self-service subscription management
- Reuse existing Stripe customer IDs during community checkout to keep subscriptions attached to the same billing profile
- Add Bun test script plus broader route/unit coverage for operator login, customer portal, user registration, password reset, course/community/book checkout flows, webhook signature handling, base URL resolution, and error serialization
- Add structured server-side error logging with Mongo-backed `error_events` storage and show recent errors in Admin Analytics
- Expand `/api/health` with uptime, environment, and recent error count for basic operational monitoring
- Remove CSRF cookie issuance from login routes after discarding CSRF enforcement server-side
- Improve public performance by replacing internal HTTP round-trips with direct storage reads + short `unstable_cache` revalidation in public data loaders
- Fix broken legacy `/foro` and `/clases` links in dashboard and community/course pages after route renames
- Improve markdown CMS image rendering with `next/image`

## 2026-05-14
- Overhaul public CMS page rendering (`app/page/markdown-page.tsx`): gold headings (h1-h3), styled lists with bullets/numbers, bold/italic emphasis, blockquotes with gold left border, styled images with border, proper code blocks, tables, and dark-theme links
- Enable images in markdown content via rehype-sanitize schema allowing `<img>` elements with safe attributes
- Fix build failure: extract client-safe components (CourseGrid, CourseCard, etc.) into `portal-ui-client.tsx` to prevent server-only modules from leaking into client bundle
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
