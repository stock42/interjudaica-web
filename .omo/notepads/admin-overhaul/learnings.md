# Admin Overhaul — Learnings

## Wave 1: TDD Infrastructure (2026-06-11)

### What went well
- `bun test` was already configured in package.json — no modification needed.
- Existing 171 tests in `tests/` passed immediately with the new setup file; no regressions.
- `mock.module('server-only', () => ({}))` in `tests/setup.ts` allows unit tests to import server-only modules without hitting the `server-only` guard.

### Patterns established
- **Mock DB**: `createMockCollection()` returns in-memory collections with `findOne`, `find`, `insertOne`, `updateOne`, `deleteOne`, `deleteMany` stubs. `mockDb()` maps collection names to instances.
- **Test style**: `import { describe, expect, test } from 'bun:test'` with tabs, single quotes, no semicolons, trailing commas (matching `.prettierrc`).
- **Directory**: `tests/unit/models/` mirrors source `models/` layout; expand to `tests/unit/services/`, `tests/unit/lib/` etc. as needed.

### Gotchas
- `mock` from `bun:test` wraps functions; mock functions must be `async` when the real implementations are async.
- The `server-only` mock must be set before any imports that transitively depend on it.

## Wave 2: Rabbi → Ernesto/Owner Rename (2026-06-11)

### Files created
- `models/owner-bio.ts` — renamed from `models/rabbi-bio.ts` (`schemaOwnerBio`, `OwnerBioModel`, `TypeOwnerBio`), default title `"Ernesto Yattah"`
- `services/owner-bio-storage.ts` — renamed from `services/rabbi-bio-storage.ts` (`OwnerBioStorage`, `COLLECTION = "owner_bio"`)
- `tests/unit/models/owner-bio.test.ts` — verifies `"Ernesto Yattah"` defaults and UUID generation

### Files deleted
- `models/rabbi-bio.ts`
- `services/rabbi-bio-storage.ts`

### Files modified
- `models/courses.ts` — `instructor` default: `"Rabbi Yattah"` → `"Ernesto Yattah"`, `instructorSlug` default: `"rabbi-yattah"` → `"ernesto-yattah"`
- `models/papers.ts` — `author` default: `"Rabbi Yattah"` → `"Ernesto Yattah"`
- `models/forums.ts` — `forumCreators[0]`: `"rabbi"` → `"ernesto"`
- `models/translations.ts` — `"nav.aboutRabbi"` → `"nav.aboutErnesto"`, `"admin.rabbiBio"` → `"admin.ownerBio"`
- `boot/index.ts` — import `OwnerBioStorage`, call `OwnerBioStorage.ensureIndexes()`

### Unchanged (must NOT change)
- Default slug `"ernesto-yattah"` preserved as-is everywhere

### Consumers NOT yet updated (for Tasks 3-7)
The following files still reference the old `RabbiBio*` identifiers and will be handled in follow-up tasks:
- `app/ernesto-yattah/page.tsx` — imports `getRabbiBio` from `@/app/lib/rabbi-bio`
- `app/lib/rabbi-bio.ts` — imports `TypeRabbiBio`, `RabbiBioStorage` from old paths
- `app/admin/rabbi-bio/page.tsx` — imports `RabbiBioStorage`
- `app/admin/rabbi-bio/rabbi-bio-form.tsx` — imports `TypeRabbiBio`
- `app/api/rabbi-bio/route.ts` — imports `RabbiBioStorage`
- `app/api/admin/rabbi-bio/route.ts` — imports `RabbiBioStorage`

### Test results
- 185 pass, 0 fail across 15 files (including 4 new owner-bio tests)

### Patterns
- When replacing a model file, create the new file first, verify imports, then delete the old file
- The COLLECTION constant rename from `"rabbi_bio"` to `"owner_bio"` means a new MongoDB collection will be used; existing data in `rabbi_bio` needs manual migration

## Wave 3: Test & Doc Updates for Rabbi→Ernesto Rename (2026-06-11)

