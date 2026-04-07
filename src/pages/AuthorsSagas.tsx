import { useMemo } from "react";
import { useBooksContext } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Library } from "lucide-react";

export default function AuthorsSagas() {
  const { books } = useBooksContext();

  const authors = useMemo(() => {
    const map = new Map<string, { total: number; finished: number; titles: string[] }>();
    books.forEach((b) => {
      const key = b.author.trim();
      if (!key) return;
      const entry = map.get(key) || { total: 0, finished: 0, titles: [] };
      entry.total++;
      if (b.status === "finished") entry.finished++;
      entry.titles.push(b.title);
      map.set(key, entry);
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [books]);

  const sagas = useMemo(() => {
    const map = new Map<string, { total: number; finished: number; titles: string[] }>();
    books.forEach((b) => {
      if (!b.hasSaga || !b.saga) return;
      const key = b.saga.trim();
      if (!key) return;
      const entry = map.get(key) || { total: 0, finished: 0, titles: [] };
      entry.total++;
      if (b.status === "finished") entry.finished++;
      entry.titles.push(b.title);
      map.set(key, entry);
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [books]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-display font-semibold">Autores y Sagas</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Autores */}
        <div className="space-y-3">
          <h3 className="text-lg font-display font-medium flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Autores
            <span className="text-sm text-muted-foreground">({authors.length})</span>
          </h3>
          {authors.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body py-8 text-center">
              Añade libros para ver tus autores aquí.
            </p>
          ) : (
            <div className="space-y-2">
              {authors.map((a) => (
                <Card key={a.name}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-display font-semibold">{a.name}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {a.titles.join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-2xl font-bold text-primary">{a.total}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.finished} leído{a.finished !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sagas */}
        <div className="space-y-3">
          <h3 className="text-lg font-display font-medium flex items-center gap-2">
            <Library className="h-5 w-5 text-primary" />
            Sagas
            <span className="text-sm text-muted-foreground">({sagas.length})</span>
          </h3>
          {sagas.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body py-8 text-center">
              Añade libros con saga para verlas aquí.
            </p>
          ) : (
            <div className="space-y-2">
              {sagas.map((s) => (
                <Card key={s.name}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-display font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {s.titles.join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-2xl font-bold text-primary">{s.total}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.finished} leído{s.finished !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
