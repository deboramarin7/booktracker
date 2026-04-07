import type { WishItem } from "@/hooks/useWishlist";

export const seedWishlist: WishItem[] = [
  { id: crypto.randomUUID(), title: "Sangre de dragón", author: "Briar Boleyn", hasSaga: true, saga: "Academia Bloogwing", sagaOrder: "1", genre: "Fantasía", priority: 5, status: "Buscar", totalPages: 0 },
];
