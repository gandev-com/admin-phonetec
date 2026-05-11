# Backend — Cambios de endpoints requeridos por el nuevo UI

Stack: NestJS + Prisma · API REST · Prefijo `/`  
OpenAPI existente: `openapi.json` en la raíz  
Versión actual del frontend: Next.js 15 + React Query — compilado y en producción

---

## Contexto

El frontend acaba de recibir un rediseño completo (mayo 2026).  
Se añadieron nuevas vistas y componentes que consumen la API de formas que el backend actual **no soporta del todo**:

1. **Command Palette** — búsqueda global unificada (órdenes + clientes en una sola query)
2. **Dashboard KPI Strip** — el endpoint `/reports/stats` debe devolver `pendingRevenue` de forma fiable
3. **Dashboard Active Orders Board** — necesita que `activeFirst` y `include=customer,device` funcionen correctamente juntos
4. **Urgent Alert en header** — `isUrgent=true` + `include=customer,device` + `limit=3`
5. **StatusPill editable** — cambio de estado inline desde el dashboard sin navegar al detalle
6. **Activity feed (RecentFeed)** — necesita campo `updatedAt` y `lastStatusChange` en el listado
7. **Firma de recepción** — nuevo endpoint para guardar la firma digital al entregar el dispositivo en el taller

---

## 1. NUEVO ENDPOINT — Búsqueda global unificada

### `GET /search`

Usado por: `CommandPalette` (⌘K) cuando el usuario escribe texto  
Frecuencia: cada keystroke con debounce de 300 ms

**Query params:**
```
q: string (required, minLength: 1)
limit?: number (default: 5 per entity type)
```

**Response esperado:**
```jsonc
{
  "reports": [
    {
      "id": "uuid",
      "orderNumber": "ORD-28260583",
      "currentStatus": "IN_DIAGNOSIS",
      "isUrgent": false,
      "customer": { "firstName": "Gustavo", "lastName": "Cevallos" },
      "device":   { "brand": { "name": "Apple" }, "model": "iPhone 14 Pro Max" }
    }
  ],
  "customers": [
    {
      "id": "uuid",
      "firstName": "Gustavo",
      "lastName":  "Cevallos",
      "phone":     "612345678",
      "email":     "gustavo@example.com"
    }
  ]
}
```

**Lógica de búsqueda:**
- `reports`: busca en `orderNumber`, `customer.firstName`, `customer.lastName`, `device.model`  
  → JOIN `customer` + `device.brand` siempre (como si fuera `include=customer,device`)
- `customers`: busca en `firstName`, `lastName`, `email`, `phone`, `document`
- Máximo `limit` resultados **por entidad** (no total)
- Ordenar por `createdAt DESC`
- Sin paginación (single shot, optimizado para velocidad < 200 ms)

**Seguridad:** requiere JWT Bearer (misma guard que el resto)

---

## 2. MEJORA — `GET /reports/stats`

Endpoint existente · necesita los siguientes cambios:

### 2a. Garantizar que `pendingRevenue` siempre es un número

**Problema actual:** el frontend tiene que normalizar el formato porque a veces llega como array de Prisma `groupBy`.  
**Cambio:** el campo `pendingRevenue` debe ser siempre `number` (no null, no array). Si no hay datos, devolver `0`.

### 2b. Añadir campo `lastUpdatedAt` al summary

El frontend quiere mostrar "última actualización" en el header de stats.

```typescript
// Nuevo campo en la respuesta
lastUpdatedAt: string  // ISO 8601 — createdAt del report más recientemente modificado
```

### 2c. Documentar el schema en OpenAPI con `@ApiResponse`

Actualmente el endpoint no tiene `@ApiResponse` y la respuesta aparece vacía en el spec.  
Añadir el decorator con la forma exacta de la respuesta para que `openapi-typescript` la genere correctamente.

**Schema esperado completo:**
```typescript
class ReportStatsDto {
  total: number
  urgentOpen: number
  pendingRevenue: number
  totalRevenue: number
  lastUpdatedAt: string
  byStatus: Record<ReportStatus, number>         // siempre objeto plano, nunca array
  byPaymentStatus: Record<PaymentStatus, number> // idem
}
```

---

## 3. MEJORA — `GET /reports` — parámetros de include + activeFirst

### 3a. Verificar que `include=customer,device` carga `device.brand`

**Problema:** el frontend accede a `report.device.brand.name` y a veces llega `null` aunque el device tenga brand.  
**Cambio:** cuando `include` contiene `device`, incluir siempre `{ device: { include: { brand: true } } }` en el Prisma query, no solo `{ device: true }`.

