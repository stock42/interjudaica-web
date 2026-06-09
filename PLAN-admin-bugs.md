# Plan de Testing API y Corrección de Bugs — InterJudaica

> **Archivo**: `PLAN-admin-bugs.md`
> **Idioma**: Español
> **Objetivo**: Cobertura 100% de tests API-level con Playwright + corrección de 3 bugs críticos
> **Restricción**: NO modificar código fuente — solo planificación

---

## Resumen Ejecutivo

Este plan organiza el trabajo de testing de API y corrección de bugs en 10 fases secuenciales. Cada fase detalla los endpoints a testear, el enfoque de test, y los bugs a corregir. Se utiliza Playwright a nivel API (no UI) con helpers de autenticación reutilizables.

**Alcance total**: ~90 endpoints entre auth, admin CRUD, CRM, email marketing, AI agents, endpoints públicos y ventas.

**Bugs a corregir**:
1. "INVALID PAYLOAD" al crear papers — validación Zod en `models/papers.ts`
2. CRM no visible desde admin — investigar auth/session/cookies/navegación
3. Carga de imágenes de cursos intermitente — URL no persiste en el registro del curso

---

## Arquitectura de Sesiones y Auth (Contexto Clave)

### Sistema de cookies
| Sistema | Cookie | Duración | `sameSite` |
|---------|--------|----------|-------------|
| Operator (admin) | `__Host-interjudaica_operator_session` | 8 horas (configurable) | `strict` |
| User (estudiante) | `__Host-interjudaica_user_session` | 7 días (configurable) | `lax` |

### Autenticación de API
- **Admin**: `requireAdminApi(request)` → lee cookie `__Host-interjudaica_operator_session`
- **Estudiante**: `getCurrentUser()` → lee cookie `__Host-interjudaica_user_session`
- Ambas usan HMAC-SHA256 con `AUTH_SECRET`
- Las cookies son `httpOnly`, `secure`, sin acceso desde JavaScript

### Estructura de respuesta de error
- `401` → `{ error: "Unauthorized" }`
- `400` → `{ error: "Invalid payload" }` (ZodError) o `{ error: "Invalid JSON body" }`
- `409` → `{ error: "A record with this unique value already exists" }`
- `404` → `{ error: "Not found" }`
- `500` → `{ error: "Unexpected server error" }`

---

## Fase 0: Setup de Infraestructura de Tests

### Archivos a crear

#### `tests/api/setup.ts`
Helper de autenticación y utilidades compartidas:

```typescript
// Funciones a implementar:
// - getAdminContext(): { request, cookies } — hace POST /api/auth/login con operador default, extrae cookie
// - getStudentContext(): { request, cookies } — registra + verifica + loguea estudiante de prueba
// - createTestStudent(): { email, password, firstName, lastName, uuid }
// - cleanupTestData(uuids: string[]) — elimina registros creados durante tests
```

**Detalles del helper de admin**:
1. Hacer `POST /api/auth/login` con credenciales del operador default (`admin@interjudaica.com` / `admin123` — verificar en `OperatorStorage.ensureDefaultOperator()`)
2. Extraer cookie `__Host-interjudaica_operator_session` de la respuesta `Set-Cookie`
3. Retornar cookie para usar en requests subsecuentes

**Detalles del helper de estudiante**:
1. `POST /api/user-auth/register` con datos únicos (usar timestamp en email)
2. `POST /api/user-auth/verify` con código de verificación (leer de MongoDB directamente o mockear)
3. `POST /api/user-auth/login` con email + password
4. Extraer cookie `__Host-interjudaica_user_session`
5. Retornar contexto autenticado

### Configuración de Playwright

El proyecto ya tiene `playwright.config.ts` configurado con:
- `testDir: "./tests/e2e"` — los tests API irán en `tests/api/`
- Puerto default: `3026` (configurable via `PLAYWRIGHT_PORT`)
- `baseURL` configurable via `PLAYWRIGHT_BASE_URL`

**Ajuste necesario en playwright.config.ts**: Agregar `testDir: "./tests"` o crear `playwright.api.config.ts` para tests API separados.

---

## Fase 1: Auth — Endpoints de Autenticación

### Endpoints a testear

