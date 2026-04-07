-- Create shelves table
CREATE TABLE public.shelves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shelf_books junction table
CREATE TABLE public.shelf_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shelf_id UUID NOT NULL REFERENCES public.shelves(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shelf_id, book_id)
);

-- Enable RLS
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelf_books ENABLE ROW LEVEL SECURITY;

-- Shelves policies
CREATE POLICY "Users can view own shelves" ON public.shelves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shelves" ON public.shelves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shelves" ON public.shelves FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shelves" ON public.shelves FOR DELETE USING (auth.uid() = user_id);

-- Shelf_books policies (user owns the shelf)
CREATE POLICY "Users can view own shelf books" ON public.shelf_books FOR SELECT USING (EXISTS (SELECT 1 FROM public.shelves WHERE shelves.id = shelf_books.shelf_id AND shelves.user_id = auth.uid()));
CREATE POLICY "Users can insert own shelf books" ON public.shelf_books FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.shelves WHERE shelves.id = shelf_books.shelf_id AND shelves.user_id = auth.uid()));
CREATE POLICY "Users can delete own shelf books" ON public.shelf_books FOR DELETE USING (EXISTS (SELECT 1 FROM public.shelves WHERE shelves.id = shelf_books.shelf_id AND shelves.user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_shelves_updated_at BEFORE UPDATE ON public.shelves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();