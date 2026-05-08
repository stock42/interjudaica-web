# AGENTS.md

## Project Snapshot

InterJudaica Web is a Bun-first Next.js 16 App Router application for English-language Jewish courses, community membership, papers, forums, and a backoffice. The target market is the United States, so user-facing product copy should stay in English and prices should be expressed in USD.

Core stack:

- Bun, Next.js 16, React 19, TypeScript, Tailwind CSS v4
- MongoDB native driver only
- Zod for schema validation
- Stripe payment links are stored manually for now, not integrated through a Stripe SDK flow

Important Next.js note: this repo uses modern Next.js 16 behavior. Do not rely on older App Router assumptions from memory. Check the local code first, and when framework behavior is unclear, inspect the installed Next.js docs in `node_modules/next/dist/docs/` or current official docs before changing code.

The high-signal product brief is `promptings/INITIAL.md`. The root `README.md` is still Bun init boilerplate and should not be treated as current product documentation.

## Commands

Use Bun for package and script execution.

- Install: `bun install`
- Dev server: `bun run dev`
- Production build: `bun run build`
- Production start: `bun run start` (runs `next start` on `PORT=3025`)
- Lint: `bun run lint`
- Type check when needed: `bun run tsc --noEmit`

There are currently no test files or test script. For non-trivial code changes, run at least `bun run lint` and the most targeted available build/type check.

## Environment

No `.env*` file is committed, and `.env*` is ignored.

The code currently reads:

- `MONGODB_URL`, falling back to `MONGODB_URI`, then `MONGO_URI`, then `mongodb://localhost:27017`
- `MONGODB_NAME`, falling back to `MONGODB_DATABASE`, then `MONGO_DB`, then `interjudaica`
- `AUTH_SECRET`, falling back to `NEXTAUTH_SECRET`, then a local development secret
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `VERIFY_RESEND_COOLDOWN_SECONDS` (default 30)
- `VERIFY_RESEND_WINDOW_SECONDS` (default 600)
- `VERIFY_RESEND_LIMIT` (default 3)
- `NEXT_PUBLIC_VERIFY_RESEND_COOLDOWN_SECONDS` (default 30)
- `RESET_RESEND_COOLDOWN_SECONDS` (default 30)
- `RESET_RESEND_WINDOW_SECONDS` (default 600)
- `RESET_RESEND_LIMIT` (default 5)
- `NEXT_PUBLIC_RESET_RESEND_COOLDOWN_SECONDS` (default 30)
- `RESET_ATTEMPT_LIMIT` (default 5)
- `RESET_ATTEMPT_WINDOW_SECONDS` (default 900)
- `RESET_ATTEMPT_LOCK_SECONDS` (default 900)

## Product Rules

- Keep public/student-facing copy in English.
- Keep prices in USD and preserve the `$19 USD/month` community subscription concept.
- Preserve the product identity as InterJudaica.
- Use `public/logo-interjudaica.png` for the brand logo.
- Keep the visual direction modern, clean, usable, and accessible.
- Avoid exposing technical terms like payload, schema, endpoint, or database in user-facing copy unless the screen is explicitly admin/technical.

## App Structure

- `app/` contains App Router routes, pages, layouts, route handlers, shared UI, and static content.
- `app/lib/content.ts` contains the current public mock content for courses, papers, testimonials, dashboard, and forum previews.
- `app/components/portal-ui.tsx` contains shared public and admin UI primitives such as `SiteHeader`, `SiteFooter`, `PageShell`, `Section`, `ButtonLink`, `AdminShell`, `AdminStatGrid`, and `DataTable`.
- `models/` contains Zod schemas plus model classes that normalize data, generate UUIDs, slugify titles/names, hash passwords, and hide sensitive fields.
- `services/` contains server-only MongoDB connection, storage helpers, auth/session helpers, and per-collection CRUD storage.
- `app/api/**/route.ts` contains App Router route handlers. Do not add `pages/api`; this app is App Router.
- `public/uploads/**` stores uploaded images written by admin upload routes.

Use the `@/*` import alias for project-root imports.

## Data Model and Storage

All persisted collection records use `MongoDBStorage` and are wrapped like this:

```ts
{
	uuid: string,
	data: TData,
	_added: Date,
	_updated?: Date,
	_v: number,
	_n: number,
}
```

