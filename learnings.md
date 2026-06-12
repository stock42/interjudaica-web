# Learnings

## Admin Nav Translation (2026-06-12)

Translated all admin navigation labels in `app/admin/components/admin-nav.tsx` from Spanish to English:

| Spanish | English |
|---|---|
| Panel Principal | Dashboard |
| Cursos | Courses |
| Categorías de cursos | Course Categories |
| Instructores | Instructors |
| Contenido | Content |
| Artículos | Papers |
| Categorías de artículos | Paper Categories |
| Páginas | Pages |
| Traducciones | Translations |
| Testimonios | Testimonials |
| Owner biography | Owner Biography (capitalized) |
| Usuarios | Users |
| Operadores | Operators |
| Acceso comunidad | Community Access |
| Reseteos de contraseña | Password Resets |
| Ventas | Sales |
| Planes de suscripción | Subscription Plans |
| Suscripciones | Subscriptions |
| Pagos | Payments |
| Libros | Books |
| Ventas de libros | Book Sales |
| Cupones | Coupons |
| Inscripciones | Enrollments |
| Foro | Forum |
| Consultas de contacto | Contact Inquiries |
| Contactos CRM | CRM Contacts |
| Campañas CRM | CRM Campaigns |
| Plantillas | Templates |
| Campañas | Campaigns |
| Grupos | Groups |
| Sistema | System |
| Configuración | Configuration |

## Payments Page Overhaul (2026-06-12)

Overhauled `app/admin/payments/page.tsx` to use the new `/api/admin/payments` API with server-side search, type filtering, and pagination.

- **Architecture**: Split into server component (`page.tsx`) that reads `searchParams` and wraps `AdminShell`, and client component (`payments-content.tsx`) that fetches from the API and manages UI state.
- **Search**: Debounced search input (400ms) that filters by user name, email, or item. Updates URL params for shareable/bookmarkable filters.
- **Type filter**: Dropdown with All types / Courses / Books / Subscriptions using URL `?type=` param.
- **Pagination**: Uses shadcn `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis` components. Page numbers use URL `?page=` param. Smart range with ellipsis for large page counts.
- **Data display**: Inline table with columns Payment, User, Type, Amount, Status, Date. Rows are clickable (opens detail modal). Status badges use semantic color coding. Includes CSV export and payment detail modal.
- **States**: Handles loading (progress text), empty (no match message), and error (API failure message) with centered placeholder panels.
- **Unified payments**: The API aggregates course payments, book sales, and community subscriptions into a single unified payment list. No more separate storage calls in the page.
- **API params**: `?search=&type=&page=&limit=` — pagination defaults to 30 items per page, max 100.

## Resources Books Page (2026-06-12)

Created public `/resources-books` page using existing `recommended-books` module.

- **Data source**: Uses `RecommendedBookStorage.listPublished()` directly (server component, `runtime = "nodejs"`).
- **Card grid**: Responsive 1/2/3 column grid matching existing `CourseGrid` pattern. Each card uses the design system: `rounded-lg border border-[var(--line)] bg-[linear-gradient(...)] shadow-[var(--shadow)]` with `hover:-translate-y-1` transition.
- **Card fields**: Cover image (3:4 aspect, with fallback), author (gold eyebrow), name (display heading), description (muted body), and "Buy on Amazon" button when `amazonLink` is set.
- **Empty state**: Centered placeholder panel when no published books exist.
- **Footer link**: Added to `SiteFooter` Navigation column between "Courses" and "About Ernesto".
- **SEO**: Metadata title "Resources — Books" with descriptive meta description.
- **No model changes needed**: The pre-existing `recommended-books` schema (name, author, coverImageUrl, amazonLink, description, order, status) mapped perfectly to the card requirements.

## Book AI Development Assistant (2026-06-12)

Created a dedicated AI-powered book development assistant with persistent MongoDB memory at `/admin/books/[uuid]/ai-assistant`.

