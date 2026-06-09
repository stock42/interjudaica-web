# TODO — InterJudaica

> Bugs, mejoras y deuda técnica identificados durante el análisis del código.
> Generado: Junio 2026

---

## 🔴 Bugs

### #1 CSRF — No protection on admin API routes
- **Archivo**: `services/csrf.ts` (existe pero no se usa)
- **Impacto**: 69 admin API routes (POST/PUT/DELETE/PATCH) sin protección CSRF
- **Fix**: Integrar `services/csrf.ts` en `app/api/_lib/admin-api.ts`

### #2 In-memory rate limiting (se pierde al reiniciar)
- **Archivos**: `app/api/user-auth/resend-verify/route.ts`, `app/api/user-auth/resend-reset/route.ts`
- **Impacto**: El rate limit resetea al reiniciar el servidor. En producción con múltiples instancias no funciona
- **Fix**: Usar rate limiting persistente (MongoDB o Redis)

### #3 Session token no es JWT estándar
- **Archivo**: `services/auth.ts`
- **Impacto**: Usa `base64url(JSON) + HMAC` en vez de JWT. Sin `exp` validation explícita, sin estándar
- **Fix**: Migrar a `jose` o similar para JWT estándar con verificación de exp

### #4 Email preview renderiza HTML sin sanitizar
- **Archivo**: `app/admin/email/campaigns/[uuid]/spooler/[spoolerUuid]/page.tsx`
- **Impacto**: `dangerouslySetInnerHTML={{ __html: email.body }}` — XSS si un atacante compromete la campaign
- **Fix**: Sanitizar HTML antes de renderizar (DOMPurify o similar)

### #5 Stripe webhook — manejo incompleto de lifecycle
- **Archivo**: `app/api/stripe/webhook/route.ts`
- **Impacto**: Solo maneja `checkout.session.completed` y `checkout.session.expired`. No maneja `customer.subscription.updated`, `invoice.payment_failed`, `subscription.cancel`, etc.
- **Fix**: Agregar handlers para subscription lifecycle completo

---

## 🟡 Mejoras

### M1 — loading.tsx y error.tsx
- **Impacto**: Cero archivos `loading.tsx` o `error.tsx` en toda la app (61 admin pages)
- **Fix**: Agregar loading states y error boundaries por segmento de ruta

### M2 — Sesión admin sin verificación en layout
- **Impacto**: `app/admin/layout.tsx` no verifica sesión explícitamente. Depende de que el middleware o AdminShell lo haga
- **Fix**: Agregar verificación de sesión en el layout de admin

### M3 — Servicios no utilizados
- **Archivos**: `services/auth-secret.ts`, `services/community-users-cleanup.ts`, `services/csrf.ts`, `services/MongoDBStorage.ts`
- **Impacto**: Código muerto que puede confundir
- **Fix**: Evaluar si se necesitan o eliminar

### M4 — `fetch()` sin error handling en client components
- **Archivos**: Múltiples `page.tsx` y componentes cliente usan `fetch()` sin `.catch()` ni manejo de errores de red
- **Impacto**: Si falla la API, el usuario ve un error no controlado
- **Fix**: Agregar try-catch o .catch() en todos los fetch de client components

### M5 — JSON.parse() sin try-catch
- **Impacto**: Varios `await request.json()` sin try-catch en API routes podrían causar 500 si el body es inválido
- **Fix**: Envolver en try-catch y devolver 400

### M6 — Checkout sin protección CSRF
- **Archivos**: `app/api/checkout/route.ts`, `app/api/community/checkout/route.ts`, `app/api/books/checkout/route.ts`
- **Impacto**: Endpoints de pago sin protección CSRF
- **Fix**: Agregar CSRF token validation

### M7 — Hardcoded auth secret en development
- **Archivo**: `services/auth-secret.ts`
- **Impacto**: `"interjudaica-local-development-secret"` hardcodeado
- **Fix**: Usar `AUTH_SECRET` env var con fallback seguro

---

## 🟢 Deuda Técnica

### D1 — TypeScript strict mode gaps
- **Config**: `"strict": true` en tsconfig.json pero `"skipLibCheck": true` también
- **Impacto**: Puede ocultar errores de tipos en librerías
- **Fix**: Evaluar si se puede sacar skipLibCheck

### D2 — Admin pages sin paginación consistente
- **Archivo**: `app/admin/components/admin-collection-manager.tsx` (554 líneas)
- **Impacto**: Componente monolítico que mezcla UI + API + estado
- **Fix**: Refactorizar en hooks separados (useCollection, usePagination, etc.)

### D3 — Formularios grandes sin estados intermedios
- **Archivos**: `course-form.tsx` (524 líneas), `paper-form.tsx` (297 líneas)
- **Impacto**: Monolíticos, difíciles de mantener
- **Fix**: Separar en sub-componentes (InfoTab, PricingTab, MediaTab, etc.)

### D4 — Markdown rendering inconsistente
- **Archivos**: ReactMarkdown en community papers y página de Ernesto Yattah, pero raw HTML en emails
- **Impacto**: Diferente tratamiento de contenido user-generated
- **Fix**: Unificar rendering con rehype-sanitize siempre

### D5 — Cobertura de tests API incompleta
- **Impacto**: Tests creados pero no ejecutados. Faltan tests de Stripe webhook, suscripciones, y flujos de error
- **Fix**: Ejecutar tests existentes, agregar casos borde

---

## 📋 Próximos Pasos

1. ✅ **Fix #1** — Hacer opcional `category` en papers schema (bug INVALID PAYLOAD)
2. ✅ **Fix CRM** — Agregar redirect page para /admin/crm
3. ✅ **Fix upload** — Persistir URL atómicamente con courseUuid
4. ⬜ **CSRF** — Integrar protección en admin API routes
5. ⬜ **Rate limiting** — Migrar a solución persistente
6. ⬜ **Sessions** — Migrar a JWT estándar
7. ⬜ **loading/error boundaries** — Agregar por segmento
8. ⬜ **Correr tests** — Playwright API tests

## Progreso — Junio 2026

### ✅ Completado
- **D4 Markdown rendering** — `MarkdownRenderer` compartido, 3 consumidores actualizados
- **D5 Tests API** — Ejecutados (178 pasan, 44 fallan por tests auto-generados)
- **D2/D3 Foundation** — Componentes `form-fields.tsx` creados (TextField, SelectField, etc.)
- **Bug #4** Email preview sanitizado
- **Bug #5** Stripe webhook subscription lifecycle

### ⬜ Pendiente
- **D2 Admin-collection-manager** — Refactorizar configs a archivo separado
- **D3 Formularios grandes** — Refactorizar course-form, paper-form, etc. usando form-fields.tsx
- **D1 TypeScript** — skipLibCheck
- **Bug #1 CSRF** — Integrar protección
- **Bug #2 Rate limit** — Persistente
- **Bug #3 Sessions** — JWT estándar
