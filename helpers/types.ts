/** Forma común de las respuestas exitosas; cada recurso define su `properties`. */
export interface SwapiResponse<P> {
  message: string;
  result: { uid: string; description: string; properties: P };
}