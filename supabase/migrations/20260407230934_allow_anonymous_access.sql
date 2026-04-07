/*
  # Permitir acceso sin autenticación para uso personal

  1. Cambios de Seguridad
    - Eliminar políticas RLS restrictivas de todas las tablas
    - Agregar políticas permisivas para acceso anónimo
    - Mantener RLS habilitado pero sin restricciones de autenticación
  
  2. Tablas Afectadas
    - `books` - Permite operaciones SELECT, INSERT, UPDATE, DELETE sin autenticación
    - `wishlist` - Permite operaciones SELECT, INSERT, UPDATE, DELETE sin autenticación
    - `shelves` - Permite operaciones SELECT, INSERT, UPDATE, DELETE sin autenticación
    - `shelf_books` - Permite operaciones SELECT, INSERT, UPDATE, DELETE sin autenticación
  
  Nota: Esta configuración es SOLO para uso personal. NO usar en producción con múltiples usuarios.
*/

-- Books table: Drop existing policies and create permissive ones
DROP POLICY IF EXISTS "Users can view own books" ON books;
DROP POLICY IF EXISTS "Users can insert own books" ON books;
DROP POLICY IF EXISTS "Users can update own books" ON books;
DROP POLICY IF EXISTS "Users can delete own books" ON books;

CREATE POLICY "Allow all access to books"
  ON books
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Wishlist table: Drop existing policies and create permissive ones
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can insert own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can update own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON wishlist;

CREATE POLICY "Allow all access to wishlist"
  ON wishlist
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Shelves table: Drop existing policies and create permissive ones
DROP POLICY IF EXISTS "Users can view own shelves" ON shelves;
DROP POLICY IF EXISTS "Users can insert own shelves" ON shelves;
DROP POLICY IF EXISTS "Users can update own shelves" ON shelves;
DROP POLICY IF EXISTS "Users can delete own shelves" ON shelves;

CREATE POLICY "Allow all access to shelves"
  ON shelves
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Shelf_books table: Drop existing policies and create permissive ones
DROP POLICY IF EXISTS "Users can view own shelf books" ON shelf_books;
DROP POLICY IF EXISTS "Users can insert own shelf books" ON shelf_books;
DROP POLICY IF EXISTS "Users can update own shelf books" ON shelf_books;
DROP POLICY IF EXISTS "Users can delete own shelf books" ON shelf_books;

CREATE POLICY "Allow all access to shelf_books"
  ON shelf_books
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
