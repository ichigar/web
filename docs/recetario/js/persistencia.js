/* Persistencia en localStorage. Las funciones de guardado reciben el dato por
   parámetro (no leen estado global). Las constantes de dominio (DIAS/COMIDAS/
   MAX_PLATOS) y las claves LS_* viven en estado.js y se importan aquí. */
import { LS_KEY, LS_SEL_MENU, LS_EXTRAS, LS_EDICIONES, LS_MENU, DIAS, COMIDAS, MAX_PLATOS } from "./estado.js";

export function cargarSeleccion() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
  catch { return []; }
}
export function guardarSeleccion(seleccion) {
  localStorage.setItem(LS_KEY, JSON.stringify([...seleccion]));
}
export function cargarSeleccionMenu() {
  try { return JSON.parse(localStorage.getItem(LS_SEL_MENU)) || []; }
  catch { return []; }
}
export function guardarSeleccionMenu(seleccionMenu) {
  localStorage.setItem(LS_SEL_MENU, JSON.stringify([...seleccionMenu]));
}
export function cargarExtras() {
  try { return JSON.parse(localStorage.getItem(LS_EXTRAS)) || []; }
  catch { return []; }
}
export function guardarExtras(extras) {
  localStorage.setItem(LS_EXTRAS, JSON.stringify(extras));
}
export function cargarEdiciones() {
  try { return JSON.parse(localStorage.getItem(LS_EDICIONES)) || {}; }
  catch { return {}; }
}
export function guardarEdiciones(ed) {
  localStorage.setItem(LS_EDICIONES, JSON.stringify(ed));
}
// Menú semanal normalizado: siempre los 7 días con sus 4 comidas (array de ids).
export function cargarMenu() {
  let guardado = {};
  try { guardado = JSON.parse(localStorage.getItem(LS_MENU)) || {}; }
  catch { guardado = {}; }
  const menu = {};
  DIAS.forEach((d) => {
    menu[d] = {};
    COMIDAS.forEach((c) => {
      const v = guardado[d] && guardado[d][c];
      // Cada celda es un array de ids. Migra el formato viejo (id|null → [id]|[])
      // y recorta al máximo de platos de esa comida.
      let platos = Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []);
      menu[d][c] = platos.slice(0, MAX_PLATOS[c]);
    });
  });
  return menu;
}
export function guardarMenu(m) {
  localStorage.setItem(LS_MENU, JSON.stringify(m));
}
// Superpone las ediciones locales (por id) sobre la lista cargada del JSON.
// Las ediciones de recetas existentes se fusionan; las de ids que no están en
// el JSON base son recetas NUEVAS añadidas a mano en este dispositivo → se anexan.
export function aplicarEdiciones(lista, ed) {
  const ids = new Set(lista.map((r) => r.id));
  const fusionada = lista.map((r) => (ed[r.id] ? { ...r, ...ed[r.id] } : r));
  const nuevas = Object.keys(ed).filter((id) => !ids.has(id)).map((id) => ed[id]);
  return fusionada.concat(nuevas);
}
