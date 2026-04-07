/*
  # Limpiar esquema de autenticación

  1. Cambios
    - Eliminar tabla auth.users si existe (esquema de autenticación)
    - La aplicación ahora funciona sin autenticación
    - Los datos de libros, wishlist y shelves ya tienen user_id nullable
  
  2. Notas
    - Esta migración elimina referencias al sistema de autenticación de Supabase
    - La aplicación funcionará sin necesidad de usuarios
*/

-- No podemos eliminar auth.users porque es parte del esquema de Supabase
-- En su lugar, simplemente documentamos que no se usará autenticación
-- Los cambios previos ya hicieron user_id nullable y eliminaron las restricciones FK