| Método | Ruta | Auth requerida | Notas |
|--------|------|----------------|-------|
| `POST` | `/api/user-auth/register` | No | Registro de estudiante |
| `POST` | `/api/user-auth/verify` | No | Verificación de email (código 6 dígitos) |
| `POST` | `/api/user-auth/resend-verify` | No | Reenvío de código de verificación |
| `POST` | `/api/user-auth/login` | No | Login de estudiante |
| `POST` | `/api/user-auth/logout` | No | Logout de estudiante |
| `GET` | `/api/user-auth/me` | Estudiante | Obtener usuario actual |
| `POST` | `/api/user-auth/forgot-password` | No | Solicitar reset de contraseña |
| `POST` | `/api/user-auth/resend-reset` | No | Reenviar código de reset |
| `POST` | `/api/user-auth/reset-password` | No | Resetear contraseña con código |
| `POST` | `/api/auth/login` | No | Login de operador |
| `POST` | `/api/auth/logout` | No | Logout de operador |
| `GET` | `/api/auth/me` | Operador | Obtener operador actual |

### Archivo: `tests/api/auth.e2e.ts`

### Tests a implementar

**Registro de estudiante**:
- Registro exitoso con datos válidos → 201, retorna user sin password
- Email duplicado → 409
- Email inválido → 400 (ZodError → "Invalid payload")
- Password muy corta → 400
- Nombre vacío → 400
- Campos faltantes → 400

**Verificación de email**:
- Código correcto → 200, usuario activado
- Código incorrecto → 400
- Código expirado → 400
- Usuario ya verificado → 400

**Login de estudiante**:
- Credenciales correctas → 200, setea cookie `__Host-interjudaica_user_session`
- Email no registrado → 401
- Password incorrecta → 401
- Usuario no verificado → 401
- Verificar atributos de cookie: `httpOnly`, `secure`, `sameSite=lax`, `path=/`

**Logout de estudiante**:
- Con sesión activa → 200, limpia cookie
- Sin sesión → 200 (idempotente)

**GET /api/user-auth/me**:
- Con sesión válida → 200, retorna datos de usuario
- Sin sesión → 401, `{ user: null }`
- Con sesión expirada → 401

**Flujo de forgot-password / reset-password**:
- Solicitar reset → 200, email enviado
- Reset con código válido → 200, contraseña actualizada
- Reset con código inválido → 400
- Login con nueva contraseña → 200
- Rate limiting de resend-reset

**Login de operador**:
- Credenciales correctas → 200, setea cookie `__Host-interjudaica_operator_session`
- Verificar `sameSite=strict` en cookie
- Operador deshabilitado → 401
- Password incorrecta → 401

**GET /api/auth/me**:
- Con sesión válida → 200, retorna `{ operator }`
- Sin sesión → 401, `{ operator: null }`

**Seguridad de cookies**:
- Cookies no accesibles desde JavaScript (httpOnly)
- Cookies no enviadas en requests cross-origin (sameSite)
- Cookies requieren HTTPS (secure)

---

## Fase 2: Admin — CRUD de Entidades

### Archivo: `tests/api/admin.e2e.ts`

### Entidades a testear (CRUD completo: GET list, POST create, GET item, PATCH update, DELETE)

| Entidad | Ruta base | Schema Zod | Storage |
|---------|-----------|------------|---------|
| Courses | `/api/admin/courses` | `models/courses.ts` | `courses-storage.ts` |
| Course Categories | `/api/admin/course-categories` | `models/course-categories.ts` | `course-categories-storage.ts` |
| Classes | `/api/admin/classes` | `models/course-classes.ts` | `course-classes-storage.ts` |
| Instructors | `/api/admin/instructors` | `models/instructors.ts` | `instructors-storage.ts` |
| Papers | `/api/admin/papers` | `models/papers.ts` | `papers-storage.ts` |
| Paper Categories | `/api/admin/paper-categories` | `models/paper-categories.ts` | `paper-categories-storage.ts` |
| Pages (CMS) | `/api/admin/pages` | `models/pages.ts` | `pages-storage.ts` |
| Users | `/api/admin/users` | `models/users.ts` | `users-storage.ts` |
| Operators | `/api/admin/operators` | `models/operators.ts` | `operators-storage.ts` |
| Books | `/api/admin/books` | `models/books.ts` | `books-storage.ts` |
| Book Sales | `/api/admin/book-sales` | Solo GET (readonly) | `book-sales-storage.ts` |
| Social Proof | `/api/admin/social-proof` | `models/social-proof.ts` | `social-proof-storage.ts` |
| Forums | `/api/admin/forums` | `models/forum-threads.ts` | `forums-storage.ts` |
| Coupons | `/api/admin/coupons` | `models/coupons.ts` | `coupons-storage.ts` |
| Enrollments | `/api/admin/enrollments` | `models/course-enrollments.ts` | Solo POST crear enrollment |
| Community Users | `/api/admin/community-users` | `models/community-users.ts` | Solo POST crear acceso |
| Config | `/api/admin/config` | `models/config.ts` | `config-storage.ts` |
| Contacts (form) | `/api/admin/contacts` | `models/contacts.ts` | `contacts-storage.ts` |
| Password Resets | `/api/admin/password-resets` | Solo GET list | `password-reset-attempts-storage.ts` |
| Rabbi Bio | `/api/admin/rabbi-bio` | `models/rabbi-bio.ts` | `rabbi-bio-storage.ts` |

