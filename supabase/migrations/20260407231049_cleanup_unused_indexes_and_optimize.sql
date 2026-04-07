/*
  # Limpieza de índices no utilizados y optimización

  1. Eliminación de Índices
    - Eliminar `idx_books_user_id` (no se usa sin autenticación)
    - Eliminar `idx_shelf_books_book_id` (no se usa)
    - Eliminar `idx_wishlist_user_id` (no se usa sin autenticación)
  
  2. Notas
    - Las políticas RLS permisivas se mantienen intencionalmente para uso personal
    - Los índices relacionados con user_id no son necesarios sin autenticación
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_books_user_id;
DROP INDEX IF EXISTS idx_shelf_books_book_id;
DROP INDEX IF EXISTS idx_wishlist_user_id;
