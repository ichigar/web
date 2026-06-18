/* Estado central de la app y constantes de dominio.
   El estado mutable vive en el objeto `S` (importado por los módulos que lo leen
   o mutan). Las reasignaciones se hacen sobre `S.x = …`; los Set/objeto se mutan
   in-place (S.seleccion.add(...), etc.). */

// --- Claves de localStorage ---
export const LS_KEY = "recetario.seleccion";
export const LS_EXTRAS = "recetario.extras";
// Ediciones hechas en este dispositivo cuando no hay servidor (móvil/PWA).
export const LS_EDICIONES = "recetario.ediciones";
export const LS_TEMA = "recetario.tema";       // "auto" | "claro" | "oscuro"
export const LS_MENU = "recetario.menu";       // menú semanal { dia: { comida: [idReceta] } }
// Ids que entraron en la cesta por el menú semanal (para quitarlos de la cesta al
// quitarlos del menú, sin tocar los que el usuario seleccionó a mano).
export const LS_SEL_MENU = "recetario.seleccion_menu";

// --- Dominio: menú semanal ---
export const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
export const COMIDAS = ["desayuno", "almuerzo", "merienda", "cena"];
// Nº máximo de platos por comida: almuerzo y cena hasta 3; desayuno y merienda, 1.
export const MAX_PLATOS = { desayuno: 1, almuerzo: 3, merienda: 1, cena: 3 };
export const DIAS_NOMBRE = {
  lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves",
  viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
};
export const COMIDAS_NOMBRE = {
  desayuno: "Desayuno", almuerzo: "Almuerzo", merienda: "Merienda", cena: "Cena",
};

// --- Estado mutable compartido ---
export const S = {
  RECETAS: [],          // catálogo de recetas (fuente de verdad en memoria)
  porId: {},            // índice por id
  seleccion: new Set(), // cesta de la compra (ids)
  seleccionMenu: new Set(), // ids que entraron en la cesta por el menú
  extras: [],           // ingredientes añadidos a mano [{nombre, cantidad}]
  menuSemanal: {},       // { dia: { comida: [idReceta] } }
  excluidos: new Set(), // ingredientes quitados de la lista (solo en memoria)
  temaActual: "auto",   // "auto" | "claro" | "oscuro"
  restaurando: false,   // evita re-pushear durante popstate
};