### Tests genéricos por entidad (aplicar a cada una)

**GET list**:
- Con auth admin → 200, `{ items: [...] }`
- Sin auth → 401
- Con cookie expirada → 401
- Array vacío cuando no hay registros → 200, `{ items: [] }`

**POST create**:
- Payload válido → 201, `{ item: {...} }`
- Payload inválido (Zod) → 400, `{ error: "Invalid payload" }`
- Campo único duplicado → 409
- Campos faltantes → 400
- Sin auth → 401

**GET item (por UUID)**:
- UUID válido existente → 200, `{ item: {...} }`
- UUID inválido (formato) → 400/404
- UUID no existente → 404, `{ error: "Not found" }`
- Sin auth → 401

**PATCH update**:
- Update parcial válido → 200, `{ item: {...} }`
- UUID no existente → 404
- Payload inválido → 400
- Sin auth → 401

**DELETE**:
- UUID existente → 200, `{ deleted: true }`
- UUID no existente → 404
- Sin auth → 401
- DELETE idempotente (segundo DELETE mismo UUID → 404)

### Tests específicos por entidad

**Courses**:
- Crear curso crea automáticamente un forum thread → verificar en `/api/admin/forums`
- Validar slug generado automáticamente
- Validar campos: `title`, `category`, `price`, `status` (enum: draft/published/archived)

**Papers** ⚠️ **BUG #1**:
- **Test específico**: Enviar `category: ""` (string vacío) → actualmente falla con "Invalid payload"
- **Test específico**: Enviar `categoryUuid` sin `category` → validar comportamiento
- **Test específico**: Enviar paper sin `category` → validar
- El campo `category` es el nombre de categoría (string display), mientras `categoryUuid` es la referencia UUID
- Slug de categoría se genera con `slugify(category)` si no se provee `categorySlug`

**Users**:
- Crear usuario admin → verificar que `password` no se retorna en respuesta
- Actualizar password → verificar que se hashea correctamente
- Eliminar usuario → verificar cascada (enrollments, etc.)

**Operators**:
- No se puede eliminar el último operador
- El operador default se crea automáticamente si la colección está vacía
- `level` debe ser number

**Coupons**:
- `code` se transforma a uppercase automáticamente → verificar
- `percentOff` debe ser 0-100
- `scope` debe ser "all", "course", o "community"
- `usageLimit` y `usageCount` validación

**Config**:
- GET → 200, `{ items: { key: value, ... } }`
- PUT → actualiza configuración por key-value map
- Validar tipos de datos (strings, numbers, booleans)

**Uploads** (solo operadores autenticados):
- `POST /api/admin/uploads/course-image` — multipart/form-data, archivo JPG/PNG/WEBP/GIF < 5MB
- `POST /api/admin/uploads/class-image` — ídem
- `POST /api/admin/uploads/instructor-photo` — ídem
- `POST /api/admin/uploads/book-cover` — ídem
- `POST /api/admin/uploads/forum-asset` — ídem
- Validar magic bytes (contenido real vs tipo declarado)
- Validar que retorna `{ url: "/uploads/..." }`
- Archivo demasiado grande → 400
- Tipo no permitido → 400

**Contacts (admin form responses)**:
- `GET /api/admin/contacts` — lista mensajes de contacto
- `GET /api/admin/contacts/[uuid]` — detalle de mensaje
- `POST /api/admin/contacts/[uuid]/reply` — responder con email (soporta attachments)
- `POST /api/admin/contacts/[uuid]/mark-unread` — marcar como no leído