### Files modified
- `tests/e2e/routes.e2e.ts` — regex `/Rabbi Ernesto Yattah/i` → `/Ernesto Yattah/i`
- `tests/e2e/home.e2e.ts` — assertion `/Rabbi Ernesto Yattah/i` → `/Ernesto Yattah/i`
- `tests/api/public.e2e.ts` — `test.describe('Rabbi Bio')` → `test.describe('Owner Bio')`, all API URLs `/api/rabbi-bio` → `/api/owner-bio`, test descriptions updated
- `tests/api/admin.e2e.ts` — `test.describe.serial('Admin Rabbi Bio')` → `test.describe.serial('Admin Owner Bio')`, instructor test data `firstName: 'Rabbi'` → `firstName: 'Ernesto'`, API paths `/api/admin/rabbi-bio` → `/api/admin/owner-bio`
- `tests/tools/courses.tool.test.ts` — fixture strings `'Rabbi Yattah'` → `'Ernesto Yattah'`, `'rabbi-yattah'` → `'ernesto-yattah'`, `'Rabbi Cohen'` → `'Ernesto Cohen'`
- `AGENTS.md` — all 5 rabbi references updated: collection name `rabbi_bio` → `owner_bio`, endpoint paths, API tables, admin route map
- `CHANGELOG.md` — added rename entry at top of 2026-06-11 section

### Task 6: Navigation & Email Template Rename (2026-06-11)

#### portal-ui.tsx — footer nav
- `{ href: "/#about-rabbi", label: "About Rabbi" }` → `{ href: "/#about-ernesto", label: "About Ernesto" }`

#### content.ts — header nav + community text
- Nav: `{ href: "/#about-rabbi", label: "About Rabbi" }` → `{ href: "/ernesto-yattah", label: "About Ernesto" }`
- Community: `"Monthly papers and essays from Rabbi Yattah"` → `"...Ernesto Yattah"`

#### templates/emails/contact-user.tsx
- `const RABBI_URL` → `const ERNESTO_URL` (image URL value preserved — still points to `foto-ernesto-yattah-...`)
- `alt="Rabbi Ernesto Yattah"` → `alt="Ernesto Yattah"`
- `<p>Rabbi Ernesto Yattah</p>` → `<p>Ernesto Yattah</p>`
- Body: `"Rabbi Yattah brings years..."` → `"Ernesto Yattah brings years..."`
- Body: `"Rabbi Yattah and his team will respond..."` → `"Ernesto Yattah and his team will respond..."`

#### templates/emails/contact-to-admin.tsx
- Same 5 changes as contact-user.tsx (constant, alt, name, two body references)

#### Verification
- Grep confirmed zero remaining `Rabbi`/`rabbi`/`RABBI_URL` matches across all four files

## Wave 5: STT Microphone Component (2026-06-12)

### Files created
- `components/share/stt-microphone.tsx` — reusable "use client" component using browser Web Speech API
- `tests/unit/components/stt-microphone.test.ts` — 7 unit tests

### Design decisions
- **Web Speech API only**: Uses `window.SpeechRecognition` (Chromium) with `webkitSpeechRecognition` fallback. No external STT service.
- **Mic permission via `getUserMedia`**: Proactively requests mic access before starting recognition. Stream is stopped after permission grant to prevent echo.
- **States**: `idle` → `requesting` (permission prompt) → `listening` (pulsing red dot + "Listening...") → `error` (with role="alert" message) → `unsupported` (fallback text)
- **Auto-stop**: 10-second timeout prevents indefinite listening.
- **Aria**: `aria-label` toggles between "Start voice input" / "Stop voice input".
- **CSS**: Uses existing design tokens (`--gold`, `--sumac`, `--ink`, `--line-soft`, etc.). Pulsing red dot via Tailwind `animate-ping`.

### Test patterns for client components in Bun
- Bun test has no DOM. Polyfill `window` on `globalThis` before importing `react-dom/server`.
- For components checking `window.SpeechRecognition` in `useState` initializer, set the global before dynamic `import()`.
- Use dynamic `import()` instead of `require()` to satisfy ESLint `@typescript-eslint/no-require-imports`.
- `renderToStaticMarkup` from `react-dom/server` works for static HTML assertions without needing `happy-dom`/`jsdom`.

