/** Terminal tal como la expone el autocompletado del buscador. */
export interface Terminal {
  /** Texto que se tipea en el autocompletado. */
  query: string;
  /** Código que el sitio muestra entre paréntesis, ej: "(BUE) Buenos Aires...". Es único por terminal. */
  code: string;
  /** Nombre que aparece en el encabezado y en las tarjetas de resultados. */
  name: string;
  /** Segmento de la URL de resultados. */
  slug: string;
}

export interface Route {
  origin: Terminal;
  destination: Terminal;
}

const RETIRO: Terminal = { query: 'Retiro', code: 'BUE', name: 'Retiro Buenos Aires', slug: 'retiro-buenos-aires' };
const MAR_DEL_PLATA: Terminal = { query: 'Mar del Plata', code: 'MDP', name: 'Mar del Plata', slug: 'mar-del-plata' };
const MAR_CHIQUITA: Terminal = { query: 'Mar Chiquita', code: 'MCHI', name: 'Mar Chiquita', slug: 'mar-chiquita' };
const TRES_LOMAS: Terminal = { query: 'Tres Lomas', code: 'TRLM', name: 'Tres Lomas', slug: 'tres-lomas' };

export const ROUTES = {
  /** Ruta troncal con decenas de servicios diarios. */
  withServices: { origin: RETIRO, destination: MAR_DEL_PLATA },
  /** Ambas terminales existen y son seleccionables, pero no hay servicios entre ellas. */
  withoutServices: { origin: MAR_CHIQUITA, destination: TRES_LOMAS },
} as const satisfies Record<string, Route>;

/** Texto que no matchea ninguna terminal. */
export const UNKNOWN_CITY = 'Ciudad Inexistente XYZ';

/** Días hacia adelante para la fecha de ida: lejos de hoy para evitar servicios ya partidos. */
export const DAYS_AHEAD = 7;