**Classes y Files**:
- `GET /api/admin/classes?courseUuid=...` — listar clases de un curso
- `POST /api/admin/classes` — crear clase
- `GET/PATCH/DELETE /api/admin/classes/[uuid]` — CRUD clase
- `GET /api/admin/classes/[uuid]/files` — listar archivos
- `POST /api/admin/classes/[uuid]/files` — subir archivo
- `DELETE /api/admin/classes/[uuid]/files/[fileUuid]` — eliminar archivo

### Entidades adicionales encontradas

| Ruta | Auth | Notas |
|------|------|-------|
| `GET /api/admin/overview` | Admin | Dashboard stats |
| `GET/POST /api/admin/subscription-plans` | Admin | Planes de suscripción |
| `GET/PATCH/DELETE /api/admin/subscription-plans/[uuid]` | Admin | CRUD plan individual |
| `GET /api/admin/search` | Admin | Búsqueda global |
| `GET /api/admin/translations` | Admin | Lista traducciones |
| `POST /api/admin/translations/ai-translate` | Admin | Traducción por IA |

---

## Fase 3: CRM — Gestión de Contactos y Campañas

### Archivo: `tests/api/crm.e2e.ts`

### Endpoints CRM

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/admin/crm/contacts` | Listar contactos (paginado, filtrable) |
| `POST` | `/api/admin/crm/contacts` | Crear contacto |
| `GET` | `/api/admin/crm/contacts/[uuid]` | Obtener contacto |
| `PATCH` | `/api/admin/crm/contacts/[uuid]` | Actualizar contacto |
| `DELETE` | `/api/admin/crm/contacts/[uuid]` | Eliminar contacto |
| `POST` | `/api/admin/crm/contacts/export` | Exportar contactos (CSV/JSON) |
| `POST` | `/api/admin/crm/contacts/import` | Importar contactos (CSV/JSON) |
| `GET` | `/api/admin/crm/campaigns` | Listar campañas |
| `POST` | `/api/admin/crm/campaigns` | Crear campaña |
| `GET` | `/api/admin/crm/campaigns/[uuid]` | Obtener campaña |
| `PATCH` | `/api/admin/crm/campaigns/[uuid]` | Actualizar campaña |
| `DELETE` | `/api/admin/crm/campaigns/[uuid]` | Eliminar campaña |
| `GET` | `/api/admin/crm/campaigns/[uuid]/contacts` | Listar contactos en campaña |
| `POST` | `/api/admin/crm/campaigns/[uuid]/contacts` | Agregar contacto a campaña |
| `DELETE` | `/api/admin/crm/campaigns/[uuid]/contacts/[contactUuid]` | Remover contacto de campaña |
| `GET` | `/api/admin/crm/tags` | Listar tags |
| `POST` | `/api/admin/crm/tags` | Crear tag |

### Gap detectado
- **No existe** `GET/PATCH/DELETE /api/admin/crm/tags/[uuid]` — tags solo tiene operaciones de colección

### Tests a implementar

**Contacts CRUD**:
- Crear contacto con tags → los tags se resuelven inline (createIfNotExists)
- Búsqueda por query (`?q=...`)
- Filtrado por tags (`?tags=uuid1,uuid2`)
- Paginación (`?page=2&limit=10`)
- Ordenamiento (`?sort=firstname|lastname|email|added`)
- Validación de email único (enforce a nivel aplicación)

**Contacts Export/Import**:
- Exportar todos los contactos → validar formato CSV/JSON
- Exportar contactos filtrados → solo los que matchean query/tags
- Importar CSV válido → 201, contactos creados
- Importar CSV con emails duplicados → manejo de conflictos
- Importar CSV con campos inválidos → 400 con errores detallados

**Campaigns CRUD**:
- Crear campaña con nombre y descripción
- Listar campañas con `contactCount`
- Agregar contacto a campaña → verificar asociación
- Remover contacto de campaña → verificar desasociación
- Eliminar campaña → ¿cascada sobre asociaciones?

**Tags**:
- GET list → 200, `{ items: [...] }`
- POST create → 201 (createIfNotExists semántica)
- Crear tag duplicado → retorna existente (no error)

**Auth**:
- Todos los endpoints requieren auth admin → 401 sin cookie

---

## Fase 4: Email Marketing — Campañas, Templates y Grupos

### Archivo: `tests/api/email.e2e.ts`

### Endpoints Email Marketing

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/admin/email/templates` | Listar templates |
| `POST` | `/api/admin/email/templates` | Crear template |
| `GET` | `/api/admin/email/templates/[uuid]` | Obtener template |
| `PATCH` | `/api/admin/email/templates/[uuid]` | Actualizar template |
| `DELETE` | `/api/admin/email/templates/[uuid]` | Eliminar template |
| `GET` | `/api/admin/email/groups` | Listar grupos |
| `POST` | `/api/admin/email/groups` | Crear grupo |
| `GET` | `/api/admin/email/groups/[uuid]` | Obtener grupo |
| `PATCH` | `/api/admin/email/groups/[uuid]` | Actualizar grupo |
| `DELETE` | `/api/admin/email/groups/[uuid]` | Eliminar grupo |
| `GET` | `/api/admin/email/campaigns` | Listar campañas (con stats, templateName, groupName) |
| `POST` | `/api/admin/email/campaigns` | Crear campaña |
| `GET` | `/api/admin/email/campaigns/[uuid]` | Obtener campaña |
| `PATCH` | `/api/admin/email/campaigns/[uuid]` | Actualizar campaña |
| `DELETE` | `/api/admin/email/campaigns/[uuid]` | Eliminar campaña |
| `POST` | `/api/admin/email/campaigns/[uuid]/run` | Ejecutar campaña (enviar emails) |
| `POST` | `/api/admin/email/campaigns/[uuid]/retry` | Reintentar envíos fallidos |
| `GET` | `/api/admin/email/campaigns/[uuid]/spooler` | Listar entradas del spooler |
| `GET` | `/api/admin/email/campaigns/[uuid]/spooler/[spoolerUuid]` | Ver entrada específica |
| `POST` | `/api/admin/email/campaigns/[uuid]/spooler/[spoolerUuid]/retry` | Reintentar entrada específica |