### Gotchas
- TypeScript doesn't include Web Speech API types in the standard lib. Manually declared `SpeechRecognition`, `SpeechRecognitionEvent`, `SpeechRecognitionErrorEvent` interfaces at the top of the component file.
- React DOM server renderer references `window` internally even for `renderToStaticMarkup` — must provide a minimal `window` shim before the import.

## Wave 3: Public-facing "Rabbi" → "Ernesto" rename (2026-06-11)

### Files modified
- `app/page.tsx` — 8 replacements: hero tagline, button text, section id, image alt, heading, body text, button link text, href anchor
- `app/ernesto-yattah/page.tsx` — metadata title/description, eyebrow (`"Rabbi"` → `"About"`), fallback title, section description
- `app/community/page.tsx` — meta description, 3 body text occurrences (`"Rabbi Yattah"` → `"Ernesto Yattah"`)
- `app/community/papers/page.tsx` — meta description, section title (`"from Rabbi Yattah"` → `"from Ernesto Yattah"`)
- `app/community/forum/page.tsx` — meta description, section description (`"Rabbi Yattah"` → `"Ernesto Yattah"`)
- `app/checkout-community/checkout-community-form.tsx` — fallback description (`"Rabbi papers"` → `"member papers"`)

### Unchanged
- Route `/ernesto-yattah` — NOT modified
- Layout and styling — NOT modified
- No "Rabbi" occurrences remain in any public-facing page copy

## Wave 3: Rabbi → Owner Bio API & Consumer Rename (2026-06-11)

### Files created
- `app/api/owner-bio/route.ts` — renamed from `app/api/rabbi-bio/route.ts`, imports `OwnerBioStorage` from `@/services/owner-bio-storage`, calls `getBySlug("ernesto-yattah")`
- `app/api/admin/owner-bio/route.ts` — renamed from `app/api/admin/rabbi-bio/route.ts`, imports `OwnerBioStorage`, uses `getBySlug`/`upsertBySlug`
- `app/lib/owner-bio.ts` — renamed from `app/lib/rabbi-bio.ts`, imports from `@/models/owner-bio` and `@/services/owner-bio-storage`, exports `getOwnerBio()`, cache tags `["owner-bio", "ernesto-yattah"]`

### Files deleted
- `app/api/rabbi-bio/route.ts`
- `app/api/admin/rabbi-bio/route.ts`
- `app/lib/rabbi-bio.ts`
- Empty directories: `app/api/rabbi-bio/`, `app/api/admin/rabbi-bio/`

### Files modified
- `app/api/admin/papers/route.ts:36` — `createdBy: "rabbi"` → `"ernesto"`
- `app/api/admin/forums/route.ts:30` — `createdBy: "rabbi"` → `"ernesto"`
- `app/api/forums/route.ts:141` — `"Rabbi Yattah"` → `"Ernesto Yattah"`
- `app/api/agentes/chat/system-prompt.ts:53` — `"Rabbi Ernesto Yattah"` → `"Ernesto Yattah"`

### API contract preserved
- All route handlers keep `{ item }` response shape, `runtime = "nodejs"`, and auth guards unchanged
- Only import paths and function/class names changed; route logic untouched

## Wave 5: AI Agent Tools — Create Page, Create Testimonial, Update Owner Bio (2026-06-12)

### Files created
- `app/api/agentes/chat/tools/create-page.tool.ts` — `createPage` tool (title, description, content, status). Uses `PageStorage.create()`. Admin only.
- `app/api/agentes/chat/tools/create-social-proof.tool.ts` — `createTestimonial` tool (quote, name, detail, order, status). Uses `SocialProofStorage.create()`. Admin only.
- `app/api/agentes/chat/tools/update-owner-bio.tool.ts` — `updateOwnerBio` tool (title, markdown). Uses `OwnerBioStorage.upsertBySlug("ernesto-yattah", ...)`. Singleton upsert. Admin only.
- `tests/tools/create-page.tool.test.ts` — 6 tests: registration (admin role, no approval), create scenarios (minimal, with content, published, uuid increment)
- `tests/tools/create-social-proof.tool.test.ts` — 6 tests: registration, create with required fields, explicit order, published status, independent storage
- `tests/tools/update-owner-bio.tool.test.ts` — 7 tests: registration, upsert title-only, markdown-only, both, preserves existing data, slug is always "ernesto-yattah"