**Architecture**:
- **Model**: `models/book-ai-conversation.ts` — links book conversations to chat threads (UUID, bookUuid, operatorUuid, threadUuid, timestamps)
- **Storage**: `services/book-ai-conversation-storage.ts` — CRUD for book AI conversations with indexes on uuid, bookUuid, and threadUuid
- **Chat endpoint**: `POST /api/admin/books/[uuid]/ai-assistant/chat` — dedicated streaming endpoint with book-specific system prompt and tools
- **Conversations API**: `GET/POST /api/admin/books/[uuid]/ai-assistant/conversations` — list/create conversations per book, admin auth required
- **Page**: `app/admin/books/[uuid]/ai-assistant/page.tsx` — server component fetches book, renders client chat UI
- **Client**: `book-ai-chat-client.tsx` — full chat interface with conversation sidebar, new/select/delete conversations, message rendering with tool call cards and reasoning blocks

**AI Tools**:
- `updateBookContent` — updates book's longDescription field via BookStorage
- `generateBookChapter` — returns structured context for AI chapter generation; AI uses system prompt (full book content) to generate, then `updateBookContent` to save
- Both registered in `app/api/agentes/chat/tools/books.tool.ts` with `role: 'admin'`

**Key features**:
- AI has access to full book content (title, description, longDescription, status, price) in system prompt
- Conversations persist across sessions via MongoDB (ChatStorage for messages, book_ai_conversations for mapping)
- Admin auth required for all endpoints
- Deep linking from book edit form ("AI Assistant" button)
- Follows existing UI patterns: Sheet-based chat drawer, Collapsible tool cards, Reasoning blocks, message bubbles

## Email Campaign Stop Button & PATCH Fix (2026-06-12)

Added campaign panic stop functionality and fixed the campaign lifecycle state machine:

### Campaign Status Machine
- **draft** → **running** (via `POST /run`) → **done** (when all emails processed) or **stopped** (via panic button)
- Previously: run set status directly to "done", never entering "running" state
- Fixed: run now sets "running", enabling the stop button to appear

### New STOP Endpoint
- `POST /api/admin/email/campaigns/[uuid]/stop` — sets campaign status to "stopped" and marks all pending spooler entries as error with message "Campaign stopped by operator"
- Validates campaign is in "running" state before stopping (409 if not)
- Admin auth required

### Panic Stop Button
- Red button (`bg-red-600 hover:bg-red-700`) in campaign detail action bar
- Only visible when `campaign.status === 'running'`
- Confirmation dialog: "Stop this campaign? This will cancel all pending emails and mark the campaign as stopped. This action cannot be undone."
- Disabled state with "Stopping…" text while request is in flight

### Spooler Cron Safety Net
- `processEmailSpooler()` now checks campaign status before sending each email
- Uses a local `Map<string, string | null>` cache to avoid repeated DB lookups per batch
- Emails belonging to stopped campaigns are skipped during cron processing

### Model Changes
- Added `'stopped'` to `emailCampaignStatuses` enum in `models/email-campaigns.ts`
- Added `EmailSpoolerStorage.cancelPending(uuid)` method to bulk-update pending spooler entries

### UI Status Colors
- Added `stopped: 'bg-red-100 text-red-700'` to campaign list status badge colors

### Files Changed
- `models/email-campaigns.ts` — added "stopped" status
- `app/api/admin/email/campaigns/[uuid]/stop/route.ts` — new stop endpoint
- `app/api/admin/email/campaigns/[uuid]/run/route.ts` — changed done→running
- `app/admin/email/campaigns/[uuid]/campaign-detail.tsx` — panic button + confirmation dialog
- `app/admin/email/campaigns/campaigns-list.tsx` — stopped status color
- `services/email-spooler-storage.ts` — cancelPending method
- `lib/email-spooler-cron.ts` — skip stopped campaigns
- `app/api/agentes/chat/tools/email-marketing.tool.ts` — runEmailCampaign sets running