Collection names currently in use:

- `courses`
- `course_categories`
- `course_classes`
- `course_class_files`
- `course_enrollments`
- `course_payments`
- `contacts`
- `password_reset_attempts`
- `rabbi_bio`
- `instructors`
- `papers`
- `paper_categories`
- `forum_threads`
- `social_proof`
- `users`
- `operators`

Use the native MongoDB driver through `services/mongodb.ts` and `services/MongoDBStorage.ts`. Do not add Mongoose.

All request validation and model validation should go through Zod schemas in `models/`. Keep normalization there when possible:

- `CourseModel`, `PaperModel`, `ForumThreadModel`, and category/instructor models generate slugs.
- `UserModel` and `OperatorModel` hash and verify passwords using scrypt.
- Safe user/operator data must omit password and verification fields.

## Auth and Security

There are two separate session systems:

- Student/user auth in `services/user-auth.ts`
  - Cookie: `interjudaica_user_session`
  - Session length: 30 days
  - APIs: `/api/user-auth/login`, `/api/user-auth/register`, `/api/user-auth/logout`, `/api/user-auth/me`
- Operator/admin auth in `services/auth.ts`
  - Cookie: `interjudaica_operator_session`
  - Session length: 8 hours
  - APIs: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`

Sessions are HMAC-signed with `AUTH_SECRET` or `NEXTAUTH_SECRET`. Do not weaken cookie settings. Admin pages are protected by `app/admin/layout.tsx` through `requireOperator()`.

Admin API routes must call `requireAdminApi(request)` before reading or mutating data. Preserve the current error contract from `app/api/_lib/admin-api.ts`:

- `401` with `{ error: "Unauthorized" }`
- `400` for invalid JSON or Zod validation issues
- `409` for duplicate MongoDB key errors
- `500` for unexpected server errors

`OperatorStorage.ensureDefaultOperator()` creates a default local operator when the operators collection is empty. Treat that as a bootstrap convenience, and do not surface credentials in public UI.

## API Patterns

Admin CRUD endpoints follow this shape:

- Collection route: `GET` returns `{ items }`; `POST` validates with the entity schema and returns `{ item }` with status `201`.
- Item route: `GET` returns `{ item }`; `PATCH` validates a partial/update schema and returns `{ item }`; `DELETE` returns `{ deleted: true }`.
- Missing records return `{ error: "Not found" }` with status `404`.
- All implemented admin APIs export `runtime = "nodejs"`.

For new entities, follow the existing model/storage/API layering:

1. Add or update the Zod schema and model class in `models/`.
2. Add a `server-only` storage class in `services/` with collection name, indexes, list/get/create/update/delete methods.
3. Add App Router route handlers under `app/api/admin/...`.
4. Add admin pages or forms using existing `AdminShell` patterns.

Upload routes currently write validated image files under `public/uploads/courses` or `public/uploads/instructors`. They allow JPG, PNG, WEBP, and GIF up to 5 MB and require admin auth.

## Current Endpoints

This inventory must be updated whenever an API route is added, removed, renamed, or changes method support.

Student/user auth endpoints:

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/user-auth/register` | Registers a student and sends verification email. |
| `POST` | `/api/user-auth/login` | Authenticates a student user, sets `interjudaica_user_session`, returns `{ user }`. |
| `POST` | `/api/user-auth/logout` | Clears `interjudaica_user_session` and redirects to `/login`. |
| `GET` | `/api/user-auth/me` | Returns current student user or `401` with `{ user: null }`. |
| `POST` | `/api/user-auth/verify` | Verifies email with a 6-digit code, activates the user, and sends a welcome email. |
| `POST` | `/api/user-auth/resend-verify` | Resends the 6-digit verification code email. |
| `POST` | `/api/user-auth/forgot-password` | Sends a 6-digit password reset code email. |
| `POST` | `/api/user-auth/resend-reset` | Resends a password reset code email. |
| `POST` | `/api/user-auth/reset-password` | Resets a password with email + code. |

Operator/auth endpoints:

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Authenticates an operator, sets `interjudaica_operator_session`, returns `{ operator }`. |
| `POST` | `/api/auth/logout` | Clears `interjudaica_operator_session` and redirects to `/operator-login`. |
| `GET` | `/api/auth/me` | Returns current operator or `401` with `{ operator: null }`. |

