import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, Minus, Quote } from "lucide-react";

interface RichNotesEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
}

export function RichNotesEditor({ value, onChange, maxLength = 2000, placeholder }: RichNotesEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertAround = useCallback((before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const newText = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newText);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = end + before.length;
    }, 0);
  }, [value, onChange]);

  const insertAtLineStart = useCallback((prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const newText = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(newText);
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + prefix.length;
      ta.selectionEnd = start + prefix.length;
    }, 0);
  }, [value, onChange]);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-0.5 border rounded-t-md px-1 py-1 bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertAround("**", "**")}
          title="Negrita"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertAround("_", "_")}
          title="Cursiva"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertAtLineStart("- ")}
          title="Lista"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertAtLineStart("> ")}
          title="Cita"
        >
          <Quote className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={() => insertAtLineStart("---\n")}
          title="Separador"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="ml-auto text-[10px] text-muted-foreground">{value.length}/{maxLength}</span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        className="flex min-h-[100px] w-full rounded-b-md border border-t-0 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-body resize-y"
        maxLength={maxLength}
        placeholder={placeholder || "Escribe tu reseña o notas... (soporta formato: **negrita**, _cursiva_, - lista)"}
      />
    </div>
  );
}

/** Render markdown-style notes as formatted HTML */
export function RichNotesDisplay({ text }: { text: string }) {
  if (!text) return null;
  
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  
  lines.forEach((line, i) => {
    let content: React.ReactNode = line;
    
    // Process inline formatting
    const processInline = (text: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      let remaining = text;
      let key = 0;
      
      while (remaining.length > 0) {
        // Bold
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        // Italic
        const italicMatch = remaining.match(/_(.+?)_/);
        
        const firstMatch = [boldMatch, italicMatch]
          .filter(Boolean)
          .sort((a, b) => (a!.index || 0) - (b!.index || 0))[0];
        
        if (!firstMatch || firstMatch.index === undefined) {
          parts.push(remaining);
          break;
        }
        
        if (firstMatch.index > 0) {
          parts.push(remaining.slice(0, firstMatch.index));
        }
        
        if (firstMatch === boldMatch) {
          parts.push(<strong key={key++}>{firstMatch[1]}</strong>);
        } else {
          parts.push(<em key={key++}>{firstMatch[1]}</em>);
        }
        
        remaining = remaining.slice(firstMatch.index + firstMatch[0].length);
      }
      
      return parts;
    };
    
    if (line.startsWith("---")) {
      elements.push(<hr key={i} className="my-2 border-border" />);
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground text-sm">
          {processInline(line.slice(2))}
        </blockquote>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={i} className="ml-4 list-disc text-sm">{processInline(line.slice(2))}</li>
      );
    } else if (line.trim() === "") {
      elements.push(<br key={i} />);
    } else {
      elements.push(<p key={i} className="text-sm">{processInline(line)}</p>);
    }
  });
  
  return <div className="space-y-1">{elements}</div>;
}
