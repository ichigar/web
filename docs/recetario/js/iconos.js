/* Iconos SVG (estilo línea, tipo Lucide), logo de WhatsApp, y helpers de imagen
   de receta (placeholder con emoji cuando no hay foto). Sin estado de la app. */
import { escapar } from "./formato.js";

// Cada entrada es el contenido interior de un <svg> 24x24 con stroke.
export const ICON_PATHS = {
  home: `<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>`,
  list: `<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>`,
  cart: `<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2l2.4 12.2a1 1 0 0 0 1 .8h9.3a1 1 0 0 0 1-.8L20 7H6"/>`,
  trash: `<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7"/><path d="M10 11v6M14 11v6"/>`,
  download: `<path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"/>`,
  edit: `<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>`,
  plus: `<path d="M12 5v14M5 12h14"/>`,
  save: `<path d="M5 3h11l3 3v15H5Z"/><path d="M8 3v6h7V3M8 21v-6h8v6"/>`,
  printer: `<path d="M6 9V3h12v6"/><path d="M6 18H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2"/><path d="M6 14h12v7H6Z"/>`,
  copy: `<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>`,
  x: `<path d="M18 6 6 18M6 6l12 12"/>`,
  check: `<path d="M20 6 9 17l-5-5"/>`,
  menu: `<path d="M3 6h18M3 12h18M3 18h18"/>`,
  smartphone: `<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>`,
  apple: `<path d="M16 13c0 3-2 6-3.5 6S11 18 10 18s-1.5 1-2.5 1S4 16 4 13s2-5 4-5c1 0 1.6.6 2.5.6S13 8 14 8s2 .8 2.6 1.8c-1 .6-1.6 1.6-1.6 3.2Z"/><path d="M13 5c.5-1 1.6-1.8 2.6-1.8 0 1-.5 2-1 2.6"/>`,
  share: `<path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M6 12H5a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1"/>`,
  camera: `<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><circle cx="12" cy="13" r="3.5"/>`,
  plus_circle: `<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>`,
  help: `<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3.5"/><path d="M12 17h.01"/>`,
  calendario: `<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/>`,
  sol: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
  luna: `<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z"/>`,
  auto: `<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" stroke="none"/>`,
  // Logo: carrito de la compra con una hoja (recetas saludables → compra).
  logo: `<circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/><path d="M2 3h2l2.2 11a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.8L19.5 8H6.2"/><path d="M13 7.5c0-2 1.6-3.5 3.6-3.5-.2 2-1.6 3.5-3.6 3.5Z"/><path d="M13 7.5C13 5.6 11.4 4 9.5 4"/>`,
};

export function ico(nombre, cls = "ico") {
  return `<svg class="${cls}" viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none"`
    + ` stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`
    + ` aria-hidden="true">${ICON_PATHS[nombre] || ""}</svg>`;
}

// Logo de WhatsApp (relleno, color de marca; hereda el blanco del texto del botón).
export const ICONO_WHATSAPP =
  `<svg class="icono-wa" viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="currentColor" aria-hidden="true">`
  + `<path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.515 5.26l-.999 3.648 3.973-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>`
  + `</svg>`;

// Emoji representativo para recetas sin imagen (por palabras clave del título/categoría).
export function emojiReceta(r) {
  const t = [r.nombre, ...(r.categoria || []), ...(r.keywords || [])]
    .join(" ").toLowerCase();
  const reglas = [
    [/smoothie|batido|licuado|jugo|zumo|bebida/, "🥤"],
    [/leche|latte|café/, "🥛"],
    [/helado/, "🍨"],
    [/sopa|crema|caldo/, "🍲"],
    [/ensalada/, "🥗"],
    [/pasta|boloñesa|espagueti|fideos/, "🍝"],
    [/taco|burrito/, "🌮"],
    [/hamburguesa/, "🍔"],
    [/salmón|merluza|pescado|atún|sardina|caballa|bacalao/, "🐟"],
    [/pollo|pavo/, "🍗"],
    [/huevo|tortilla|revuelto/, "🍳"],
    [/tostada|pan/, "🍞"],
    [/avena|granola|parfait|yogur|desayuno/, "🥣"],
    [/curry|kitchari|arroz|bowl/, "🍚"],
    [/lenteja|garbanzo|frijol|judía|legumbre/, "🫘"],
    [/manzana|fruta|plátano/, "🍎"],
    [/berenjena|calabaza|verdura|ratatouille|escalivada/, "🍆"],
  ];
  for (const [re, em] of reglas) if (re.test(t)) return em;
  return "🍽️";
}

// HTML del placeholder con emoji (cuando no hay imagen o falla la carga).
export function placeholderHtml(r, clasePh) {
  return `<div class="${clasePh}" aria-label="${escapar(r.nombre)}">${emojiReceta(r)}</div>`;
}

// Imagen de la receta o, si no hay, el placeholder con emoji.
// El fallback ante error de carga se ata con JS en activarMedia().
export function mediaHtml(r, claseImg, clasePh) {
  if (!r.imagen) return placeholderHtml(r, clasePh);
  return `<img class="${claseImg}" loading="lazy" data-ph="${escapar(clasePh)}"
            src="${escapar(r.imagen)}" alt="${escapar(r.nombre)}">`;
}

// Sustituye por el placeholder cualquier imagen que no cargue, dentro de `raiz`.
export function activarMedia(raiz, r) {
  raiz.querySelectorAll("img[data-ph]").forEach((img) => {
    img.addEventListener("error", () => {
      const tmp = document.createElement("div");
      tmp.innerHTML = placeholderHtml(r, img.dataset.ph);
      img.replaceWith(tmp.firstElementChild);
    });
  });
}