Public content endpoints:

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/courses` | Lists published public courses as `{ items }`. |
| `GET` | `/api/courses/[slug]/classes` | Lists classes for a published course as `{ items }`. |
| `GET` | `/api/courses/classes/files/[fileUuid]` | Downloads a class file for enrolled students. |
| `POST` | `/api/checkout` | Creates a Stripe checkout session for a course. |
| `POST` | `/api/stripe/webhook` | Handles Stripe webhook events and enrolls students. |
| `POST` | `/api/contact` | Saves a contact message and sends emails. |
| `GET` | `/api/rabbi-bio` | Returns the public rabbi bio. |
| `GET` | `/api/social-proof` | Lists published testimonials as `{ items }`. |

Admin utility endpoints:

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/admin/overview` | Requires operator auth; returns dashboard stat objects. |
| `POST` | `/api/admin/uploads/course-image` | Requires operator auth; accepts `multipart/form-data` with `file` and optional `kind`; returns `{ url }`. |
| `POST` | `/api/admin/uploads/class-image` | Requires operator auth; accepts `multipart/form-data` with `file`; returns `{ url }`. |
| `GET` | `/api/admin/contacts` | Lists contact messages as `{ items }`. |
| `GET` | `/api/admin/contacts/[uuid]` | Gets a contact message by UUID. |
| `POST` | `/api/admin/contacts/[uuid]/reply` | Sends a reply email (supports attachments) and marks as replied. |
| `POST` | `/api/admin/contacts/[uuid]/mark-unread` | Marks a contact as new. |
| `GET` | `/api/admin/password-resets` | Lists password reset attempts as `{ items }`. |
| `GET` | `/api/admin/rabbi-bio` | Returns the current rabbi bio. |
| `PUT` | `/api/admin/rabbi-bio` | Updates the rabbi bio content. |
| `POST` | `/api/admin/uploads/instructor-photo` | Requires operator auth; accepts `multipart/form-data` with `file`; returns `{ url }`. |