### Modelos involucrados (Zod schemas)
- `models/email-templates.ts` — schemaEmailTemplate
- `models/email-groups.ts` — schemaEmailGroup
- `models/email-campaigns.ts` — schemaEmailCampaign
- `models/email-spooler.ts` — schemaEmailSpooler

### Tests a implementar

**Templates**:
- CRUD completo con contenido HTML
- Validar campos requeridos: `name`, `subject`, `body`
- Template con variables de sustitución (`{{firstname}}`, `{{lastname}}`, etc.)

**Groups**:
- CRUD completo
- Validar `name` requerido
- Grupo puede estar vacío (sin contactos)

**Campaigns**:
- CRUD completo
- Requiere `templateUuid` y `groupUuid` válidos
- Validar estado de campaña (draft, running, completed, failed)
- GET lista retorna `stats`, `templateName`, `groupName` expandidos

**Ejecución de campaña**:
- POST `/run` → inicia envío asíncrono
- Verificar que se crean entradas en spooler
- Campaña sin template → error
- Campaña sin grupo → error
- Campaña ya running → error (no duplicar ejecución)

**Spooler**:
- GET lista por campaña → incluye estado de cada envío
- GET entrada individual → detalle de entrega
- POST retry entrada individual → reintenta envío
- POST retry campaña completa → reintenta todos los fallidos

**Auth**:
- Todos los endpoints requieren auth admin → 401 sin cookie

---

## Fase 5: AI Agents — Generación por LLM

### Archivo: `tests/api/agents.e2e.ts`

### Endpoints

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| `POST` | `/api/agentes/generate-query` | `{ promoting: string }` | `{ query: string }` |
| `POST` | `/api/agentes/generate-template` | `{ promoting: string }` | `{ html: string }` |

### Backing
- Ambos endpoints usan `lib/email-llm.ts` (stateless, sin modelos ni servicios)
- Requieren auth admin

### Tests a implementar

**generate-query**:
- Prompt válido → 200, `{ query: string }` (query MongoDB generada)
- Prompt vacío → 400, `{ error: "promoting is required" }`
- Prompt no es string → 400
- Sin auth → 401
- Prompt largo → validar timeout/manejo
- Prompt en español → validar que funciona

**generate-template**:
- Prompt válido → 200, `{ html: string }` (template HTML generado)
- Prompt vacío → 400
- Sin auth → 401
- Validar que el HTML retornado es válido (contiene tags HTML)
- Prompt con instrucciones de diseño específicas

**Rate limiting / concurrencia**:
- Múltiples requests simultáneos → sin errores
- Requests consecutivos rápidos → sin rate limiting

---

## Fase 6: Endpoints Públicos / Estudiante

### Archivo: `tests/api/public.e2e.ts`

### Endpoints

