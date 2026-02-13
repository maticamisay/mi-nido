#!/bin/bash

cd /home/mati/projects/mi-nido/frontend/src/

# Arreglar archivos que tienen 'use client' y el import API_BASE_URL mal posicionado
for file in $(find . -name "*.tsx" -exec grep -l "'use client'" {} \; 2>/dev/null); do
  if grep -q "import API_BASE_URL" "$file"; then
    echo "Arreglando $file..."
    
    # Crear archivo temporal
    temp_file=$(mktemp)
    
    # Escribir 'use client' primero
    echo "'use client'" > "$temp_file"
    echo "" >> "$temp_file"
    
    # Escribir el resto del archivo sin 'use client' y sin import API_BASE_URL
    grep -v "'use client'" "$file" | grep -v "import API_BASE_URL" >> "$temp_file"
    
    # Agregar import API_BASE_URL después de otros imports si existe API_BASE_URL en el archivo
    if grep -q "API_BASE_URL" "$temp_file"; then
      # Encontrar la última línea de import y agregar API_BASE_URL después
      awk '
        /^import / { imports[NR] = $0; last_import = NR }
        !/^import / && !/^$/ && !api_added && last_import > 0 { 
          for (i = 1; i <= last_import; i++) {
            if (imports[i]) print imports[i]
          }
          print "import API_BASE_URL from '\''@/config/api'\''"
          print ""
          api_added = 1
          print $0
          next
        }
        !/^import / { print $0 }
      ' "$temp_file" > "${temp_file}.2"
      
      mv "${temp_file}.2" "$temp_file"
    fi
    
    # Sobrescribir archivo original
    mv "$temp_file" "$file"
  fi
done

echo "Imports arreglados!"