Admin CRUD endpoints, all requiring operator auth:

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/admin/course-categories` | Lists course categories as `{ items }`. |
| `POST` | `/api/admin/course-categories` | Creates a course category and returns `{ item }`. |
| `GET` | `/api/admin/classes` | Lists course classes by `courseUuid` as `{ items }`. |
| `POST` | `/api/admin/classes` | Creates a course class and returns `{ item }`. |
| `GET` | `/api/admin/classes/[uuid]` | Gets one course class by UUID. |
| `PATCH` | `/api/admin/classes/[uuid]` | Updates one course class by UUID. |
| `DELETE` | `/api/admin/classes/[uuid]` | Deletes one course class by UUID. |
| `GET` | `/api/admin/classes/[uuid]/files` | Lists files for a class as `{ items }`. |
| `POST` | `/api/admin/classes/[uuid]/files` | Uploads a file for a class and returns `{ item }`. |
| `DELETE` | `/api/admin/classes/[uuid]/files/[fileUuid]` | Deletes a class file by UUID. |
| `GET` | `/api/admin/course-categories/[uuid]` | Gets one course category by UUID. |
| `PATCH` | `/api/admin/course-categories/[uuid]` | Updates one course category by UUID. |
| `DELETE` | `/api/admin/course-categories/[uuid]` | Deletes one course category by UUID. |
| `GET` | `/api/admin/courses` | Lists courses as `{ items }`. |
| `POST` | `/api/admin/courses` | Creates a course and returns `{ item }`. |
| `GET` | `/api/admin/courses/[uuid]` | Gets one course by UUID. |
| `PATCH` | `/api/admin/courses/[uuid]` | Updates one course by UUID. |
| `DELETE` | `/api/admin/courses/[uuid]` | Deletes one course by UUID. |
| `GET` | `/api/admin/forums` | Lists forum threads as `{ items }`. |
| `POST` | `/api/admin/forums` | Creates a forum thread and returns `{ item }`. |
| `GET` | `/api/admin/forums/[uuid]` | Gets one forum thread by UUID. |
| `PATCH` | `/api/admin/forums/[uuid]` | Updates one forum thread by UUID. |
| `DELETE` | `/api/admin/forums/[uuid]` | Deletes one forum thread by UUID. |
| `GET` | `/api/admin/instructors` | Lists instructors as `{ items }`. |
| `POST` | `/api/admin/instructors` | Creates an instructor and returns `{ item }`. |
| `GET` | `/api/admin/instructors/[uuid]` | Gets one instructor by UUID. |
| `PATCH` | `/api/admin/instructors/[uuid]` | Updates one instructor by UUID. |
| `DELETE` | `/api/admin/instructors/[uuid]` | Deletes one instructor by UUID. |
| `GET` | `/api/admin/operators` | Lists operators as `{ items }`, without password fields. |
| `POST` | `/api/admin/operators` | Creates an operator and returns `{ item }`. |
| `GET` | `/api/admin/operators/[uuid]` | Gets one operator by UUID, without password fields. |
| `PATCH` | `/api/admin/operators/[uuid]` | Updates one operator by UUID. |
| `DELETE` | `/api/admin/operators/[uuid]` | Deletes one operator by UUID. |
| `GET` | `/api/admin/paper-categories` | Lists paper categories as `{ items }`. |
| `POST` | `/api/admin/paper-categories` | Creates a paper category and returns `{ item }`. |
| `GET` | `/api/admin/paper-categories/[uuid]` | Gets one paper category by UUID. |
| `PATCH` | `/api/admin/paper-categories/[uuid]` | Updates one paper category by UUID. |
| `DELETE` | `/api/admin/paper-categories/[uuid]` | Deletes one paper category by UUID. |
| `GET` | `/api/admin/papers` | Lists papers as `{ items }`. |
| `POST` | `/api/admin/papers` | Creates a paper and returns `{ item }`. |
| `GET` | `/api/admin/papers/[uuid]` | Gets one paper by UUID. |
| `PATCH` | `/api/admin/papers/[uuid]` | Updates one paper by UUID. |
| `DELETE` | `/api/admin/papers/[uuid]` | Deletes one paper by UUID. |
| `GET` | `/api/admin/social-proof` | Lists testimonials as `{ items }`. |
| `POST` | `/api/admin/social-proof` | Creates a testimonial and returns `{ item }`. |
| `GET` | `/api/admin/social-proof/[uuid]` | Gets one testimonial by UUID. |
| `PATCH` | `/api/admin/social-proof/[uuid]` | Updates one testimonial by UUID. |
| `DELETE` | `/api/admin/social-proof/[uuid]` | Deletes one testimonial by UUID. |
| `GET` | `/api/admin/users` | Lists users as `{ items }`, without password fields. |
| `POST` | `/api/admin/users` | Creates a user and returns `{ item }`, without password fields. |
| `GET` | `/api/admin/users/[uuid]` | Gets one user by UUID, without password fields. |
| `PATCH` | `/api/admin/users/[uuid]` | Updates one user by UUID. |
| `DELETE` | `/api/admin/users/[uuid]` | Deletes one user by UUID. |

## Components (installed UI kit)

This repo includes a pre-installed UI component kit under `./components/ui/*`.

**Rule:** Always prefer these components first. Only create a new component when it does not exist in the list below, and when creating new shared components place them under `./components/share/*`.

Available components (`components/ui`):
- accordion
- alert-dialog
- alert
- avatar
- badge
- breadcrumb
- button-group
- button
- calendar
- card
- carousel
- collapsible
- combobox
- command
- context-menu
- dialog
- drawer
- dropdown-menu
- empty
- field
- hover-card
- input-group
- input-otp
- input
- item
- kbd
- label
- menubar
- navigation-menu
- pagination
- popover
- progress
- radio-group
- resizable
- scroll-area
- select
- separator
- sheet
- sidebar
- skeleton
- slider
- sonner
- spinner
- switch
- table
- tabs
- textarea
- toggle-group
- toggle
- tooltip

## Frontend Rules

Public pages mostly use static content from `app/lib/content.ts`; admin pages read MongoDB through storage services.

Shared style conventions:

- Tailwind v4 utilities and CSS variables from `app/globals.css`.
- Reuse `portal-ui.tsx` primitives before introducing new page-local chrome.
- Keep cards at `rounded-lg` or less.
- Use responsive grids and `overflow-x-auto` for admin tables.
- Keep text inside controls from overflowing on mobile.
- Keep the existing restrained palette based on `--paper`, `--ink`, `--muted`, `--line`, `--sapphire`, `--jade`, `--sumac`, and `--gold`.

Public route map:

- `/`
- `/cursos`
- `/curso/[slug]`
- `/curso/[slug]/clases`
- `/curso/[slug]/foro`
- `/comunidad`
- `/comunidad/papers`
- `/comunidad/foro`
- `/dashboard`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/reset-password/[token]` (redirects)
- `/ernesto-yattah`
- `/verify-email`
- `/operator-login`

Admin route map:

- `/admin`
- `/admin/usuarios`
- `/admin/operators`, `/admin/operators/new`, `/admin/operators/[uuid]`
- `/admin/cursos`, `/admin/cursos/new`, `/admin/cursos/[uuid]`
- `/admin/classes/[courseUuid]`, `/admin/classes/[courseUuid]/new`, `/admin/classes/[courseUuid]/edit/[classUuid]`
- `/admin/contacts`, `/admin/contacts/[uuid]`
- `/admin/password-resets`
- `/admin/rabbi-bio`
- `/admin/course-categories`, `/admin/course-categories/new`, `/admin/course-categories/[uuid]`
- `/admin/instructors`, `/admin/instructors/new`, `/admin/instructors/[uuid]`
- `/admin/papers`, `/admin/papers/new`, `/admin/papers/[uuid]`
- `/admin/paper-categories`, `/admin/paper-categories/new`, `/admin/paper-categories/[uuid]`
- `/admin/foro`, `/admin/foro/new`, `/admin/foro/[uuid]`
- `/admin/social-proof`, `/admin/social-proof/new`, `/admin/social-proof/[uuid]`
- `/admin/suscripciones`
- `/admin/pagos`
- `/admin/analytics`

Some public and admin pages are still static placeholders, especially password recovery, email verification, payments, subscriptions, analytics, and parts of the student dashboard/forum. Do not describe them as fully integrated unless you implement the backing flow.

## Admin UI Patterns

Prefer dedicated route-level screens for create/edit flows, matching existing modules:

- `app/admin/cursos/course-form.tsx`
- `app/admin/instructors/instructor-form.tsx`
- `app/admin/operators/operator-form.tsx`
- `app/admin/papers/paper-form.tsx`
- `app/admin/foro/forum-form.tsx`
- category forms under `app/admin/course-categories/` and `app/admin/paper-categories/`

List screens usually provide client-side filtering and delete actions, then call `router.refresh()`.

`AdminCollectionManager` exists for generic CRUD management and is currently used by `/admin/usuarios`. Prefer module-specific forms/lists for richer entities.

## Next.js Conventions

- This project uses App Router async `params`/`searchParams` signatures compatible with Next.js 16.
- Use Server Components by default. Add `"use client"` only for components with state, effects, browser APIs, or event handlers.
- Keep MongoDB, auth, filesystem, and crypto work on the server side. Use `server-only` in services that must not enter client bundles.
- Use `notFound()` for missing dynamic records on pages.
- Use `redirect()` for server-side auth redirects.
- Use `NextResponse` in route handlers.
- Use `next/image` for image rendering when practical. `next.config.ts` permits remote images from `https://*.interjudaica.com`.

## Verification Before Handoff

After edits, run the narrowest meaningful checks:

1. `bun run lint`
2. `bun run tsc --noEmit` when TypeScript contracts changed
3. `bun run build` for route, metadata, server/client boundary, or Next config changes

If a check fails due to missing local services such as MongoDB, report that explicitly with the command and failure reason. Do not mask unrelated pre-existing failures.

## Mandatory Change Workflow

- Always document every project change in `CHANGELOG.md` in the same commit.
- Always create a git commit with a descriptive message after each completed change.
- When unrelated user changes exist in the worktree, leave them unstaged and mention them in the handoff.

## Repo Hygiene

- Do not commit or edit `.next/`, `node_modules/`, or `.env*`.
- Do not add generated upload files unless the task explicitly needs fixture assets.
- Keep `bun.lock` committed when dependencies change.
- Use the existing formatting style: tabs, single quotes, no semicolons, trailing commas, and `printWidth` 90 from `.prettierrc`.
- Respect user changes already present in the worktree.
