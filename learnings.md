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
- **Data display**: Reuses existing `DataTable` from `portal-ui.tsx` with columns: Payment, User, Type, Amount, Status, Date.
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
