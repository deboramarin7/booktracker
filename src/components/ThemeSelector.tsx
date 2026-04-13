import { useTheme } from "@/hooks/useTheme";
import { Check } from "lucide-react";

export function ThemeSelector() {
  const { themeId, setThemeId, themes } = useTheme();

  return (
    <div className="space-y-2" data-testid="theme-selector">
      {Object.values(themes).map((theme) => (
        <button
          key={theme.id}
          onClick={() => setThemeId(theme.id)}
          className={`w-full flex items-center justify-between rounded-[var(--radius)] px-3 py-2 text-sm transition-colors ${
            themeId === theme.id
              ? "bg-primary/15 text-primary border border-primary/30"
              : "hover:bg-muted text-muted-foreground border border-transparent"
          }`}
        >
          <span className="flex items-center gap-2">
            <span>{theme.emoji}</span>
            <span>{theme.name}</span>
          </span>
          {themeId === theme.id && <Check className="h-4 w-4" />}
        </button>
      ))}
    </div>
  );
}
