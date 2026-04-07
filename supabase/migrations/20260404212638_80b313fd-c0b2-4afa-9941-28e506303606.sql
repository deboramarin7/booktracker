ALTER TABLE public.books ADD COLUMN tags TEXT[] DEFAULT '{}';
CREATE INDEX idx_books_tags ON public.books USING GIN(tags);