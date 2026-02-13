# 🐣 Mi Nido — Plan de Negocio MVP

## El Problema

Los jardines maternales en Argentina (0-3 años) gestionan todo con papel, WhatsApp y planillas Excel:
- **Comunicación con familias**: mensajes sueltos por WhatsApp, fotos mezcladas con chat personal
- **Asistencia**: planillas papel, difícil de consultar históricamente
- **Cobros y pagos**: cuadernos, recordatorios manuales, morosos difíciles de trackear
- **Legajos**: fichas médicas, autorizaciones, contactos de emergencia en carpetas físicas
- **Planificación pedagógica**: cuadernos o Word sueltos sin estructura
- **Comunicados**: fotocopias en mochilas que se pierden

Las directoras hacen malabares. Las familias se frustran. La info se pierde.

---

## La Solución: Mi Nido

Software de gestión integral para jardines maternales, pensado para Argentina. Simple, cálido, mobile-first.

**Propuesta de valor:** "Todo tu jardín en un solo lugar — para vos y las familias."

---

## Público Objetivo

### Mercado primario
- **Jardines maternales privados** (0-3 años) en Argentina
- Tamaño típico: 20-80 niños, 3-15 docentes
- ~15.000 jardines maternales privados en Argentina (estimación)

### Usuarios
| Rol | Necesidad principal |
|-----|-------------------|
| **Directora/Dueña** | Control, cobros, comunicación, cumplimiento normativo |
| **Docentes/Cuidadoras** | Registro diario, asistencia, comunicación con familias |
| **Familias (padres)** | Saber cómo está su hijo, pagar, recibir info |

---

## Funcionalidades MVP

### 🏠 Gestión del Jardín
- Alta de salas (ej: "Patitos", "Ositos") con docente asignada
- Calendario del jardín (feriados, eventos, reuniones)
- Datos institucionales

### 👶 Legajo Digital del Niño
- Datos personales, grupo familiar
- Ficha médica (alergias, medicación, obra social)
- Contactos de emergencia y autorizados a retirar
- Documentación (DNI, certificados) — upload de fotos/PDF
- Sala y turno asignado

### ✅ Asistencia
- Registro diario por sala (presente/ausente/justificado)
- Vista mensual para la familia
- Alertas por inasistencias consecutivas

### 📒 Cuaderno Digital (Diario del Día)
- Registro diario por sala: qué comió, si durmió, actividades, observaciones
- Fotos del día (galería privada por sala)
- Las familias lo ven en tiempo real desde la app
- **Esto es el killer feature** — reemplaza el cuaderno de comunicaciones

### 💬 Comunicados y Mensajes
- Comunicados del jardín (a todo el jardín o por sala)
- Mensajes directos jardín ↔ familia
- Confirmación de lectura
- Reemplaza el grupo de WhatsApp caótico

### 💰 Gestión de Cuotas
- Configuración de cuota mensual por sala/turno
- Registro de pagos (efectivo, transferencia, MercadoPago)
- Estado de cuenta por familia
- Recordatorios automáticos de vencimiento
- Reporte de morosos

### 👨‍👩‍👧 Portal de Familias
- App/web donde los padres ven:
  - Cuaderno digital del día
  - Fotos
  - Comunicados
  - Estado de pagos
  - Datos del legajo (pueden actualizar)

---

## Lo que NO es MVP (Fase 2+)

- Facturación electrónica (AFIP)
- Integración con MercadoPago para cobro online
- Planificación pedagógica con currículum
- Control de stock (pañales, insumos)
- Gestión de personal (sueldos, asistencia docentes)
- Reportes para inspecciones / DGCyE
- Chat en tiempo real
- Notificaciones push
- Multi-sede (cadenas de jardines)

---

## Stack Técnico Propuesto

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| **Frontend** | Next.js + Tailwind | SSR, rápido, buena UX mobile |
| **Backend** | Next.js API Routes o Node/Express | Simplicidad, mismo stack |
| **DB** | PostgreSQL | Relacional, robusto, gratis |
| **Auth** | NextAuth.js | Simple, soporta email + Google |
| **Storage** | S3/MinIO (Coolify) | Fotos y documentos |
| **Deploy** | Coolify (VPS actual) | Ya lo tenés, costo $0 extra |
| **Mobile** | PWA (Progressive Web App) | Sin App Store, instalable, push notifications |

