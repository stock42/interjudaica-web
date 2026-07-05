# InterJudaica Design System

## 1. Atmosphere & Identity

InterJudaica feels like a focused study room: dark, calm, scholarly, and usable for repeated work. The signature is warm gold over quiet charcoal, with serif display type for Jewish learning identity and restrained operational surfaces for the admin.

## 2. Color

### Palette

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Background | `--background` | `#050608` | Global page background |
| Foreground | `--foreground` | `#f8f2e8` | Default readable text |
| Paper | `--paper` | `#0d1013` | Nested panels and table rows |
| Surface | `--surface` | `#11161a` | Admin cards, panels, and lists |
| Surface soft | `--surface-soft` | `#171c20` | Inputs and slightly raised controls |
| Ink | `--ink` | `#f8f2e8` | Main headings and high-emphasis copy |
| Muted | `--muted` | `#c1b8a8` | Secondary text and descriptions |
| Line | `--line` | `rgba(235, 177, 42, 0.28)` | Gold dividers and panel borders |
| Line soft | `--line-soft` | `rgba(255, 255, 255, 0.1)` | Quiet separators |
| Sapphire | `--sapphire` | `#f3bc32` | Legacy accent mapped to gold |
| Jade | `--jade` | `#cf9d22` | Secondary warm accent |
| Sumac | `--sumac` | `#b26a22` | Warning/earth accent |
| Gold | `--gold` | `#f4bd33` | Primary action, focus, active navigation |
| Gold soft | `--gold-soft` | `#946a13` | Lower-emphasis gold states |

### Rules

- Use gold for active states, primary actions, counts, and focus rings.
- Use `--surface` and `--paper` for hierarchy before adding shadows.
- Keep student-facing and admin-facing copy in English.
- Do not introduce raw colors in UI code without adding a semantic token here first.

## 3. Typography

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
| --- | --- | --- | --- | --- | --- |
| Display | `3rem` | 600 | 1.1 | 0 | Page titles |
| H1 | `2.25rem` | 600 | 1.15 | 0 | Section titles |
| H2 | `1.875rem` | 600 | 1.2 | 0 | Admin module headings |
| H3 | `1.25rem` | 600 | 1.35 | 0 | Card and form titles |
| Body | `1rem` | 400 | 1.6 | 0 | Main copy |
| Body small | `0.875rem` | 400/600 | 1.5 | 0 | Tables, forms, metadata |
| Caption | `0.75rem` | 700 | 1.4 | 0.12em | Labels and overlines |

### Font Stack

- Body: `"Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif`
- Display: `"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif`
- Numeric admin data should use tabular figures where dense comparison matters.

### Rules

- Use display serif for brand and page-level identity only.
- Admin controls use compact sans-serif text for scanning and repeated action.
- Body text stays at 14px or larger.

## 4. Spacing & Layout

### Base Unit

All spacing maps to a 4px base unit through Tailwind utilities.

| Token | Value | Usage |
| --- | --- | --- |
| `--space-1` | 4px | Tight icon-label gaps |
| `--space-2` | 8px | Compact rows |
| `--space-3` | 12px | Input padding and dense groups |
| `--space-4` | 16px | Form groups |
| `--space-5` | 20px | Admin panel padding |
| `--space-6` | 24px | Standard section groups |
| `--space-8` | 32px | Major admin blocks |

### Grid

- Public pages can use full-width sections with constrained inner content.
- Admin pages use a persistent left navigation at desktop and a single-column flow on mobile.
- Tables must sit inside `overflow-x-auto` wrappers.

### Rules

- Keep admin layouts dense but not cramped.
- Avoid nested card shells; repeated records, forms, and tools can be framed.
- Controls must keep stable height across loading, empty, and error states.

## 5. Components

### Admin Shell

- **Structure**: sticky left navigation plus unframed main content header and module body.
- **Variants**: overview, list, form, detail.
- **Spacing**: `gap-6` to `gap-8`, panel padding `p-4` to `p-6`.
- **States**: active nav item, hover, focus, mobile stacked layout.
- **Accessibility**: labelled nav, visible focus rings, current page via `aria-current`.
- **Motion**: collapsible nav uses 200ms height animation and respects reduced motion globally.

### Admin Record Panel

- **Structure**: heading/metadata row, optional controls, table or repeated record cards.
- **Variants**: list, empty, loading, error.
- **Spacing**: `p-4`, `gap-3`, table cells `px-4 py-3`.
- **States**: hover row, destructive action, disabled/loading.
- **Accessibility**: use real buttons and links, not clickable divs.
- **Motion**: hover/active only, no decorative animation.

### File Material Manager

- **Structure**: upload form, selected-file hint, repeated file cards with metadata editor.
- **Variants**: empty, loading, upload error, saving, deleting.
- **Spacing**: upload panel `p-4`, file cards `p-4`, `gap-3`.
- **States**: disabled upload/save/delete, inline error, focus rings.
- **Accessibility**: file input has label, each command is a button or link.
- **Motion**: button active translation only.

### Public Class Material List

- **Structure**: class article, material count, repeated downloadable material rows.
- **Variants**: no classes, no materials, enrolled material list.
- **Spacing**: class panel `p-5 sm:p-6`, rows `p-4`.
- **States**: download link hover/focus.
- **Accessibility**: downloads are links with visible labels.
- **Motion**: standard link/button transitions only.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
| --- | --- | --- | --- |
| Micro | 100-150ms | ease-out | Button active states |
| Standard | 200ms | ease-in-out | Collapsible admin groups |
| Focus | immediate | none | Keyboard ring visibility |

### Rules

- Animate `transform`, `opacity`, and collapsible height only where already provided by the UI kit.
- Respect `prefers-reduced-motion` from `app/globals.css`.
- Every interactive admin element needs hover, active, focus, and disabled states where applicable.

## 7. Depth & Surface

### Strategy

Mixed, leaning tonal-shift: surface hierarchy comes from dark token changes, gold borders, and occasional existing `--shadow` for major panels.

| Level | Treatment | Usage |
| --- | --- | --- |
| Base | `--background` | Page backdrop |
| Panel | `--surface` with `--line` border | Admin sections and cards |
| Nested | `--paper` with `--line` border | Forms, rows, nested records |
| Elevated | `--shadow` plus gradient surface | Sidebar and major public auth panels |

### Rules

- Keep cards at `rounded-lg` or tighter.
- Do not add decorative orbs or one-note gradients.
- Use depth to communicate grouping, not decoration.
