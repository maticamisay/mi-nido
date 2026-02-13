FROM node:20-alpine

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY src/ ./src/

# Crear directorio uploads
RUN mkdir -p /app/uploads

# Exponer puerto
EXPOSE ${PORT:-5000}

# Usuario no-root por seguridad
USER node

# Comando de inicio
CMD ["npm", "start"]