| Método | Ruta | Auth | Notas |
|--------|------|------|-------|
| `GET` | `/api/courses/[slug]/classes` | No | Clases de un curso publicado |
| `GET` | `/api/courses/classes/files/[fileUuid]` | Estudiante | Descarga de archivo (requiere enrollment) |
| `GET` | `/api/forums` | No | Listar threads del foro |
| `POST` | `/api/forums` | Estudiante | Crear thread |
| `POST` | `/api/forums/upload-image` | Estudiante | Subir imagen para thread |
| `GET` | `/api/papers` | No | Listar papers públicos |
| `GET` | `/api/papers/[slug]` | No | Paper por slug |
| `GET` | `/api/papers/[slug]/download` | No/Comunidad | Descargar paper |
| `GET` | `/api/rabbi-bio` | No | Bio del rabino |
| `GET` | `/api/social-proof` | No | Testimonios |
| `GET` | `/api/books/[slug]` | No | Book por slug |
| `POST` | `/api/contact` | No | Formulario de contacto |
| `POST` | `/api/community/checkout` | Estudiante | Checkout de membresía comunitaria |
| `GET` | `/api/community/customer-portal` | Estudiante | Portal de cliente Stripe |

### Gaps detectados
- **No existen** endpoints `/api/me/enrollments`, `/api/me/payments`, `/api/me/subscription`
- **No existe** endpoint público `/api/coupons/[code]/validate` (validación de cupones solo admin)
- **No existe** endpoint `/api/user-auth/preferences` como API (implementado como server action)

### Tests a implementar

**Cursos públicos**:
- GET `/api/courses/[slug]/classes` → 200 con clases del curso
- Slug no existente → 404
- Curso no publicado → ¿404 o se filtra?

**Papers públicos**:
- GET `/api/papers` → 200, `{ items: [...] }` (solo publicados)
- GET `/api/papers/[slug]` → 200 con contenido del paper
- Paper privado → 404 para usuario no autenticado
- Paper comunidad → visible para miembros comunidad
- Visibilidad: "public", "community", "private"

**Foro**:
- GET threads → paginación, filtrado por area/course
- POST crear thread (autenticado) → 201
- POST sin auth → 401
- POST upload-image → validar tipos y tamaño

**Contacto**:
- POST con datos válidos → 200, email enviado
- Campos obligatorios faltantes → 400
- Email inválido → 400

**Books**:
- GET `/api/books/[slug]` → 200 con datos del libro
- Book no publicado → 404

**Social Proof**:
- GET → 200, solo testimonios publicados

---

## Fase 7: Sales — Checkout, Stripe y Cupones

### Archivo: `tests/api/sales.e2e.ts`

### Endpoints

| Método | Ruta | Auth | Notas |
|--------|------|------|-------|
| `POST` | `/api/checkout` | Estudiante | Crea sesión de Stripe para curso |
| `POST` | `/api/stripe/webhook` | No (Stripe) | Webhook de Stripe |
| `POST` | `/api/books/checkout` | Estudiante | Checkout de libro |
| `POST` | `/api/community/checkout` | Estudiante | Checkout de membresía |
| `GET` | `/api/books/download` | Estudiante | Descarga de libro comprado |

### Gap detectado
- **No existe** `/api/coupons/[code]/validate` como endpoint público — validación de cupones ocurre dentro del checkout internamente

### Tests a implementar

**Checkout de curso**:
- POST con `{ courseUuid }` válido → 200, retorna `{ url: "https://checkout.stripe.com/..." }`
- Curso no existe → 404
- Curso no publicado → 404
- Sin auth → 401
- Con cupón válido → descuento aplicado
- Con cupón inválido → 400, `{ error: "Invalid coupon" }`
- Cupón 100% → retorna URL de éxito directa (sin Stripe)
- Cupón 100% → crea enrollment automáticamente, payment con status "paid"

**Webhook de Stripe**:
- Evento `checkout.session.completed` → crea enrollment y actualiza payment
- Evento desconocido → 200 (ignorado, no error)
- Firma inválida → 400/401
- Verificar idempotencia (mismo evento dos veces)

**Checkout de comunidad**:
- POST → crea sesión de Stripe para suscripción
- Auth requerida

**Checkout de libro**:
- POST con book slug/precio → crea sesión de Stripe
- Auth requerida

**Cupones (admin)**:
- CRUD completo en `/api/admin/coupons`
- Validar `code` uppercase automático
- Validar `percentOff` 0-100
- `claimCoupon` en checkout descuenta `usageLimit`