### 3b. Verificar que `activeFirst=true` ordena correctamente con `sortBy`

Cuando se envían `activeFirst=true` y `sortBy=createdAt&order=desc` juntos, los resultados deben:
1. Primero las órdenes con `currentStatus` en `[RECEIVED, IN_DIAGNOSIS, ..., READY_FOR_PICKUP]`
2. Dentro de cada grupo, ordenar por `createdAt DESC`

Actualmente parece que `activeFirst` ignora el `sortBy` secundario.

### 3c. Añadir `updatedSince` como parámetro de filtro

El feed de actividad reciente necesita pedir órdenes actualizadas en las últimas N horas.

```
updatedSince?: string  // ISO 8601 — devuelve registros con updatedAt >= valor
```

---

## 4. NUEVO ENDPOINT — Cambio de estado inline

### `PATCH /reports/:id/status`

Usado por: `StatusPill` editable en el dashboard y tablero Kanban  
Diferencia con `PATCH /reports/:id`: endpoint especializado más ligero que no requiere enviar todos los campos del `UpdateReportDto`.

**Body:**
```jsonc
{
  "status": "IN_REPAIR",                // required — nuevo ReportStatus
  "technicianId": "uuid",               // optional
  "internalNote": "Diagnóstico: pantalla rota" // optional — añade nota interna sin sobreescribir
}
```

**Response:** el `Report` completo con `include=customer,device` (para actualizar el estado en caché del cliente sin refetch).

**Reglas de transición** (validar en el backend, no solo en el frontend):

| Desde → Hasta | Permitido | Notas |
|---|---|---|
| Cualquiera → `DELIVERED` | ❌ | Usar el flujo `/deliver` con consentimiento |
| Cualquiera → `CANCELLED` | ✅ | Solo con nota requerida |
| `DELIVERED` → cualquiera | ❌ | Orden finalizada, no reversible |
| `IRREPARABLE` → cualquiera | ❌ | Orden finalizada |
| Resto | ✅ | Libre |

**Respuesta de error en transición inválida:**
```jsonc
// HTTP 422
{
  "statusCode": 422,
  "message": "Transición de estado no permitida: DELIVERED → IN_REPAIR",
  "allowedTransitions": ["DELIVERED"]
}
```

---

## 5. NUEVO ENDPOINT — Firma de recepción (consentimiento de entrada)

### `POST /reports/:id/reception-consent`

Usado por: `ReceptionWizard` — paso "Firma" tras crear la orden  
El cliente firma el documento de recepción cuando deja el dispositivo en el taller.

**Request:** `multipart/form-data`

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `file` | binary | ✅ | PNG de la firma digital o PDF/JPEG escaneado |
| `signedBy` | string | ✅ | Nombre del firmante |

**Response:** `Report` completo (igual que `/reports/:id`)

**Comportamiento:**
- Guarda el documento en la misma tabla `ConsentDocument` pero con `type: "RECEPTION"`
- No cambia el `currentStatus` de la orden (solo adjunta el documento)
- Si ya existe un `ConsentDocument` de recepción para esa orden, se sobreescribe (PUT semántico)

**Schema sugerido en Prisma:**
```prisma
model ConsentDocument {
  id        String   @id @default(uuid())
  reportId  String
  type      ConsentType  // RECEPTION | DELIVERY
  filePath  String
  signedBy  String
  signedAt  DateTime @default(now())
  report    Report   @relation(fields: [reportId], references: [id])
}

enum ConsentType {
  RECEPTION
  DELIVERY
}
```

> Si el modelo actual de `ConsentDocument` no tiene el campo `type`, añadirlo con valor por defecto `DELIVERY` para que las firmas de entrega existentes no se vean afectadas.

**Seguridad:** requiere JWT Bearer

---

## 6. MEJORA — `GET /reports/stats` — añadir `period` query param

El KPI de "Ingresos pendientes" actualmente muestra el total histórico. El frontend quiere poder filtrar por período.

```
period?: 'today' | 'week' | 'month' | 'all'   // default: 'all'
```

Afecta a: `totalRevenue`, `pendingRevenue`, y el contador de `total`.  
**No afecta** a `urgentOpen` ni `byStatus` (esos siempre son el estado actual).

---

## 6. MEJORA — `GET /activity-log` — añadir filtro por `entityId` + expand

### 6a. Parámetro `entityId`

```
entityId?: string   // UUID del report/customer/device
```

