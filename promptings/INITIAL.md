# Interjudaica Web

Interjudaica es un portal web que ofrece cursos judaicos.
Los usuarios pueden registrarse, iniciar sesión y comprar cursos, ademas de ver sus clases y certificados.
Está orientado a estados unidos, por lo cual debe estar todo en ingles y expresado en dolares.

Ademas, permite que los users se inscriban a la comunidad, que cuesta 19 USD/mes.
Hay un foro, el cual tiene threads para los cursos, y para la comunidad.




## Stack tecnologico
- Next.js
- TailwindCSS
- Stripe
- MongoDB
- Bunjs

Siempre buscar ser Bunjs first.

Ver en .env
- MONGODB_URI=mongodb://localhost
- MONGODB_DATABASE=interjudaica

Usar zod para todas las validaciones de schemas.
No usar mongosee, solo definir los schemas en zod y usarlos para validar los datos.
Usar el drive de mongodb nativo




## Stripe
Para los pagos del curso, se utiliza stripe. Para que sea simple, voy a generar los links a mano.


## cursos
En /admin se puede gestionar los cursos, usuarios, pagos, etc.

Los cursos tienen:
- Título
- Descripción
- Precio
- Imagen
- Video
- Certificado
- Duración
- Nivel
- Categoría
- Link de zoom
- Fecha de inicio
- Fecha de fin
- Link de pago de stripe

## Diseño
El diseño debe ser moderno y limpio, con un enfoque en la usabilidad y la accesibilidad.
El logo se encuentra en public/logo-interjudaica.png



## Webapp – Módulos y Pantallas (Frontend para estudiantes)
### Módulo Auth (público)

/login → formulario email + password
/register → nombre, apellido, email, password, confirmación
/forgot-password + /reset-password/[token]
/verify-email (opcional, pero recomendado)


### Módulo Home / Marketing

- / → Landing principal (hero, cursos destacados, comunidad, testimonios)
- /cursos → Listado de todos los cursos con filtros (precio, nivel, fecha)
- /curso/[slug] → Landing individual de cada curso:
Descripción, qué incluye, instructor (Rabino Yattah)
“Ediciones disponibles” (si hay varias fechas o versiones)
Materiales de muestra (PDF preview, video trailer)
CTA: “Comprar curso” o “Comprar con descuento Comunidad”
Precio normal vs precio con descuento (si es miembro)


### Módulo Comunidad

- /comunidad → Landing de venta de suscripción mensual
Beneficios claros (foro privado, papers del Rabino, descuento en cursos)
CTA: “Suscribirme por 19 USD/mes”

- /comunidad/papers → Listado de papers/artículos del Rabino (solo para miembros)


### Módulo Panel de Usuario (Dashboard privado)

- /dashboard → Página principal
- Mis cursos comprados (tarjetas)
- Mi suscripción Comunidad (estado + fecha de renovación + botón cancelar)
- Próximas clases en vivo (si se agregan después)
- Acceso rápido al foro


### Dentro de cada curso comprado:

- /curso/[slug]/clases → Listado de clases (módulos)
Cada clase tiene:
Video / audio
Material descargable (PDF, audios)
“Ver thread del foro de esta clase”


- /curso/[slug]/foro → Thread específico del curso (un solo hilo grande por curso o hilos por clase)


### Módulo Foro (simple pero funcional)

Foro por curso (solo accesible si compraste el curso)
Foro Comunidad (solo si tienes suscripción activa)
Diseño simple tipo “forum thread”:
Hilo principal + respuestas anidadas
Marcador de “leído” / notificaciones por email (opcional)
Moderación básica (Admin puede ocultar/borrar)


### Rutas protegidas con middleware de Next.js según rol.



## BACKOFFICE – Módulos y Pantallas (Admin)
Ruta base: /admin/* (protegida con login separado o mismo auth + rol Admin)

### Dashboard (/admin)
Estadísticas rápidas: usuarios totales, miembros Comunidad, cursos vendidos este mes, ingresos Stripe, usuarios activos.

### Usuarios (/admin/usuarios)
Listado + búsqueda + filtros (registrados, estudiantes, community)
Ver detalle de usuario: cursos comprados, suscripción, fecha de registro
Acciones: banear, resetear password, exportar CSV

### Cursos (/admin/cursos)
CRUD completo de cursos
Por curso: título, slug, descripción, precio, descuento Comunidad, imagen, ediciones
Gestión de clases dentro del curso (CRUD de módulos/clases)
Subida de materiales (PDF, video, audio) → se guardan en bucket (ej. Cloudinary o S3)

### Suscripciones Comunidad (/admin/suscripciones)
Listado de suscriptores activos y cancelados
Gestión manual de suscripciones (si Stripe falla)
Historial de pagos recurrentes

### Pagos (/admin/pagos)
Listado completo de transacciones Stripe
Filtros por tipo (curso one-time vs suscripción mensual)
Reembolsos manuales

### Contenido Papers (/admin/papers)
CRUD de los artículos/papes del Rabino (solo visibles para Community)

### Foro (/admin/foro)
Moderación global: ver todos los hilos (cursos + comunidad)
Borrar posts, marcar como destacado, etc.

### Analytics (/admin/analytics)
Integración directa con Google Analytics + reportes internos (cursos más vendidos, tasa de retención, etc.)