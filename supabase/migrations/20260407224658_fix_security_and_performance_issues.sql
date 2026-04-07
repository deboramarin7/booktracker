/*
  # Fix Security and Performance Issues

  ## Changes Made

  ### 1. Performance Improvements - Add Missing Indexes
  - Add index on `books.user_id` for foreign key `books_user_id_fkey`
  - Add index on `shelf_books.book_id` for foreign key `shelf_books_book_id_fkey`
  - Add index on `wishlist.user_id` for foreign key `wishlist_user_id_fkey`
  - Remove unused index `idx_books_tags`

  ### 2. Security Improvements - Remove Unsafe RLS Policies
  - Remove all `anon_*` policies that bypass security with `USING (true)`
  - These policies were allowing unrestricted access to data

  ### 3. Performance Optimization - Optimize RLS Policies
  - Update all RLS policies to use `(select auth.uid())` instead of `auth.uid()`
  - This prevents re-evaluation of auth functions for each row
  - Applies to all tables: profiles, books, wishlist, shelves, shelf_books

  ## Security Notes
  - All tables now properly restrict access to authenticated users only
  - Each policy checks ownership through user_id comparison
  - No unrestricted access policies remain
*/

-- Step 1: Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_books_user_id ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_shelf_books_book_id ON public.shelf_books(book_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);

-- Step 2: Remove unused index
DROP INDEX IF EXISTS public.idx_books_tags;

-- Step 3: Remove all unsafe anon policies that bypass security
DROP POLICY IF EXISTS anon_delete_books ON public.books;
DROP POLICY IF EXISTS anon_insert_books ON public.books;
DROP POLICY IF EXISTS anon_read_books ON public.books;
DROP POLICY IF EXISTS anon_update_books ON public.books;

DROP POLICY IF EXISTS anon_insert_profiles ON public.profiles;
DROP POLICY IF EXISTS anon_read_profiles ON public.profiles;
DROP POLICY IF EXISTS anon_update_profiles ON public.profiles;

DROP POLICY IF EXISTS anon_delete_shelf_books ON public.shelf_books;
DROP POLICY IF EXISTS anon_insert_shelf_books ON public.shelf_books;
DROP POLICY IF EXISTS anon_read_shelf_books ON public.shelf_books;

DROP POLICY IF EXISTS anon_delete_shelves ON public.shelves;
DROP POLICY IF EXISTS anon_insert_shelves ON public.shelves;
DROP POLICY IF EXISTS anon_read_shelves ON public.shelves;
DROP POLICY IF EXISTS anon_update_shelves ON public.shelves;

DROP POLICY IF EXISTS anon_delete_wishlist ON public.wishlist;
DROP POLICY IF EXISTS anon_insert_wishlist ON public.wishlist;
DROP POLICY IF EXISTS anon_read_wishlist ON public.wishlist;
DROP POLICY IF EXISTS anon_update_wishlist ON public.wishlist;

-- Step 4: Drop existing policies to recreate them optimized
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own books" ON public.books;
DROP POLICY IF EXISTS "Users can insert own books" ON public.books;
DROP POLICY IF EXISTS "Users can update own books" ON public.books;
DROP POLICY IF EXISTS "Users can delete own books" ON public.books;

DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can insert own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can update own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlist;

DROP POLICY IF EXISTS "Users can view own shelves" ON public.shelves;
DROP POLICY IF EXISTS "Users can insert own shelves" ON public.shelves;
DROP POLICY IF EXISTS "Users can update own shelves" ON public.shelves;
DROP POLICY IF EXISTS "Users can delete own shelves" ON public.shelves;

DROP POLICY IF EXISTS "Users can view own shelf books" ON public.shelf_books;
DROP POLICY IF EXISTS "Users can insert own shelf books" ON public.shelf_books;
DROP POLICY IF EXISTS "Users can delete own shelf books" ON public.shelf_books;

-- Step 5: Create optimized RLS policies for profiles table
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (id = (select auth.uid()));

-- Step 6: Create optimized RLS policies for books table
CREATE POLICY "Users can view own books"
  ON public.books
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own books"
  ON public.books
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own books"
  ON public.books
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own books"
  ON public.books
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Step 7: Create optimized RLS policies for wishlist table
CREATE POLICY "Users can view own wishlist"
  ON public.wishlist
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own wishlist"
  ON public.wishlist
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own wishlist"
  ON public.wishlist
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own wishlist"
  ON public.wishlist
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Step 8: Create optimized RLS policies for shelves table
CREATE POLICY "Users can view own shelves"
  ON public.shelves
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert own shelves"
  ON public.shelves
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own shelves"
  ON public.shelves
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own shelves"
  ON public.shelves
  FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- Step 9: Create optimized RLS policies for shelf_books table
CREATE POLICY "Users can view own shelf books"
  ON public.shelf_books
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shelves
      WHERE shelves.id = shelf_books.shelf_id
      AND shelves.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own shelf books"
  ON public.shelf_books
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shelves
      WHERE shelves.id = shelf_books.shelf_id
      AND shelves.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own shelf books"
  ON public.shelf_books
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shelves
      WHERE shelves.id = shelf_books.shelf_id
      AND shelves.user_id = (select auth.uid())
    )
  );