/*
  # Hacer user_id nullable para uso anónimo

  1. Cambios en Tablas
    - Hacer columna `user_id` nullable en tabla `books`
    - Hacer columna `user_id` nullable en tabla `wishlist`
    - Hacer columna `user_id` nullable en tabla `shelves`
    - Eliminar restricciones de clave foránea que requieren user_id válido
  
  2. Razón
    - Permite uso de la aplicación sin autenticación
    - Remueve la restricción que causaba el error de importación
    - Mantiene compatibilidad con uso futuro con autenticación
  
  Nota: Esta configuración es para uso personal sin autenticación.
*/

-- Drop foreign key constraints
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'books_user_id_fkey' 
    AND table_name = 'books'
  ) THEN
    ALTER TABLE books DROP CONSTRAINT books_user_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'wishlist_user_id_fkey' 
    AND table_name = 'wishlist'
  ) THEN
    ALTER TABLE wishlist DROP CONSTRAINT wishlist_user_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'shelves_user_id_fkey' 
    AND table_name = 'shelves'
  ) THEN
    ALTER TABLE shelves DROP CONSTRAINT shelves_user_id_fkey;
  END IF;
END $$;

-- Make user_id columns nullable
ALTER TABLE books ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE wishlist ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE shelves ALTER COLUMN user_id DROP NOT NULL;
