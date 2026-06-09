# PLAN: Admin Nav Improvements

## Goal
Apply all 6 improvements identified in the admin navigation analysis:
1. Fix collapsible animations
2. Add `aria-current="page"` on active links
3. Visual indicator on active parent group
4. Unify labels to Spanish
5. Merge "Foro y Contacto" into another group
6. Refactor AdminNavGroup/AdminNavSubGroup into single recursive component

## Working directory
`/home/lortmorris/repos/interjudaica/interjudaica-web`

## Package manager
`bun` (use `bun run build` to verify)

## Files to modify
- `app/globals.css`
- `app/admin/components/admin-nav.tsx`

---

## Phase 1: Fix collapsible animations

**File:** `app/globals.css`

Add these `@utility` definitions at the end of the file (before the media query for prefers-reduced-motion):

```css
@utility animate-collapsible-down {
  height: var(--radix-collapsible-content-height);
  transition: height 0.2s ease;
  overflow: hidden;
}

@utility animate-collapsible-up {
  height: 0;
  transition: height 0.2s ease;
  overflow: hidden;
}
```

---

## Phase 2: Add `aria-current="page"` on active links

**File:** `app/admin/components/admin-nav.tsx`

In both `AdminNavGroup` and `AdminNavSubGroup`, add `aria-current="page"` to the Link element when the link is active.

In the top-level link rendering (inside `AdminNavGroup`):
```
<Link
  key={link.href}
  href={link.href}
  aria-current={active ? 'page' : undefined}
  className={...}
>
```

In the sub-group link rendering (inside `AdminNavSubGroup`):
```
<Link
  key={link.href}
  href={link.href}
  aria-current={active ? 'page' : undefined}
  className={...}
>
```

---

## Phase 3: Visual indicator on active parent group

**File:** `app/admin/components/admin-nav.tsx`

When a group has an active child link (either direct or via subGroups), add a subtle gold tint to the CollapsibleTrigger. Use this conditional class:

```
className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold transition hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)] ${
  groupIsActive ? 'text-[var(--gold)] bg-[rgba(244,189,51,0.08)]' : 'text-[var(--muted)]'
}`}
```

Same for `AdminNavSubGroup` trigger:
```
className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold transition hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)] ${
  groupIsActive ? 'text-[var(--gold)] bg-[rgba(244,189,51,0.08)]' : 'text-[var(--muted)]'
}`}
```

---

## Phase 4: Unify labels to Spanish

**File:** `app/admin/components/admin-nav.tsx`

Change all link labels from English to Spanish:

| Current | New |
|---------|-----|
| Overview | Panel Principal |
| Courses | Cursos |
| Course categories | Categorías de cursos |
| Instructors | Instructores |
| Papers | Artículos |
| Paper categories | Categorías de artículos |
| Pages | Páginas |
| Translations | Traducciones |
| Social proof | Testimonios |
| Rabbi bio | Biografía del Rabino |
| Users | Usuarios |
| Operators | Operadores |
| Community access | Acceso comunidad |
| Password resets | Reseteos de contraseña |
| Subscription plans | Planes de suscripción |
| Subscriptions | Suscripciones |
| Payments | Pagos |
| Books | Libros |
| Book sales | Ventas de libros |
| Coupons | Cupones |
| Enrollments | Inscripciones |
| CRM Contacts | Contactos CRM |
| CRM Campaigns | Campañas CRM |
| Templates | Plantillas |
| Campaigns | Campañas |
| Groups | Grupos |
| Forum | Foro |
| Contact inquiries | Consultas de contacto |
| Configuration | Configuración |
| Analytics | Analytics |

---

## Phase 5: Merge "Foro y Contacto" into Marketing

**File:** `app/admin/components/admin-nav.tsx`

Remove the "Foro y Contacto" group and move its 2 links (Forum and Contact inquiries) into the Marketing group as direct links (before Email sub-group).