### Patterns established
- Tool files follow the `courses.tool.ts` pattern: `import 'server-only'`, `tool()` from `ai`, Zod `inputSchema`, `registerTool()` with `{ role: 'admin' }`
- Test files follow `tests/tools/courses.tool.test.ts` pattern: `mock.module` for `server-only`, `@/lib/llm-tool-auth`, and storage services; dynamic `import()` inside `beforeAll`
- Side-effect `import './file'` used in `index.ts` when `export *` would cause naming collisions (both `createPage` and `createTestimonial` already exist in `pages.tool.ts` and `social-proof.tool.ts`)

### Test results
- 19 pass, 0 fail across 3 new test files

### Files modified
- `app/api/agentes/chat/tools/index.ts` — added side-effect imports for the 3 new tool modules

## Wave 4: Admin Pages Rename (2026-06-11)

### Directory renamed
- `app/admin/rabbi-bio/` → `app/admin/owner-bio/`
  - `rabbi-bio-form.tsx` → `owner-bio-form.tsx`

### Files modified (7 total)

#### app/admin/owner-bio/page.tsx
- Import: `RabbiBioStorage` → `OwnerBioStorage` from `@/services/owner-bio-storage`
- Import: `RabbiBioForm` → `OwnerBioForm` from `@/app/admin/owner-bio/owner-bio-form`
- metadata title: `"Rabbi bio"` → `"Owner biography"`
- metadata description: `"Rabbi Ernesto Yattah"` → `"Ernesto Yattah"`
- AdminShell title: `"Rabbi bio"` → `"Owner biography"`
- Component: `<RabbiBioForm>` → `<OwnerBioForm>`

#### app/admin/owner-bio/owner-bio-form.tsx
- Import: `TypeRabbiBio` from `@/models/rabbi-bio` → `TypeOwnerBio` from `@/models/owner-bio`
- Component: `RabbiBioForm` → `OwnerBioForm`
- Default title: `"Rabbi Ernesto Yattah"` → `"Ernesto Yattah"`
- API endpoint: `/api/admin/rabbi-bio` → `/api/admin/owner-bio`
- Redirect: `/operator-login?next=/admin/rabbi-bio` → `/operator-login?next=/admin/owner-bio`

#### app/admin/papers/page.tsx
- metadata description: `"Manage Rabbi Yattah papers..."` → `"Manage Ernesto Yattah papers..."`
- AdminShell description: `"...from Rabbi Yattah"` → `"...from Ernesto Yattah"`

#### app/admin/papers/paper-form.tsx
- Default author: `"Rabbi Yattah"` → `"Ernesto Yattah"` (line 54)

#### app/admin/courses/course-form.tsx
- Default instructor: `"Rabbi Yattah"` → `"Ernesto Yattah"` (line 175)
- Default instructorSlug: `"rabbi-yattah"` → `"ernesto-yattah"` (line 176)

#### app/admin/forum/forum-form.tsx
- Help text: `"rabbi-created"` → `"ernesto-created"` (lines 208, 219)

#### app/admin/components/admin-nav.tsx
- Label: `"Biografía del Rabino"` → `"Owner biography"`
- href: `/admin/rabbi-bio` → `/admin/owner-bio`

## Wave 5: AI Chat Tools — createNewCourse + createCourseCategory (2026-06-12)

