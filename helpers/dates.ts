const MONTHS_LONG = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] as const;

const pad = (n: number): string => String(n).padStart(2, '0');

export function daysFromToday(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

/** Encabezado del calendario del sitio, ej: "noviembre 2026" (se compara sin distinguir mayúsculas). */
export const toCalendarMonth = (d: Date): string => `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;

/**
 * Valor del input "Ida". El sitio no es consistente: al elegir la fecha muestra "05-11-2026",
 * pero al volver atrás la restaura como "05/11/2026". Se aceptan ambos separadores.
 */
export const toInputValue = (d: Date): RegExp =>
  new RegExp(`^${pad(d.getDate())}[-/]${pad(d.getMonth() + 1)}[-/]${d.getFullYear()}$`);

/** Parámetro FIda de la URL de resultados, ej: "11/05/2026" (formato MM/DD/YYYY). */
export const toUrlParam = (d: Date): string => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`;

/** Fecha en la barra de días de resultados, ej: "5 Nov". */
export const toResultsStrip = (d: Date): string => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
