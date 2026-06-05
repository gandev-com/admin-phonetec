# Guía de despliegue — Admin Phonetec + API NestJS

Stack de producción: **Docker Compose** + **Nginx** + **Certbot** en Ubuntu 22.04 LTS.

---

## ¿Por qué Docker y no PM2 + bare-metal?

| | Docker Compose | PM2 + bare-metal |
|---|---|---|
| Reproducibilidad | ✅ Idéntico en dev, staging y prod | ❌ Depende de la versión de Node en el servidor |
| Actualización | `docker compose pull && up -d` | `git pull → build → pm2 reload` |
| Rollback | Cambiar el tag de imagen y relanzar | Requiere revertir el commit y reconstruir |
| Aislamiento | ✅ Cada servicio en su contenedor | ❌ Todos comparten el mismo Node |
| Curva de aprendizaje | Media | Baja |
| RAM extra | ~100 MB (daemon) | Ninguna |

**Conclusión:** Docker Compose es la opción más eficiente para mantenimiento a largo plazo. El coste de aprendizaje inicial se recupera en el primer despliegue urgente.

---

## Arquitectura

```
Internet
   │
   ▼
Nginx (80/443)
   ├── api.tudominio.com  ──► api:3001   (NestJS)
   └── tudominio.com      ──► admin:3000 (Next.js)
                                │
                           uploads volume (compartido con API)
```

---

## 1. Archivos que ya están en este repositorio

| Archivo | Propósito |
|---|---|
| `Dockerfile` | Imagen de producción del frontend (multi-stage, standalone) |
| `.dockerignore` | Excluye `node_modules` y `.next` del contexto de build |
| `docker-compose.server.yml` | Referencia del compose que vive en el servidor |
| `next.config.ts` | `output: "standalone"` habilitado — necesario para el Dockerfile |

La API NestJS necesita su propio `Dockerfile` en su repositorio (ver sección 3).

---

## 2. Requisitos en el servidor

```bash
# Docker Engine
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # para no usar sudo en cada comando
newgrp docker

# Verificar
docker --version          # → 26.x.x
docker compose version    # → 2.x.x
```

---

## 3. Dockerfile para la API NestJS

Crea este archivo en la raíz del repositorio de la API:

```dockerfile
# ── Stage 1: dependencias ─────────────────────────────────────────────────────
FROM node:20-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ── Stage 3: imagen final ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nestjs
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=deps    /app/node_modules ./node_modules
COPY package.json ./
USER nestjs
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

Y su `.dockerignore`:

```
dist/
node_modules/
.env
*.env
```

---

## 4. Registro de imágenes (GitHub Container Registry — gratuito)

Ambas imágenes se construyen en tu máquina local (o en CI) y se suben al registro. El servidor solo descarga.

```bash
# Autenticarse (una sola vez)
echo $GITHUB_TOKEN | docker login ghcr.io -u TU_USUARIO --password-stdin

# ── Frontend ──────────────────────────────────────────────────────────────────
cd /ruta/al/frontend
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.tudominio.com \
  -t ghcr.io/TU_USUARIO/phonetec-admin:latest \
  -t ghcr.io/TU_USUARIO/phonetec-admin:v1.0.0 \
  .
docker push ghcr.io/TU_USUARIO/phonetec-admin:latest
docker push ghcr.io/TU_USUARIO/phonetec-admin:v1.0.0

# ── API ───────────────────────────────────────────────────────────────────────
cd /ruta/a/la/api
docker build \
  -t ghcr.io/TU_USUARIO/phonetec-api:latest \
  -t ghcr.io/TU_USUARIO/phonetec-api:v1.0.0 \
  .
docker push ghcr.io/TU_USUARIO/phonetec-api:latest
docker push ghcr.io/TU_USUARIO/phonetec-api:v1.0.0
```

> **Importante:** `NEXT_PUBLIC_API_URL` se incrusta en el bundle durante el build. Si cambias el dominio, debes reconstruir y volver a subir la imagen.

---

## 5. Setup inicial del servidor

### 5.1 Estructura de directorios

```bash
sudo mkdir -p /var/www/phonetec/nginx
sudo chown -R $USER:$USER /var/www/phonetec
cd /var/www/phonetec
```

### 5.2 Copiar el docker-compose

Copia el contenido de `docker-compose.server.yml` de este repo a `/var/www/phonetec/docker-compose.yml` y edita `TU_USUARIO` con tu usuario de GitHub.

### 5.3 Variables de entorno

**`/var/www/phonetec/api.env`**
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://usuario:contraseña@host:5432/phonetec
JWT_SECRET=secreto-largo-y-aleatorio-minimo-32-caracteres
JWT_REFRESH_SECRET=otro-secreto-diferente-minimo-32-caracteres
UPLOADS_DIR=/app/uploads
```

