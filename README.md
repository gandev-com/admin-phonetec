# PhoneTec Admin Frontend

Frontend administrativo en Next.js 15 + TypeScript + shadcn/ui, conectado al backend NestJS de PhoneTec.

## Requisitos

- Node.js 20+
- pnpm 10+
- Backend de PhoneTec ejecutandose en `http://localhost:3001`

## Configuracion

1. Instala dependencias:

```bash
pnpm install
```

2. Variables de entorno:

```bash
cp .env.example .env.local
```

`.env.local` debe contener:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

3. Ejecuta el proyecto:

```bash
pnpm dev
```

Abrir `http://localhost:3000`.

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`

## Modulos iniciales

- `/login`: login JWT contra `POST /auth/login`
- `/dashboard`: vista protegida
- `/customers`: tabla y busqueda simple con datos reales
- `/users`: tabla y busqueda simple con datos reales
- `/profile`: datos de usuario autenticado desde `GET /auth/me`

## Arquitectura

- `src/app`: App Router y layouts
- `src/features`: modulos de negocio (`auth`, `users`, `customers`)
- `src/lib/api`: cliente Axios + interceptores + servicios
- `src/lib/schemas`: validaciones Zod
- `src/store`: estado global (auth) con Zustand
- `src/types`: contratos tipados alineados al backend
