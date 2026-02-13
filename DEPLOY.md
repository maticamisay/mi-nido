# Deploy de Mi Nido 🐣

## Estado del Deployment

### ✅ Completado
- [x] Preparación del proyecto para producción
- [x] Dockerfile para backend (Node.js + Express)
- [x] Dockerfile para frontend (Next.js con output standalone)
- [x] Configuración de variables de entorno
- [x] API URLs centralizadas en `frontend/src/config/api.ts`
- [x] CORS configurado para producción
- [x] Docker-compose.yml creado
- [x] Build del frontend exitoso
- [x] Proyecto Mi Nido creado en Coolify (UUID: vcskcwo8k0cc8gsskow0oco4)
- [x] Environment "production" creado (UUID: n0ww8sg480w4ck8s844ss4o8)

### ⏳ En Progreso
- [ ] Subir código a GitHub para integración con Coolify
- [ ] Crear aplicaciones backend y frontend en Coolify
- [ ] Configurar base de datos MongoDB
- [ ] Deployment final

### 🔧 Configuración de Producción

#### Backend (`/backend/`)
- **Dockerfile**: ✅ Creado
- **Puerto**: 5000 (configurable via PORT env var)
- **Variables de entorno requeridas**:
  - `MONGODB_URI`: mongodb://minido:miNido2026Secure!@host.docker.internal:27017/mi_nido?authSource=mi_nido
  - `JWT_SECRET`: mi_nido_secret_key_super_seguro_2026_jardines_maternales_produccion
  - `NODE_ENV`: production
  - `CORS_ORIGINS`: https://mi-nido.38.105.232.177.sslip.io

#### Frontend (`/frontend/`)
- **Dockerfile**: ✅ Creado con multi-stage build
- **Puerto**: 3000
- **Variables de entorno**:
  - `NEXT_PUBLIC_API_URL`: https://mi-nido-api.38.105.232.177.sslip.io/api
  - `NODE_ENV`: production

#### Docker Compose
- **Archivo**: `docker-compose.yml`
- **Servicios**: backend, frontend
- **Networks**: Configurado para Traefik/Coolify
- **Dominios planificados**:
  - Frontend: https://mi-nido.38.105.232.177.sslip.io
  - Backend: https://mi-nido-api.38.105.232.177.sslip.io

### 🗄️ Base de Datos MongoDB

#### Usuario y Base de Datos
- **Base de datos**: mi_nido
- **Usuario**: minido
- **Contraseña**: miNido2026Secure!
- **Permisos**: readWrite en mi_nido
- **URI de conexión**: mongodb://minido:miNido2026Secure!@localhost:27017/mi_nido?authSource=mi_nido

#### Estado
- MongoDB está corriendo en el VPS con auth habilitado
- Usuario y base de datos necesarios ser creados

### 📦 Coolify

#### Proyecto
- **Nombre**: mi-nido
- **UUID**: vcskcwo8k0cc8gsskow0oco4
- **Descripción**: Mi Nido - Plataforma de gestión para jardines maternales

#### Environment
- **Nombre**: production
- **UUID**: n0ww8sg480w4ck8s844ss4o8

#### API Key
- **Token**: 1|3npIyeAYVldsmUInyCY5rM5zRmkkuFsxBK9LGQ5X6922c01b
- **URL Base**: http://38.105.232.177:8000/api/v1

### 🚀 Próximos Pasos

1. **Subir a GitHub**: Crear repositorio público para Mi Nido
2. **Configurar Source**: Conectar GitHub App en Coolify
3. **Crear aplicaciones**:
   - Backend: Node.js app con Nixpacks
   - Frontend: Next.js app con Dockerfile
4. **Configurar variables de entorno** en cada aplicación
5. **Crear base de datos MongoDB**
6. **Deploy y testing**

### 📝 Notas Técnicas

- Coolify requiere repositorios GitHub para deployment automático
- Todos los proyectos existentes usan GitHub como source
- El API de Coolify funciona pero crear aplicaciones requiere integración GitHub
- MongoDB está configurado con autenticación en el VPS
- El build del frontend fue exitoso tras arreglar imports

### 🔗 URLs Finales (Planificadas)

- **Frontend**: https://mi-nido.38.105.232.177.sslip.io
- **Backend API**: https://mi-nido-api.38.105.232.177.sslip.io
- **Health Check**: https://mi-nido-api.38.105.232.177.sslip.io/api/health

---

**Fecha**: 2026-02-13  
**Responsable**: Subagent mi-nido-deploy  
**Estado**: Preparación completada, pendiente GitHub + deployment final