### Files created
- `app/api/agentes/chat/tools/create-course.tool.ts` — tool `createNewCourse`, accepts title + optional categoryUuid, instructorUuid, level, price, communityPrice, durationHours, startDate, endDate, maxStudents, summary, description, includes, outcomes. Calls `CourseStorage.create()`. Returns `{ uuid, slug }`. Registered as admin tool.
- `app/api/agentes/chat/tools/create-course-category.tool.ts` — tool `createCourseCategory`, accepts name + optional description. Calls `CourseCategoryStorage.create()`. Returns `{ uuid }`. Registered as admin tool.
- `tests/tools/create-course.tool.test.ts` — 7 tests: registration check, create with title-only, create with all fields, create with price/level, create with UUID refs, slug generation
- `tests/tools/create-course-category.tool.test.ts` — 7 tests: registration check, create with name-only, create with name+description, unique UUIDs, special chars, storage persistence

### Files modified
- `app/api/agentes/chat/tools/index.ts` — added `export * from './create-course.tool'` and `export * from './create-course-category.tool'` barrel entries

### Naming conflict resolved
- The existing `courses.tool.ts` already exports a `createCourse` tool. To avoid ESM barrel export conflicts, the new tool is named `createNewCourse` (export name and `registerTool` name match). The tool description clearly differentiates it as accepting structured UUID-based category/instructor references.
- `createCourseCategory` has no naming conflict — the existing `courses.tool.ts` only has `listCourseCategories` (read-only).

### Test results
- 14 new tests pass (0 fail)
- 275 total pass, 5 pre-existing failures in `translate-button.test.ts` (unrelated LOCALES export issue)
- Zero new TypeScript errors
- Zero new lint errors

## Wave 5: AI Tools — Instructor & Subscription Plan (2026-06-12)

### Files created
- `app/api/agentes/chat/tools/create-instructor.tool.ts` — Tool `createInstructor` accepting firstName, lastName, displayName, email, bio, photoUrl, enabled. Registers with `{ role: 'admin' }` (operator-only). Returns created instructor data with slug and success message.
- `app/api/agentes/chat/tools/create-subscription-plan.tool.ts` — Tool `createSubscriptionPlan` accepting name, description, price (cents), billingInterval (month/year), stripePriceId, active. Registers with `{ role: 'admin' }` (operator-only). Returns created plan data with success message.
- `tests/tools/create-instructor.tool.test.ts` — 6 tests covering: tool registration, required-only creation, full optional fields, auto-generated displayName, empty email handling
- `tests/tools/create-subscription-plan.tool.test.ts` — 7 tests covering: tool registration, required-only creation, full optional fields, billingInterval/month defaults, active/true default, zero-price plan

### Files modified
- `app/api/agentes/chat/tools/index.ts` — Added barrel exports for `create-instructor.tool` and `create-subscription-plan.tool` (side-effect imports trigger `registerTool()`)

### Patterns reinforced
- Tool files follow established pattern: `import 'server-only'` → `tool({ description, inputSchema, execute })` → `registerTool(name, { role: 'admin' })`
- Create tools do NOT use `needsApproval` (only destructive delete tools do)
- Test files mock `server-only`, `@/lib/llm-tool-auth`, and per-storage services with in-memory arrays
- `beforeAll(async () => { const mod = await import(...); ... })` dynamic import pattern loads tool module AFTER mocks are established
- `slugify` simulation in test mocks removes special chars and collapses hyphens: `.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')`
- All tool outputs include a `message` field confirming success
- InstructorModel auto-generates `displayName` from firstName + lastName and `slug` from displayName
- SubscriptionPlanModel uses `billingIntervals: ['month', 'year']` const array, re-exported from models

### Test results
- 13 new tests across 2 files, all passing
- No regressions to existing 192 tests
- 205 total tests: 198 pass, 7 pre-existing failures (stt-microphone — unrelated)

## Wave: Paper Creation Tools Extraction (2026-06-12)

### What went well
- Extracted `createPaper` and `createPaperCategory` from `papers.tool.ts` into standalone tool files following the `create-instructor.tool.ts` / `create-subscription-plan.tool.ts` pattern.
- No breaking changes: the old `papers.tool.ts` still exports `listPapers`, `getPaper`, `updatePaper`, `deletePaper`, `listPaperCategories`.
- 14 new tests across 2 files, all passing on first run.