The Marketing group after the change:
```typescript
{
  label: 'Marketing',
  icon: Megaphone,
  links: [
    { href: '/admin/forum', label: 'Forum' },
    { href: '/admin/contacts', label: 'Contact inquiries' },
    { href: '/admin/crm/contacts', label: 'CRM Contacts' },
    { href: '/admin/crm/campaigns', label: 'CRM Campaigns' },
  ],
  subGroups: [
    {
      label: 'Email',
      icon: Mail,
      links: [
        { href: '/admin/email/templates', label: 'Templates' },
        { href: '/admin/email/campaigns', label: 'Campaigns' },
        { href: '/admin/email/groups', label: 'Groups' },
      ],
    },
  ],
},
```

*(Labels will be in Spanish from Phase 4)*

Remove the old "Foro y Contacto" group entirely.

---

## Phase 6: Refactor into single recursive component

**File:** `app/admin/components/admin-nav.tsx`

Merge `AdminNavGroup` and `AdminNavSubGroup` into a single `CollapsibleGroup` component that uses a `depth` prop for styling:

```typescript
function CollapsibleGroup({
  label,
  icon: Icon,
  links,
  subGroups,
  pathname,
  depth = 0,
}: {
  label: string
  icon: ComponentType<{ className?: string }>
  links: NavLink[]
  subGroups?: NavSubGroup[]
  pathname: string
  depth?: number
}) {
  const groupIsActive =
    links.some((link) => isLinkActive(pathname, link.href)) ||
    (subGroups?.some((sg) =>
      sg.links.some((link) => isLinkActive(pathname, link.href))
    ) ?? false)
  const [open, setOpen] = useState(groupIsActive)

  useEffect(() => {
    if (groupIsActive) setOpen(true)
  }, [groupIsActive])

  const iconSize = depth === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5'
  const chevronSize = depth === 0 ? 'h-4 w-4' : 'h-3.5 w-3.5'
  const padding = depth === 0 ? 'px-3 py-2' : 'px-3 py-1.5'
  const linkPadding = depth === 0 ? 'px-3 py-2' : 'px-3 py-1.5'
  const childIndent = depth === 0 ? 'pl-8' : 'pl-4'
  const childGap = depth === 0 ? 'gap-0.5 pb-1 pt-0.5' : 'gap-0.5 pb-0.5 pt-0.5'

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={`flex w-full items-center gap-2.5 rounded-md text-sm font-semibold transition hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)] ${padding} ${
          groupIsActive ? 'text-[var(--gold)] bg-[rgba(244,189,51,0.08)]' : 'text-[var(--muted)]'
        }`}
      >
        <Icon className={`${iconSize} shrink-0`} />
        <span className="text-left leading-tight">{label}</span>
        <ChevronRight
          className={`ml-auto ${chevronSize} shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className={`grid ${childGap} ${childIndent}`}>
          {links.map((link) => {
            const active = isLinkActive(pathname, link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`rounded-md font-semibold transition ${linkPadding} text-sm ${
                  active
                    ? 'text-[var(--gold)] bg-[rgba(244,189,51,0.12)]'
                    : 'text-[var(--muted)] hover:bg-[rgba(244,189,51,0.1)] hover:text-[var(--gold)]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
          {subGroups?.map((sg) => (
            <CollapsibleGroup
              key={sg.label}
              label={sg.label}
              icon={sg.icon}
              links={sg.links}
              depth={depth + 1}
              pathname={pathname}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
```

Then update `AdminNav` to use `CollapsibleGroup` instead of `AdminNavGroup`:
```typescript
export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="grid gap-1" aria-label="Admin navigation">
      {navGroups.map((group) => (
        <CollapsibleGroup
          key={group.label}
          label={group.label}
          icon={group.icon}
          links={group.links}
          subGroups={group.subGroups}
          pathname={pathname}
        />
      ))}
    </nav>
  )
}
```

Remove the old `AdminNavGroup` and `AdminNavSubGroup` functions.

Also update the `NavSubGroup` interface: remove `icon` and `links` since they're already covered by the recursive component... actually no, `NavSubGroup` still needs to be a separate type since `subGroups` is `NavSubGroup[]`. But since `CollapsibleGroup` accepts individual props, we can simplify the interfaces.

Actually, keep the types as they are but remove the `AdminNavGroup` and `AdminNavSubGroup` component functions since `CollapsibleGroup` handles both.

---

## Phase 7: Build verification

Run:
```bash
bun run build
```

Expected: exit code 0, no errors.
