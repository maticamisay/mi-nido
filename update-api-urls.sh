#!/bin/bash

# Actualizar todas las URLs de API en el frontend
cd /home/mati/projects/mi-nido/frontend/src/

# Listar archivos que contienen localhost:3001
FILES=$(find . -name "*.tsx" -o -name "*.ts" | xargs grep -l "localhost:3001" 2>/dev/null)

for file in $FILES; do
  echo "Actualizando $file..."
  
  # Agregar import si no existe
  if ! grep -q "import.*API_BASE_URL" "$file"; then
    # Agregar import después de otros imports
    sed -i "1i import API_BASE_URL from '@/config/api'" "$file"
  fi
  
  # Reemplazar URLs
  sed -i "s|'http://localhost:3001/api'|API_BASE_URL|g" "$file"
  sed -i "s|\"http://localhost:3001/api\"|API_BASE_URL|g" "$file"
  sed -i "s|'http://localhost:3001/api/|API_BASE_URL + '/|g" "$file"
  sed -i "s|\"http://localhost:3001/api/|API_BASE_URL + \"/|g" "$file"
  sed -i "s|http://localhost:3001/api|${API_BASE_URL}|g" "$file"
done

echo "Actualización completada!"