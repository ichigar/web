/* Utilidades de formato y texto (puras, sin estado de la app). */

export function formatoCantidad(n) {
  if (n == null) return "";
  // entero exacto sin decimales; si no, redondea a 2.
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

export function tiempoTexto(r) {
  const t = r.tiempo_total_min;
  return t ? `⏱️ ${t} min` : "";
}

export function escapar(s) {
  const d = document.createElement("div");
  d.textContent = s == null ? "" : String(s);
  return d.innerHTML;
}

// Normaliza texto para buscar: minúsculas y sin acentos ("plátano" → "platano").
export function normalizarBusqueda(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Categorías disponibles en un conjunto de recetas (ordenadas).
export function categoriasDe(recetas) {
  const set = new Set();
  recetas.forEach((r) => (r.categoria || []).forEach((c) => c && set.add(c)));
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}
