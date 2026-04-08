/**
 * Formatea el tiempo de uso de la lámpara (en MINUTOS) a un string legible.
 * 
 * Reglas:
 * - Si es nulo o 0: retornar '0 min'.
 * - Si es menor a 60 minutos: mostrar 'X min'.
 * - Si es mayor o igual a 60 minutos pero menor a 24 horas (1440 min): mostrar 'X h, Y min'.
 * - Si supera o iguala las 24 horas (1440 min): mostrar 'X días, Y h'.
 */
export function formatLampTime(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || minutes <= 0) {
    return "0 min";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} h`;
    return `${hours} h, ${remainingMinutes} min`;
  }

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (hours === 0) return `${days} días`;
  return `${days} días, ${hours} h`;
}
