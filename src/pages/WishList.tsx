import { useState } from "react";
import { useWishlist } from "@/hooks/useWishlist";
import type { WishItem, WishStatus } from "@/hooks/useWishlist";
import { Heart, Plus, Pencil, Trash2, BookHeart, BookOpen, Loader as Loader2, Search, Filter, BookMarked, Flame } from "lucide-react";
import { BookCoverImage } from "@/components/BookCoverImage";
import { useBooksContext } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GENRE_COLORS, GENRES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUSES: WishStatus[] = ["Comprado", "Buscar", "En biblioteca", "En kindle"];

function Hearts({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Heart
          key={i}
          className={`h-4 w-4 cursor-pointer transition-colors ${i <= value ? "fill-red-500 text-red-500" : "text-muted-foreground/30"}`}
          onClick={() => onChange?.(i)}
        />
      ))}
    </div>
  );
}

const statusColors: Record<WishStatus, string> = {