---

## Fase 8: Corrección de Bugs

### Bug #1: "INVALID PAYLOAD" al crear papers

**Archivo**: `models/papers.ts`
**Línea**: 12
**Código actual**:
```typescript
category: z.string().trim().min(2),
```

**Causa raíz**:
El campo `category` es el nombre display de la categoría (string), mientras `categoryUuid` es la referencia UUID. Cuando el formulario de paper envía `category: ""` (string vacío, porque no se seleccionó categoría), Zod rechaza con `min(2)` y el error se traduce a `{ error: "Invalid payload" }` (código 400).

**Solución propuesta**:
```typescript
category: z.string().trim().default(""),
```
- Cambiar `.min(2)` a `.default("")` para aceptar string vacío
- El campo `categoryUuid` ya tiene `.optional().or(z.literal(""))`
- Esto permite crear papers sin categoría display (el nombre de categoría se resuelve del UUID si existe)

**Alternativa**: Hacer que el formulario siempre envíe el nombre de categoría resuelto, no string vacío.

**Verificación post-fix**:
- Test: POST paper con `category: ""` → 201 (no 400)
- Test: POST paper sin `category` → 201 (default "")
- Test: POST paper con `category: "Torah"` → 201
- Verificar que `categorySlug` se genera con `slugify(category)` si category no es vacío

---

### Bug #2: CRM no visible desde admin

**Investigación requerida**:

1. **Verificar navegación admin**: ¿Los links a CRM aparecen en el sidebar/admin shell? Revisar `app/components/portal-ui.tsx` (AdminShell) y el componente de navegación lateral.

2. **Verificar rutas de página**: Las páginas CRM existen en `app/admin/crm/`:
   - `app/admin/crm/contacts/page.tsx`
   - `app/admin/crm/campaigns/page.tsx`
   - ¿Falta `app/admin/crm/page.tsx` (index/redirect)?

3. **Verificar auth**: El layout `app/admin/layout.tsx` usa `requireOperator()` que verifica la cookie `__Host-interjudaica_operator_session`. Posibles causas:
   - Cookie `sameSite: "strict"` — no se envía en navegación cross-site o desde links externos
   - Cookie vencida (8h default) — sesión expira y redirect a `/operator-login`
   - `secure: true` — solo funciona en HTTPS (en desarrollo local puede fallar si no usa HTTPS)

4. **Verificar permisos**: `requireOperator()` no verifica `level` — cualquier operador autenticado debería ver el admin completo.

5. **Verificar imports**: Las páginas CRM importan `AdminShell` de `@/app/components/portal-ui`. Si el componente falla (error de renderizado), la página completa no se muestra.

**Plan de diagnóstico**:
1. Test manual/Playwright: Navegar a `/admin/crm/contacts` con cookie de operador
2. Si redirect a login → problema de cookie (sameSite strict, secure, expiración)
3. Si 404 → problema de ruta (falta page.tsx)
4. Si error de renderizado → problema en AdminShell o ContactList
5. Si carga pero CRM no aparece en menú → falta link en navegación

**Posibles soluciones** (a confirmar tras diagnóstico):
- Agregar links de CRM en la navegación admin (AdminShell)
- Crear `app/admin/crm/page.tsx` como índice del módulo CRM
- Ajustar `sameSite` de `strict` a `lax` para la cookie de operador (si el problema es cross-site)
- Agregar manejo de errores en componentes CRM

---

### Bug #3: Carga de imágenes de cursos intermitente

**Archivo**: `app/api/admin/uploads/course-image/route.ts`

**Flujo actual**:
1. Cliente sube imagen via `POST /api/admin/uploads/course-image` (multipart/form-data)
2. Servidor valida tipo, tamaño, magic bytes
3. Servidor guarda archivo en `public/uploads/courses/${filename}`
4. Servidor retorna `{ url: "/uploads/courses/${filename}" }`
5. **Cliente debe actualizar el curso** con la URL retornada → `PATCH /api/admin/courses/[uuid]` con `{ coverUrl: "/uploads/courses/..." }`

**Causa probable**:
- El paso 5 (PATCH del curso) falla silenciosamente o no se ejecuta
- La URL se retorna correctamente pero el cliente no la persiste en el modelo del curso
- Posible race condition: el cliente muestra la imagen antes de que el PATCH se complete
- El campo en el modelo del curso para la imagen podría ser `coverUrl`, `thumbnailUrl`, o `imageUrl`

