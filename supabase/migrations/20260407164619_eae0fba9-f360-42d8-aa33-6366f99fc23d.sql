-- Temporarily allow anon access to all tables for development without login

CREATE POLICY "anon_read_books" ON public.books FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_books" ON public.books FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_books" ON public.books FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_books" ON public.books FOR DELETE TO anon USING (true);

CREATE POLICY "anon_read_wishlist" ON public.wishlist FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_wishlist" ON public.wishlist FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_wishlist" ON public.wishlist FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_wishlist" ON public.wishlist FOR DELETE TO anon USING (true);

CREATE POLICY "anon_read_shelves" ON public.shelves FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_shelves" ON public.shelves FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_shelves" ON public.shelves FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_delete_shelves" ON public.shelves FOR DELETE TO anon USING (true);

CREATE POLICY "anon_read_shelf_books" ON public.shelf_books FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_shelf_books" ON public.shelf_books FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_delete_shelf_books" ON public.shelf_books FOR DELETE TO anon USING (true);

CREATE POLICY "anon_read_profiles" ON public.profiles FOR SELECT TO anon USING (true);
CREATE POLICY "anon_insert_profiles" ON public.profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_update_profiles" ON public.profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);