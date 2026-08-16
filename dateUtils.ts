/**
 * Fecha "flexible" para libros.
 *
 * Los campos start_date/end_date se guardan como texto libre (no como un
 * tipo `date` de la base de datos), así que pueden llegar en varios
 * formatos: "YYYY-MM-DD" (el que usan los selectores de fecha de la app),
 * "YYYY/MM/DD" (típico de exportaciones de Goodreads) o "DD/MM/YYYY"
 * (formato español, típico si un libro se importó desde una hoja de
 * cálculo).
 *
 * `new Date(str)` interpreta cualquier fecha con barras como MM/DD/YYYY
 * (formato estadounidense). Para un libro con fecha "16/08/2026" eso
 * produce una fecha inválida (no existe el mes 16), y para "05/03/2026"
 * lo interpreta como 3 de mayo en vez de 5 de marzo, silenciosamente.
 * Cuando una fecha no se puede parsear, el resto del código caía de
 * vuelta al mes actual — así, libros con fechas en formato español
 * (frecuentes entre los añadidos como "Físico", que muchas veces se
 * importan desde una hoja de cálculo) se agrupaban todos en el mes de
 * hoy y desaparecían de cualquier otro mes al filtrar la Biblioteca.
 *
 * Esta función parsea a mano los formatos que puede producir la propia
 * app, y sólo cae en `new Date(...)` como último recurso.
 */
export function parseFlexibleDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Año primero: "YYYY-MM-DD" o "YYYY/MM/DD" (ISO / Goodreads). Es el
  // único caso inequívoco, así que se puede confiar en el orden.
  let m = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    return isNaN(date.getTime()) ? null : date;
  }

  // Día primero: "DD/MM/YYYY" o "DD-MM-YYYY" (formato español).
  m = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (m) {
    const [, d, mo, y] = m;
    const date = new Date(Number(y), Number(mo) - 1, Number(d));
    return isNaN(date.getTime()) ? null : date;
  }

  // Último recurso: dejar que el motor JS lo intente (p. ej. "March 15, 2024").
  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback;
}

interface BookLikeDates {
  endDate?: string;
  startDate?: string;
  addedAt?: string;
}

/** Fecha "representativa" de un libro: fin de lectura > inicio > fecha de alta > hoy. */
export function getBookDate(book: BookLikeDates): Date {
  return (
    parseFlexibleDate(book.endDate) ||
    parseFlexibleDate(book.startDate) ||
    parseFlexibleDate(book.addedAt) ||
    new Date()
  );
}

export function getBookYear(book: BookLikeDates): number {
  return getBookDate(book).getFullYear();
}

export function getBookMonth(book: BookLikeDates): number {
  return getBookDate(book).getMonth();
}