**Investigación requerida**:
1. Revisar el modelo `models/courses.ts` — ¿qué campo almacena la URL de imagen?
2. Revisar el formulario de curso en `app/admin/courses/course-form.tsx` — ¿cómo se maneja el upload?
3. Verificar que después del upload exitoso, se llama a PATCH con la URL
4. Verificar que el PATCH no tiene errores de validación Zod (¿acepta el campo de imagen?)
5. Verificar que la respuesta del PATCH se refleja en la UI

**Solución propuesta** (a confirmar):
- Asegurar que el formulario de curso llama a `PATCH /api/admin/courses/[uuid]` con `{ coverUrl }` después del upload
- Agregar manejo de errores explícito si el PATCH falla
- Opcional: Hacer que el endpoint de upload acepte un `courseUuid` y actualice el curso automáticamente (transacción atómica upload + update)

---

## Fase 9: Build y Verificación

### Comandos de verificación
```bash
bun run lint          # Verificar linting
bun run tsc --noEmit  # Verificar tipos TypeScript
bun run build         # Verificar build completo
```

### Ejecución de tests
```bash
# Tests API (todos los módulos)
bunx playwright test --config playwright.config.ts tests/api/

# Test específico
bunx playwright test tests/api/auth.e2e.ts

# Con reporte HTML
bunx playwright test --reporter=html
```

### CI/CD
- En CI, configurar `PLAYWRIGHT_BASE_URL` para apuntar al servidor de staging
- Configurar `MONGODB_URL` para base de datos de test (aislada)
- `PLAYWRIGHT_SKIP_WEB_SERVER=1` en CI (el servidor ya está corriendo)

---

## Fase 10: Documentación y Changelog

### Actualizar AGENTS.md
Agregar al inventario de endpoints (secciones nuevas):
- **CRM endpoints** (17 endpoints)
- **Email Marketing endpoints** (21 endpoints)
- **AI Agents endpoints** (2 endpoints)
- **Endpoints adicionales**: subscription-plans, search, translations, overview

### CHANGELOG.md
Registrar cada bug fix y cada archivo de test creado.

---

## Inventario Completo de Archivos de Test

| Archivo | Endpoints | Dependencias |
|---------|-----------|--------------|
| `tests/api/setup.ts` | — (helpers) | `@playwright/test` |
| `tests/api/auth.e2e.ts` | 12 endpoints auth | setup.ts |
| `tests/api/admin.e2e.ts` | ~50 endpoints admin CRUD | setup.ts |
| `tests/api/crm.e2e.ts` | 17 endpoints CRM | setup.ts |
| `tests/api/email.e2e.ts` | 21 endpoints email | setup.ts |
| `tests/api/agents.e2e.ts` | 2 endpoints AI | setup.ts |
| `tests/api/public.e2e.ts` | ~15 endpoints públicos | setup.ts |
| `tests/api/sales.e2e.ts` | ~5 endpoints ventas | setup.ts |

## Resumen de Gaps Detectados

| Gap | Severidad | Acción |
|-----|-----------|--------|
| No existe `/api/admin/crm/tags/[uuid]` | Baja | Planificar implementación futura |
| No existe `/api/me/enrollments` | Media | Planificar endpoint para dashboard estudiante |
| No existe `/api/me/payments` | Media | Planificar endpoint para historial de pagos |
| No existe `/api/me/subscription` | Media | Planificar endpoint para estado de suscripción |
| No existe `/api/coupons/[code]/validate` público | Baja | La validación ocurre dentro del checkout |
| No existe `/api/user-auth/preferences` como endpoint | Baja | Implementado como server action en página |
| CRM/Email/Agentes no documentados en AGENTS.md | Media | Agregar al inventario |
| `sameSite: "strict"` en cookie de operador | Media | Puede bloquear navegación cross-site |

---

## Orden de Ejecución Recomendado

1. **Fase 0** — Setup (crear `tests/api/setup.ts`)
2. **Fase 8** — Bug fixes (corregir antes de testear para no tener tests rotos)
3. **Fase 1** — Auth (base para todo lo demás)
4. **Fase 2** — Admin CRUD (el volumen más grande)
5. **Fase 6** — Públicos/Estudiante
6. **Fase 7** — Sales
7. **Fase 3** — CRM
8. **Fase 4** — Email
9. **Fase 5** — AI Agents
10. **Fase 9** — Build y verificación final
11. **Fase 10** — Documentación
