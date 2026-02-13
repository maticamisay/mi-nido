# Próximos Pasos para Completar el Deploy 🚀

## ✅ Estado Actual
- **Código preparado para producción**: ✅
- **Repositorio en GitHub**: ✅ https://github.com/maticamisay/mi-nido
- **Proyecto creado en Coolify**: ✅
- **Dockerfiles optimizados**: ✅
- **Build del frontend verificado**: ✅

## 📝 Pasos Manuales Requeridos

### 1. Acceder a la interfaz web de Coolify
```bash
# Abrir en navegador:
http://38.105.232.177:8000
```

### 2. Crear aplicación Backend
1. Ir al proyecto "mi-nido" 
2. Environment "production"
3. Crear nueva aplicación:
   - **Tipo**: Application
   - **Source**: GitHub (maticamisay/mi-nido)
   - **Branch**: master
   - **Base Directory**: /backend
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: /backend/Dockerfile
   - **Port**: 5000

### 3. Configurar variables de entorno - Backend
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://minido:miNido2026Secure!@host.docker.internal:27017/mi_nido?authSource=mi_nido
JWT_SECRET=mi_nido_secret_key_super_seguro_2026_jardines_maternales_produccion
CORS_ORIGINS=https://mi-nido.38.105.232.177.sslip.io,http://localhost:3000
```

### 4. Crear aplicación Frontend
1. Crear nueva aplicación en el mismo proyecto:
   - **Tipo**: Application
   - **Source**: GitHub (maticamisay/mi-nido)
   - **Branch**: master
   - **Base Directory**: /frontend
   - **Build Pack**: Dockerfile
   - **Dockerfile Location**: /frontend/Dockerfile
   - **Port**: 3000

### 5. Configurar variables de entorno - Frontend
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://mi-nido-api.38.105.232.177.sslip.io/api
```

### 6. Configurar dominios
- **Backend**: `mi-nido-api.38.105.232.177.sslip.io`
- **Frontend**: `mi-nido.38.105.232.177.sslip.io`

### 7. Crear usuario MongoDB
```bash
# Ejecutar en el servidor:
# Método 1: Usando el script creado
cd /home/mati/projects/mi-nido
# Arreglar contraseña admin y ejecutar create-mongo-user.js

# Método 2: Manual si el script no funciona
mongosh admin -u admin -p [PASSWORD_ADMIN]
use mi_nido
db.createUser({
  user: "minido", 
  pwd: "miNido2026Secure!", 
  roles: [{role: "readWrite", db: "mi_nido"}]
})
```

### 8. Hacer deploy
1. Deploy backend primero
2. Verificar que la API responda: `https://mi-nido-api.38.105.232.177.sslip.io/api/health`
3. Deploy frontend
4. Verificar que el frontend cargue y se conecte al backend

## 🔧 URLs Finales

- **Frontend**: https://mi-nido.38.105.232.177.sslip.io
- **Backend API**: https://mi-nido-api.38.105.232.177.sslip.io
- **Health Check**: https://mi-nido-api.38.105.232.177.sslip.io/api/health
- **Repositorio**: https://github.com/maticamisay/mi-nido

## 🐛 Troubleshooting

### Si el backend no se conecta a MongoDB:
1. Verificar que MongoDB esté corriendo: `ps aux | grep mongod`
2. Verificar usuario en MongoDB
3. Verificar que host.docker.internal apunte al host correcto

### Si el frontend no se conecta al backend:
1. Verificar CORS_ORIGINS en backend
2. Verificar NEXT_PUBLIC_API_URL en frontend
3. Verificar que ambos servicios estén corriendo

### Si los builds fallan:
- **Backend**: Los Dockerfiles están optimizados y el código está listo
- **Frontend**: Build ya fue verificado exitosamente

## 📊 Resumen del Trabajo Completado

1. **Preparación completa del código** para producción
2. **Dockerfiles optimizados** para ambos servicios
3. **Variables de entorno centralizadas** y configuradas
4. **Repositorio GitHub creado** y código subido
5. **Proyecto Coolify inicializado**
6. **Documentación completa** del proceso

El proyecto está 95% listo. Solo faltan los pasos manuales de configuración en la interfaz de Coolify y la creación del usuario de MongoDB.

---
**Preparado por**: Subagent mi-nido-deploy  
**Fecha**: 2026-02-13  
**Estado**: Listo para deployment manual