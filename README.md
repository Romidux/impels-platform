# Impels Commerce

> La forma más fácil de crear una tienda online para emprendedores y PYMEs de LATAM.

Impels Commerce es una plataforma SaaS multi-tenant que permite a cualquier negocio tener su propio catálogo digital en minutos, optimizado para venta por WhatsApp y redes sociales. Cada tienda opera en su propio subdominio (`{slug}.impels.com`) con su catálogo, gestión de pedidos e identidad visual personalizable.

---

## Stack técnico

| Capa | Tecnología |
|:---|:---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS v4 + Radix UI |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Autenticación | Supabase Auth |
| Storage | Supabase Storage |
| Estado global | Zustand |
| Animaciones | Framer Motion |
| Despliegue | Vercel |

---

## Requisitos previos

- **Node.js** v20 o superior
- **npm** v10 o superior
- Cuenta en [Supabase](https://supabase.com) (plan gratuito alcanza para desarrollo)
- Cuenta en [Vercel](https://vercel.com) (para producción)

---

## Setup local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Romidux/impels-platform.git
cd impels-platform
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. Anotar la **Project URL** y la **anon public key** (en Project Settings → API)

### 4. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus valores reales (ver tabla de variables más abajo).

### 5. Inicializar la base de datos

En el **SQL Editor** de Supabase, ejecutar el contenido completo de:

```
supabase/schema.sql
```

> ⚠️ Este script es **destructivo** — hace `DROP SCHEMA public CASCADE`. Usarlo solo en proyectos nuevos o de desarrollo. Para bases de datos existentes, aplicar las migraciones en `supabase/migrations/` en orden numérico.

### 6. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

---

## Variables de entorno

| Variable | Descripción | Ejemplo |
|:---|:---|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | `https://abcdef.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon de Supabase | `eyJh...` |
| `NEXT_PUBLIC_APP_URL` | URL base de la app | `http://localhost:3000` |
| `SUPER_ADMIN_EMAILS` | Emails con acceso a `/admin`, separados por coma | `admin@tudominio.com` |

Copiar `.env.example` como punto de partida.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (marketing)/        # Landing page pública
│   ├── dashboard/          # Panel de administración (auth required)
│   │   ├── products/
│   │   ├── orders/
│   │   ├── store/          # Configuración de tienda (identidad, apariencia, etc.)
│   │   ├── customers/
│   │   ├── coupons/
│   │   └── apps/           # Integraciones (Meta Pixel, Google Analytics)
│   ├── store/[slug]/       # Storefront público por slug
│   ├── admin/              # Super admin (acceso restringido)
│   ├── login/
│   ├── register/
│   └── onboarding/
├── components/
│   ├── dashboard/          # Componentes del panel admin
│   ├── storefront/         # Templates del storefront (minimal, modern)
│   └── ui/                 # Componentes UI compartidos
├── lib/
│   ├── supabase/           # Clientes server/client de Supabase
│   ├── types.ts            # Tipos TypeScript centralizados
│   └── utils.ts            # Utilidades compartidas
└── middleware.ts            # Auth guard + routing multi-tenant
supabase/
├── schema.sql              # Schema completo (fresh install)
├── schema_v2.sql           # Schema v2 con RLS hardening (fresh install)
└── migrations/             # Migraciones incrementales numeradas
```

---

## Cómo funciona el multi-tenant

Cada tienda registrada tiene un `slug` único. El routing multi-tenant funciona así:

- **Desarrollo**: `http://{slug}.localhost:3000`
- **Producción**: `https://{slug}.impels.com`

El middleware en `src/middleware.ts` protege automáticamente las rutas `/dashboard` y `/admin`. Las rutas `/store/[slug]/*` son públicas y no requieren autenticación.

---

## Templates de storefront

| Template | Estado | Descripción |
|:---|:---|:---|
| **Minimal** | ✅ Disponible | Catálogo limpio, blanco y negro, ideal para mostrar productos sin distracciones |
| **Modern** | 🔜 Próximamente | Más dinámico y visual, con hero y marca protagonista |
| **Brand** | 🔜 Próximamente | Mayor énfasis en identidad visual |

---

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter (ESLint)
npm run typecheck    # Verificación de tipos (TypeScript)
npm run format       # Formatear código (Prettier)
npm run format:check # Verificar formato sin modificar
npm run validate     # typecheck + lint + build (pre-deploy)
```

---

## Migraciones

Las migraciones en `supabase/migrations/` son scripts SQL incrementales, numerados, seguros de ejecutar contra una base de datos existente.

Para aplicar una migración:
1. Abrir el **SQL Editor** en Supabase
2. Pegar el contenido del archivo de migración
3. Ejecutar

| Archivo | Descripción |
|:---|:---|
| `005_customers.sql` | Tabla de clientes |
| `006_checkout_methods.sql` | Métodos de pago y envío |
| `006b_customers_backfill.sql` | Backfill de datos de clientes |
| `007_admin_actions_log.sql` | Log de acciones de super admin |
| `008_coupons.sql` | Sistema de cupones |
| `008b_coupons_rls.sql` | RLS para cupones |
| `009_phase4b_iteration1.sql` | Backend fase 4b |
| `010_rls_hardening.sql` | Endurecimiento de RLS + storage multi-tenant |

---

## Deploy en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Agregar todas las variables de entorno (ver tabla arriba)
3. Vercel detecta Next.js automáticamente — no requiere configuración adicional
4. Configurar los dominios wildcard `*.impels.com` para el multi-tenant (requiere plan Pro de Vercel)

---

## Licencia

Proyecto privado — todos los derechos reservados.