**`/var/www/phonetec/admin.env`**
```env
# Las variables NEXT_PUBLIC_* ya están en la imagen
# Aquí solo van variables de runtime de Node (si las hay)
PORT=3000
```

> Estos archivos nunca deben entrar en el repositorio. Añade `*.env` al `.gitignore` del servidor.

### 5.4 Configuración de Nginx

**`/var/www/phonetec/nginx/phonetec.conf`**
```nginx
# Redirigir HTTP → HTTPS
server {
    listen 80;
    server_name tudominio.com www.tudominio.com api.tudominio.com;

    # Necesario para que Certbot pueda renovar sin HTTPS
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# API
server {
    listen 443 ssl;
    server_name api.tudominio.com;
    client_max_body_size 20M;

    ssl_certificate     /etc/letsencrypt/live/api.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.tudominio.com/privkey.pem;

    location / {
        proxy_pass         http://api:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 443 ssl;
    server_name tudominio.com www.tudominio.com;

    ssl_certificate     /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;

    location / {
        proxy_pass         http://admin:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

### 5.5 Obtener certificados TLS (primera vez)

Los certificados deben existir antes de levantar Nginx con HTTPS. El truco es usar un conf temporal solo con HTTP:

```bash
# 1. Arrancar solo certbot y nginx con la conf de HTTP (sin bloques SSL)
#    Comenta temporalmente los bloques "listen 443" del conf de arriba,
#    luego:
docker compose up -d nginx certbot

# 2. Obtener los certificados
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d tudominio.com \
  -d www.tudominio.com \
  -d api.tudominio.com \
  --email tu@email.com \
  --agree-tos \
  --no-eff-email

# 3. Descomentar los bloques SSL en el conf de Nginx y recargar
docker compose exec nginx nginx -s reload
```

### 5.6 Levantar todos los servicios

```bash
cd /var/www/phonetec

# Autenticar Docker en ghcr.io (una sola vez en el servidor)
echo $GITHUB_TOKEN | docker login ghcr.io -u TU_USUARIO --password-stdin

# Descargar imágenes y arrancar
docker compose pull
docker compose up -d

# Verificar que todo está corriendo
docker compose ps
docker compose logs --tail=50
```

---

## 6. Workflow de actualización

### Actualización normal (nueva versión)

```bash
# En tu máquina local — construir y subir las nuevas imágenes
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.tudominio.com \
  -t ghcr.io/TU_USUARIO/phonetec-admin:latest . && \
  docker push ghcr.io/TU_USUARIO/phonetec-admin:latest

# En el servidor — descargar y reiniciar sin downtime
cd /var/www/phonetec
docker compose pull
docker compose up -d --no-deps admin   # solo actualiza el frontend
docker compose up -d --no-deps api     # solo actualiza la API
```

### Rollback inmediato

```bash
# Volver a una versión anterior por tag
docker compose stop admin
docker compose rm -f admin
# Editar docker-compose.yml: cambiar :latest por :v1.0.0
docker compose up -d admin
```

---

## 7. Mantenimiento habitual

```bash
# Ver estado de los contenedores
docker compose ps

# Logs en tiempo real
docker compose logs -f api
docker compose logs -f admin

# Reiniciar un servicio
docker compose restart api

# Ver uso de recursos
docker stats

# Limpiar imágenes antiguas (libera espacio en disco)
docker image prune -f

# Renovación manual de certificados TLS (Certbot lo hace automáticamente cada 12h)
docker compose run --rm certbot renew
docker compose exec nginx nginx -s reload
```

---

## 8. Automatización con GitHub Actions (opcional pero recomendado)

Crea `.github/workflows/deploy.yml` en cada repositorio para que el push a `main` construya y suba la imagen automáticamente:

```yaml
name: Build & Push

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          push: true
          build-args: |
            NEXT_PUBLIC_API_URL=https://api.tudominio.com
          tags: |
            ghcr.io/${{ github.repository_owner }}/phonetec-admin:latest
            ghcr.io/${{ github.repository_owner }}/phonetec-admin:${{ github.sha }}
```

Tras el push, en el servidor solo hay que ejecutar:

```bash
cd /var/www/phonetec && docker compose pull && docker compose up -d
```

O automatizarlo con un webhook/cron si se quiere CD completo.

---

## 9. Resumen de variables de entorno

### Frontend — build-arg (se incrusta en la imagen)

| Variable | Ejemplo | Descripción |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.tudominio.com` | URL pública de la API |

### API — runtime (`api.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Conexión a PostgreSQL |
| `JWT_SECRET` | Secreto de tokens de acceso (≥32 chars) |
| `JWT_REFRESH_SECRET` | Secreto de refresh tokens (≥32 chars) |
| `UPLOADS_DIR` | Ruta interna del contenedor para archivos |
| `PORT` | `3001` |


---