Permite cargar el historial de una orden específica sin traer todo el log.  
Usado por el futuro `OrderTimeline` (detalle de orden).

### 6b. Campo `actor` expandido

Actualmente solo llega `userEmail`. Añadir:

```typescript
actor?: {
  id: string
  firstName: string
  lastName: string
  email: string
}
```

Si el `userId` existe, resolver el usuario completo; si no (acción de sistema), dejar `actor: null`.

---

## 7. MEJORA — `GET /customers/:id/reports` (o `GET /reports?customerId=`)

Añadir `include=device` a los resultados para que en el detalle de cliente se pueda mostrar el dispositivo de cada orden sin un request adicional.

Actualmente al acceder a `/customers/:id` el frontend hace un segundo request para cada orden. Con `include=device` en la lista de reports del cliente se elimina ese N+1.

---

## 8. MEJORA — `GET /reports/:id` — incluir `consentDocuments` como array

### 8a. Devolver todos los documentos firmados

Actualmente `GET /reports/:id` devuelve solo `consentDocument` (singular, delivery).  
El frontend ahora muestra tanto la firma de recepción como la de entrega.

**Cambio:** Incluir siempre `consentDocuments` (array) con todos los `ConsentDocument` de la orden.

```typescript
// Añadir al include del findOne
include: {
  ...existingIncludes,
  consentDocuments: true,   // devuelve array con RECEPTION + DELIVERY
}
```

**Campo nuevo en cada `ConsentDocument`:**

```typescript
fileUrl: string  // URL pública completa para descargar/previsualizar el archivo
                 // Ej: "https://api.phonetec.com/uploads/consent/firma-recepcion-ORD-001.png"
```

> El frontend construye la URL como `API_URL + "/" + filePath` como fallback,
> pero es preferible que el backend devuelva `fileUrl` explícitamente para no
> depender de la estructura interna del servidor de archivos.

### 8b. Servir archivos de firma como estáticos

Los archivos PNG/PDF de firma deben ser accesibles via URL pública autenticada:

```
GET /uploads/:filename   →  devuelve el archivo binario con Content-Type correcto
```

O bien a través del mismo endpoint que ya sirve imágenes de dispositivos (si existe).
Si los archivos se guardan en disco, NestJS `ServeStaticModule` puede exponer la carpeta.
Si se guardan en S3/cloud, el `fileUrl` ya es la URL pública.

---

## 9. MEJORA — `GET /reports/:id` — incluir relaciones completas en detalle

Para la vista de detalle de orden, el frontend necesita todas estas relaciones:

```typescript
include: {
  customer: true,
  device: { include: { brand: true } },
  technician: true,
  parts: true,
  consentDocuments: true,
}
```

Verificar que el endpoint de detalle (`getOne`) ya las incluye todas.
Si actualmente `getOne` usa un include distinto al del listado, unificar o ampliar.

---


| # | Endpoint | Tipo | Prioridad | Usado por |
|---|---|---|---|---|
| 1 | `GET /search` | NUEVO | 🔴 Alta | CommandPalette (⌘K) |
| 4 | `PATCH /reports/:id/status` | NUEVO | 🔴 Alta | StatusPill editable, Kanban |
| 2 | `GET /reports/stats` | MEJORA | 🟡 Media | KPI Strip, header urgentes |
| 3 | `GET /reports` | MEJORA | 🟡 Media | ActiveOrdersBoard, UrgentAlert |
| 6 | `GET /activity-log` | MEJORA | 🟡 Media | OrderTimeline (próximo) |
| 5 | `GET /reports/stats?period` | MEJORA | 🟢 Baja | KPI ingresos por período |
| 7 | `GET /reports?customerId` | MEJORA | 🟢 Baja | Detalle de cliente |

---

## Notas técnicas

- **No romper compatibilidad**: todos los campos nuevos son opcionales o aditivos. El frontend ya maneja respuestas parciales.
- **CORS**: el endpoint `/search` debe estar en la whitelist de CORS igual que el resto.
- **Rate limiting**: considerar `throttle` más agresivo en `/search` (máx. 30 req/min por usuario).
- **Tests**: cada endpoint nuevo debe tener al menos un test e2e de happy path y un test de error (401, 422).
- **OpenAPI decorators**: todos los endpoints nuevos o modificados deben tener `@ApiOperation`, `@ApiResponse(200)` y `@ApiBearerAuth()` para que el spec se regenere correctamente y el frontend pueda correr `pnpm types:api`.
