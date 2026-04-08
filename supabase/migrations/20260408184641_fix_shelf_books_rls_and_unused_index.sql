/*
  # Fix shelf_books RLS policies and remove unused index

  ## Changes

  1. RLS Policies — shelf_books
     - DROP the three overly-permissive policies (DELETE/INSERT/UPDATE) that use
       `USING (true)` / `WITH CHECK (true)`, which bypass row-level security.
     - Replace them with policies that scope access through the parent `shelves`
       table: a row in shelf_books is only accessible when its parent shelf has
       `user_id IS NULL` (the anonymous-user pattern used by the rest of the app).
     - The existing SELECT policy (`Allow anonymous read access to shelf_books`)
       already uses `true` but is kept as-is because read access to shelf_books
       mirrors the read access granted on shelves (no data mutation risk).

  2. Unused Index
     - DROP `idx_shelf_books_book_id` — this index has never been used and the
       composite unique index `shelf_books_shelf_id_book_id_key` already covers
       queries that filter by both shelf_id and book_id.

  ## Security Notes
  - INSERT: only allowed when the referenced shelf has `user_id IS NULL`.
  - UPDATE: only allowed when the current and new shelf both have `user_id IS NULL`.
  - DELETE: only allowed when the referenced shelf has `user_id IS NULL`.
*/

-- 1. Remove unused index
DROP INDEX IF EXISTS idx_shelf_books_book_id;

-- 2. Drop the always-true policies
DROP POLICY IF EXISTS "Allow anonymous delete from shelf_books" ON public.shelf_books;
DROP POLICY IF EXISTS "Allow anonymous insert to shelf_books" ON public.shelf_books;
DROP POLICY IF EXISTS "Allow anonymous update to shelf_books" ON public.shelf_books;

-- 3. Re-create policies scoped through the parent shelves table

CREATE POLICY "Allow anonymous insert to shelf_books"
  ON public.shelf_books
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shelves
      WHERE shelves.id = shelf_id
        AND shelves.user_id IS NULL
    )
  );

CREATE POLICY "Allow anonymous update to shelf_books"
  ON public.shelf_books
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shelves
      WHERE shelves.id = shelf_id
        AND shelves.user_id IS NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shelves
      WHERE shelves.id = shelf_id
        AND shelves.user_id IS NULL
    )
  );

CREATE POLICY "Allow anonymous delete from shelf_books"
  ON public.shelf_books
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.shelves
      WHERE shelves.id = shelf_id
        AND shelves.user_id IS NULL
    )
  );
