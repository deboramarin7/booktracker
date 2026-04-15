import { useState } from "react";
import {
  BookOpen, Search, BookMarked, TrendingUp,
  Sparkles, Info, ChevronDown, ChevronUp,
  Star, Upload, Calendar, Trophy, LayoutGrid, Heart
} from "lucide-react";

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  steps: { title: string; text: string }[];
  tips?: string[];
}

const sections: Section[] = [
  {
    id: "biblioteca",
    icon: <BookOpen className="h-5 w-5" />,
    title: "Mi Biblioteca",
    description: "El corazón de la app. Aquí viven todos tus libros leídos, en progreso y pendientes.",
    steps: [
       {
        title: "Añadir un libro",
        text: "Haz clic en '+ Añadir libro' (esquina superior derecha). Puedes buscar por título, autor o ISBN usando el buscador automático — se rellenarán los datos solos. Si el libro no aparece, rellénalo a mano. El campo URL de portada se autorellena con la búsqueda, pero si no te gusta, puedes buscar la URL de la imagen de la portada y cambiarlo. El resto de campos como Género, Formato, Procedencia etc. es necesario que sean rellenados por ti."
      },
      {
        title: "Estados de lectura",
        text: "Cada libro tiene tres estados: Terminado, Leyendo o Quiero leer. Si eliges 'Quiero leer', el libro irá automáticamente a tu Wish List en vez de a la biblioteca."
      },
      {
        title: "Filtros y ordenación",
        text: "Filtra por año, género o formato. Ordena por fecha de lectura, valoración, título o autor. Usa el selector de año (junto al título) para ver libros de un año concreto o todos a la vez."
      },
      {
        title: "Vista de lomos",
        text: "Haz clic en el icono de rayas (☰) junto al grid para ver tus libros como lomos en una estantería. Haz clic de nuevo para volver a la vista de tarjetas."
      },
      {
        title: "Exportar a Excel",
        text: "Haz clic en 'Exportar' para descargar todos tus libros en un archivo .xlsx con título, autor, género, páginas, valoración, precio y más."
      }
    ],
    tips: [
      "Haz clic encima de la imagen de la portada para ver la ficha técnica del libro.",
      "Para editar un libro, pasa el ratón por encima de la portada y haz clic en el lápiz ✏️.",
      "Para eliminar, pasa el ratón por la portada y haz clic en el 🗑️."
    ]
  },
  {
    id: "wishlist",
    icon: <Heart className="h-5 w-5" />,
    title: "Wish List",
    description: "Tu lista de libros que quieres leer. Se agrupan automáticamente por sagas.",
    steps: [
      {
        title: "Añadir a la Wish List",
        text: "Se añadem directamente desde '+ Añadir libro' en Mi Biblioteca eligiendo el estado 'Quiero leer'."
      },
      {
        title: "Agrupación por sagas",
        text: "Los libros que pertenecen a una saga se agrupan automáticamente bajo el nombre de la saga. Los libros individuales aparecen en una sección separada."
      },
      {
        title: "Estados de seguimiento",
        text: "Cada libro de la Wish List tiene un estado: Comprado, Buscar, En biblioteca y en Kindle. Úsalos para saber en qué punto estás con cada libro."
      },
      {
        title: "Mover a la biblioteca",
        text: "Cuando vayas a empezar un libro que esta en la Wishlist, le das a 'Empezar a leer' y automaticamente se añade a Mi Biblioteca con el estado 'Leyendo'."
      }
    ],
    tips: [
      "Filtra por saga, género, estado o prioridad (corazones) para encontrar rápidamente lo que buscas.",
      "La prioridad va de 1 (baja) a 5 (alta). Usa los corazones de arriba a la derecha para buscar libros con esa prioridad."
    ]
  },
  {
    id: "autores",
    icon: <BookMarked className="h-5 w-5" />,
    title: "Autores y Sagas",
    description: "Vista agrupada de todos tus libros organizados por autor y saga.",
    steps: [
      {
        title: "Ver por autor",
        text: "Todos los autores de tu biblioteca aparecen con sus libros agrupados."
      },
      {
        title: "Ver por saga",
        text: "Las sagas se muestran con todos sus volúmenes en orden. Puedes ver de un vistazo qué libros de cada saga tienes ya leídos."
      }
    ],
    tips: [
      "Si un libro pertenece a una saga, asegúrate de rellenar 'Nombre de saga' y 'Orden en saga' al añadirlo para que aparezca correctamente agrupado."
    ]
  },
  {
    id: "estanteria",
    icon: <LayoutGrid className="h-5 w-5" />,
    title: "Estantería",
    description: "Visualización de tus libros terminados como lomos en una estantería real.",
    steps: [
      {
        title: "Reorganizar libros",
        text: "Arrastra y suelta los lomos para cambiar el orden de tu estantería. El orden se guarda automáticamente en este dispositivo."
      },
      {
        title: "Agrupar por saga",
        text: "Haz clic en '📚 Agrupar por saga' para que los libros de la misma saga se coloquen juntos automáticamente, ordenados del primero al último."
      }
    ],
    tips: [
      "Solo aparecen los libros con estado 'Terminado'.",
      "Pasa el ratón por encima de un lomo para ver el título, autor y valoración.",
      "Los lomos sin portada se muestran con un color y el título en vertical."
    ]
  },
  {
    id: "habitos",
    icon: <Calendar className="h-5 w-5" />,
    title: "Hábitos de Lectura",
    description: "Registra cuándo lees y cuántas páginas. Visualiza tu constancia con el calendario anual.",
    steps: [
      {
        title: "Registrar una sesión",
        text: "Haz clic en cualquier día del calendario para marcar que leíste ese día."
      },
      {
        title: "Ver estadísticas",
        text: "Muestra los libros leídos, los que has emepzado y terminado en ese mes."
      },
       {
        title: "Calendario",
        text: "El calendario muestra los dias que has leído y la portada del libro."
      },
    ],
    tips: [
      "Consulta la pestaña 'Calendario' para ver el mapa de calor anual de tu lectura."
    ]
  },
  {
    id: "logros",
    icon: <Trophy className="h-5 w-5" />,
    title: "Logros y Retos",
    description: "Desafíos de lectura y objetivos personales para motivarte a leer más.",
    steps: [
      {
        title: "Logros automáticos",
        text: "Algunos logros se desbloquean automáticamente según tus datos: libros leídos, géneros explorados, racha de días, etc."
      },
      {
        title: "Objetivo anual",
        text: "Fija cuántos libros quieres leer este año y sigue tu progreso con la barra de porcentaje en Mi Biblioteca."
      },
      {
        title: "Retos personalizados",
        text: "Crea tus propios retos: leer X libros de un género, leer X páginas en un mes, etc."
      }
  },
  {
    id: "dashboard",
    icon: <TrendingUp className="h-5 w-5" />,
    title: "Dashboard",
    description: "Estadísticas detalladas de tus hábitos lectores: géneros, páginas, valoraciones y más.",
    steps: [
      {
        title: "Estadísticas generales",
        text: "Ve el total de libros leídos, páginas, autores y géneros diferentes. Filtra por año para ver la evolución."
      },
      {
        title: "Gráficos",
        text: "Distribución por géneros (gráfico circular), libros por mes (barras), evolución de páginas (líneas) y más."
      },
      {
        title: "Mejores del año",
        text: "Ve tu libro favorito, autor más leído y género predominante de cada año."
      }
    ],
    tips: [
      "Puedes compartir tus estadísticas con el botón de compartir que encontrarás en el Dashboard."
    ]
  },
  {
    id: "wrapped",
    icon: <Sparkles className="h-5 w-5" />,
    title: "Wrapped ✨",
    description: "Tu resumen anual de lectura en formato visual, inspirado en el Wrapped de Spotify.",
    steps: [
      {
        title: "Ver tu Wrapped",
        text: "Navega entre los slides con las flechas o deslizando. Cada slide muestra un dato diferente: libros leídos, páginas, géneros, rachas, mejores libros..."
      },
      {
        title: "Cambiar de año",
        text: "Usa el selector de año (junto al título) para ver el resumen de cualquier año en que hayas registrado libros."
      },
    ],
    tips: [
      "El Wrapped solo muestra datos si tienes libros con estado 'Terminado' en el año seleccionado.",
    ]
  },
  {
    id: "importar",
    icon: <Upload className="h-5 w-5" />,
    title: "Importar desde Goodreads",
    description: "Importa tu historial de Goodreads para empezar con todos tus libros ya registrados.",
    steps: [
      {
        title: "Exportar desde Goodreads",
        text: "En Goodreads ve a 'My Books' → 'Import and export' → 'Export Library'. Descarga el archivo CSV."
      },
      {
        title: "Importar en Book Tracker",
        text: "En Mi Biblioteca haz clic en 'Importar', selecciona el archivo CSV descargado de Goodreads y haz clic en 'Importar'."
      },
      {
        title: "Búsqueda automática de portadas",
        text: "Al importar, la app busca automáticamente las portadas de todos los libros. Puede tardar unos minutos según el número de libros."
      }
    ],
    tips: [
      "Los libros marcados como 'to-read' en Goodreads se importarán a tu Wish List automáticamente.",
      "Los libros con estado 'currently-reading' se importarán como 'Leyendo'.",
      "También puedes importar desde cualquier archivo CSV o Excel con columnas de Título y Autor."
    ]
  }
];

function SectionCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border/30 bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
            {section.icon}
          </div>
          <div>
            <h3 className="font-display font-semibold text-base text-foreground">{section.title}</h3>
            <p className="text-sm text-muted-foreground font-display">{section.description}</p>
          </div>
        </div>
        {open
          ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 ml-4" />
          : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-4" />
        }
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border/20 pt-4">
          {/* Steps */}
          <div className="space-y-3">
            {section.steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center font-display mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-semibold font-display text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground font-display mt-0.5">{step.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          {section.tips && section.tips.length > 0 && (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 font-display uppercase tracking-wide">💡 Consejos</p>
              {section.tips.map((tip, i) => (
                <p key={i} className="text-xs text-amber-700 dark:text-amber-300 font-display">• {tip}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Help() {
  const [search, setSearch] = useState("");
  const [formType, setFormType] = useState("libro");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formSent, setFormSent] = useState(false);
  const [formSending, setFormSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSending(true);
    try {
      await fetch("https://formspree.io/f/mwvaewlr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: formType === "libro" ? "Libro no encontrado" : formType === "pregunta" ? "Pregunta" : "Sugerencia",
          nombre: formName,
          email: formEmail,
          mensaje: formMessage,
        }),
      });
      setFormSent(true);
      setFormName(""); setFormEmail(""); setFormMessage("");
    } catch { }
    setFormSending(false);
  };

  const filtered = search.trim()
    ? sections.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.steps.some(step => step.text.toLowerCase().includes(search.toLowerCase()) || step.title.toLowerCase().includes(search.toLowerCase()))
      )
    : sections;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-primary/10">
            <Info className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold font-display tracking-tight">Guía de uso</h2>
        </div>
        <p className="text-muted-foreground font-display text-sm ml-14">
          Todo lo que necesitas saber para sacarle el máximo partido a Book Tracker.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <BookOpen className="h-4 w-4" />, label: "Registra libros", desc: "Leídos, leyendo o pendientes" },
          { icon: <Star className="h-4 w-4" />, label: "Valora y reseña", desc: "Guarda tus opiniones" },
          { icon: <TrendingUp className="h-4 w-4" />, label: "Estadísticas", desc: "Ve tu evolución lectora" },
          { icon: <Sparkles className="h-4 w-4" />, label: "Wrapped anual", desc: "Tu resumen del año" },
        ].map((item, i) => (
          <div key={i} className="rounded-xl border border-border/30 bg-muted/20 p-3 flex flex-col gap-1.5">
            <div className="text-primary">{item.icon}</div>
            <p className="text-xs font-semibold font-display text-foreground">{item.label}</p>
            <p className="text-[11px] text-muted-foreground font-display">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar en la guía..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border/40 bg-card text-sm font-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-display">
            No se encontraron resultados para "{search}"
          </div>
        ) : (
          filtered.map(section => (
            <SectionCard key={section.id} section={section} />
          ))
        )}
      </div>

      {/* Contact form */}
      <div className="rounded-2xl border border-border/30 bg-card p-5 space-y-4">
        <div>
          <h3 className="font-display font-semibold text-base text-foreground">¿Necesitas ayuda? ✉️</h3>
          <p className="text-sm text-muted-foreground font-display mt-0.5">
            ¿No encuentras un libro en el buscador? ¿Tienes alguna sugerencia? Escríbenos.
          </p>
        </div>

        {formSent ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-500 font-display">¡Mensaje enviado! ✅</p>
            <p className="text-xs text-muted-foreground font-display mt-1">Te responderemos lo antes posible.</p>
            <button onClick={() => setFormSent(false)} className="mt-2 text-xs text-muted-foreground hover:text-foreground underline font-display">Enviar otro mensaje</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Tipo */}
            <div className="flex gap-2">
              {[
                { value: "libro", label: "📚 Libro no encontrado" },
                { value: "pregunta", label: "❓ Pregunta" },
                { value: "sugerencia", label: "💡 Sugerencia" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormType(opt.value)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-display border transition-colors ${
                    formType === opt.value
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "text-muted-foreground border-border/40 hover:border-border"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Nombre + Email */}
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Tu nombre"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                required
                className="px-3 py-2 rounded-xl border border-border/40 bg-muted/20 text-sm font-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="email"
                placeholder="Tu email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                required
                className="px-3 py-2 rounded-xl border border-border/40 bg-muted/20 text-sm font-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Mensaje */}
            <textarea
              placeholder={formType === "libro" ? "Título del libro, autor y editorial si lo sabes..." : "Escribe tu mensaje..."}
              value={formMessage}
              onChange={e => setFormMessage(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-border/40 bg-muted/20 text-sm font-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />

            <button
              type="submit"
              disabled={formSending}
              className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-display font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {formSending ? "Enviando..." : "Enviar mensaje"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
