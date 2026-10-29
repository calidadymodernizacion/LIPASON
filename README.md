# LIPASON — 11 portadas nuevas

## Entrega
- 11 imágenes WebP de 1586×933 píxeles en la carpeta `assets/`, nombradas según el `slug` de Supabase.
- `vista_previa_con_CSS.jpg`: simulación de cómo podrían verse las imágenes con la **capa CSS** y títulos superpuestos.
- `manifest.json`: archivo, nombre y ruta para cada ficha.
- `actualizar_supabase.sql`: actualización SQL idempotente del campo `image_url` de los once registros.

## Estilo
Las portadas son **ilustraciones editoriales conceptuales** generadas para el catálogo, no capturas verificadas de los sistemas en producción. Cada imagen contiene una escena con interfaz conceptual, sin título editorial ni degradado oscuro añadido.

**IMPORTANTE:** el degradado visible en la vista previa está generado únicamente para esa vista. Las imágenes WebP definitivas **no lo contienen**: la regla `.project-card::after` de LIPASON lo aplicará al mostrarlas. No modifiques la CSS existente para agregar otro degradado.

## Instalación en GitHub Pages
1. Descomprime este ZIP.
2. Copia las once imágenes de `assets/` a la carpeta `assets/` del repositorio `calidadymodernizacion/LIPASON`, manteniendo sus nombres. No reemplaces los archivos de las primeras cuatro portadas.
3. Comprueba que las once imágenes cargan individualmente en `https://calidadymodernizacion.github.io/LIPASON/assets/project-NOMBRE.webp`.
4. Ejecuta `actualizar_supabase.sql` en el SQL Editor del proyecto Supabase `ngoeqmrrvhcmafrbbkes` **solo después** de confirmar la subida.
5. Recarga el catálogo con Ctrl+F5 y revisa las tarjetas en escritorio y móvil.

Las once imágenes permanecen sin vincular a Supabase hasta que sus URLs funcionen. Esto evita enlaces rotos en fichas ya publicadas.

## Restricción de acceso
El repositorio de GitHub está conectado a ChatGPT con permiso de lectura, pero no con permiso de escritura; por ese motivo no se han enviado automáticamente los archivos al repositorio. El conector Supabase de esta conversación permite SQL pero no subir binarios a Storage.