### Patterns established
- Create-only tool files live at `app/api/agentes/chat/tools/create-{entity}.tool.ts` with barrel re-export in `index.ts`.
- `create-paper.tool.ts` auto-creates a linked forum thread in "Community Papers" area (mirrors the existing admin API pattern).
- `create-paper-category.tool.ts` uses `schemaPaperCategory.omit({ uuid: true, slug: true })` for input validation — slug is auto-generated by `PaperCategoryModel`.
- Both tools registered with `{ role: 'admin' }` (operator-only, no approval required).
- Test mocks for `ForumStorage.getByPaperUuid()` and `ForumStorage.create()` match the paper-forum linking logic.

### Files changed
- `app/api/agentes/chat/tools/create-paper.tool.ts` (new)
- `app/api/agentes/chat/tools/create-paper-category.tool.ts` (new)
- `app/api/agentes/chat/tools/papers.tool.ts` (removed extracted tools, removed unused `ForumStorage` and `schemaPaperCategory` imports)
- `app/api/agentes/chat/tools/index.ts` (added 2 new barrel exports)
- `tests/tools/create-paper.tool.test.ts` (new, 8 tests)
- `tests/tools/create-paper-category.tool.test.ts` (new, 6 tests)

### Test results
- 14 new tests across 2 files, all passing
- No regressions to existing tests

## Wave 5: Translate Button Component (2026-06-12)

### Files created
- `components/share/translate-button.tsx` — floating language switcher in bottom-right corner (`fixed bottom-6 right-6 z-50`). Uses shadcn `Popover` component. Exports `LOCALES` (4 entries: en/es/he/fr with flags) and `callAiTranslate()` helper. Shows spinner when AI translating. `aria-label="Switch language"` on button.
- `app/api/translations/route.ts` — public GET endpoint returning `{ locale, dictionary, hasTranslations }` for any locale. No auth required. Uses `TranslationStorage.getAll()`.
- `tests/unit/components/translate-button.test.ts` — 13 tests covering LOCALES constant, `callAiTranslate()` (endpoint URL, method, content-type, success, 401 handling, network error), and module exports.

### Patterns established
- **Share component pattern**: `"use client"` directive, shadcn `Popover`/`PopoverTrigger`/`PopoverContent`, follows existing `operator-user-menu.tsx` conventions (tabs, single quotes, no semicolons).
- **Floating action button**: `size-12 rounded-full`, gold border, hover scale/shadow animation, disabled state during translation.
- **Language selector popover**: 4 locale options with flag + label, current locale highlighted with gold bg + checkmark SVG.
- **AI translate integration**: Calls `POST /api/admin/translations/ai-translate` before switching locale; handles 401 gracefully so non-admin users can still switch languages without translation.
- **Testing without DOM**: Uses `bun:test` with mock `fetch`. Tests pure functions and module exports; component render verified via `React.createElement`.

### Design system usage
- Colors: `--gold` (primary), `--paper` (bg), `--muted` (text), `--background` via CSS variables and Tailwind tokens
- Popover: shadcn component mapped to `--surface`/`--popover` backgrounds in globals.css
- Button styling: `rounded-full border border-[var(--gold)] bg-[var(--paper)] shadow-lg` pattern from existing share components
- Spinner: custom SVG with `animate-spin` Tailwind utility

### Gotchas
- `useTranslation()` hook cannot be called inside callbacks (React rules-of-hooks violation). Must be called at component top level. Since the hook from Task 14 may not exist yet, locale switching is handled via `document.cookie` fallback setting `interjudaica_locale`.
- `@testing-library/react` and `happy-dom` are NOT installed — component tests use `react.createElement` for structure verification and mock `fetch` for logic tests.
- The `callAiTranslate` function hits the ADMIN endpoint (requires operator session). Non-admin users get 401; component handles this gracefully and still switches locale.
- `defaultTranslations` from `models/translations.ts` is the source of truth for translation keys.

### Verification
- 13 new tests, all passing (321 total, 0 fail)
- ESLint clean on all 3 new files
- `bun run lint` passes (only pre-existing lint issues in unrelated test files)