### Arquitectura
```
[Familias - PWA] ──┐
                    ├──→ [Next.js App] ──→ [PostgreSQL]
[Jardín - Web]  ────┘         │
                              ├──→ [S3/MinIO] (fotos, docs)
                              └──→ [Email/Push] (notificaciones)
```

---

## Modelo de Negocio

### Pricing (SaaS mensual)
| Plan | Precio | Incluye |
|------|--------|---------|
| **Semillita** (gratuito) | $0 | 1 sala, 15 niños, funciones básicas |
| **Brote** | $15.000/mes (~USD 12) | Hasta 3 salas, 50 niños, todas las funciones |
| **Jardín** | $30.000/mes (~USD 25) | Ilimitado, soporte prioritario, reportes |

*Precios en ARS ajustables. Pensados para ser accesibles vs. el costo de NO tenerlo.*

### Por qué funciona
- **Bajo costo** para el jardín vs. el ahorro de tiempo
- **Stickiness alto**: una vez que cargan los datos, no se van fácil
- **Boca a boca**: las familias lo ven y lo recomiendan a otros jardines
- **Freemium**: el plan gratis genera adopción, el crecimiento natural sube de plan

---

## Go-to-Market

### Fase 1: Validación (Mes 1-2)
1. Conseguir **3-5 jardines beta** en San Juan / zona conocida
2. Entrevistas con directoras para validar prioridades
3. MVP funcional con cuaderno digital + asistencia + comunicados
4. Uso gratis a cambio de feedback

### Fase 2: Lanzamiento (Mes 3-4)
1. Incorporar cobros/cuotas al MVP
2. Landing page con demo
3. Instagram + Facebook (las directoras están ahí)
4. Grupos de Facebook de jardines maternales
5. Primeros clientes pagos

### Fase 3: Crecimiento (Mes 5+)
1. Referidos: "Invitá otro jardín y te damos 1 mes gratis"
2. Contacto directo con asociaciones de jardines
3. Presencia en ferias educativas
4. SEO: "software gestión jardín maternal argentina"

---

## Competencia

| Competidor | Debilidad |
|-----------|-----------|
| **Aula365 / plataformas educativas** | Pensadas para primaria+, no maternal |
| **Kindertap (Chile)** | No localizado para Argentina |
| **Gestión manual (Excel/WhatsApp)** | Es el competidor real — y es terrible |
| **Apps genéricas (Trello, Google)** | No son específicas, requieren armar todo |

**Diferencial de Mi Nido:**
- Pensado 100% para jardines maternales argentinos
- Lenguaje y UX familiar ("sala", "seño", "cuota", "turno")
- Precios en pesos, integración local
- Simple — no requiere capacitación

---

## Métricas Clave (KPIs)

| Métrica | Objetivo Mes 3 | Objetivo Mes 6 |
|---------|----------------|----------------|
| Jardines activos | 5 | 20 |
| Familias usando la app | 100 | 500 |
| Entradas diarias al cuaderno | 80% de días hábiles | 90% |
| MRR (ingreso recurrente) | $50.000 ARS | $300.000 ARS |
| Churn mensual | <10% | <5% |

---

## Cronograma MVP

| Semana | Entregable |
|--------|-----------|
| 1 | Diseño UI/UX, modelo de datos, setup proyecto |
| 2-3 | Auth + gestión de jardín + salas + legajo niños |
| 4-5 | Cuaderno digital + fotos + asistencia |
| 6-7 | Comunicados + portal familias (PWA) |
| 8 | Gestión de cuotas y pagos |
| 9-10 | Testing con jardines beta, ajustes |
| 10 | Lanzamiento beta |

---

## Inversión Inicial

| Concepto | Costo |
|---------|-------|
| Hosting (Coolify/VPS actual) | $0 extra |
| Dominio (minido.com.ar o similar) | ~$5.000/año |
| Diseño logo/branding | $20.000-50.000 (o lo hacemos con IA) |
| Tiempo de desarrollo | Tu tiempo 💪 |
| **Total estimado** | **< $50.000 ARS** |

---

## Nombre y Dominio

- **Mi Nido** 🐣
- Dominio sugerido: `minido.com.ar` / `minido.app` / `minido.ar`
- Tagline: *"Todo tu jardín en un solo lugar"*

---

*Creado: 12 de febrero 2026*
