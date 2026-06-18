/* Normalización de ingredientes para la lista de la compra: detección de básicos
   de despensa, unidades simbólicas y limpieza del nombre. Sin estado de la app. */

const DESPENSA = [
  /\bagua\b/, /\bsal\b/, /\bpimienta\b/, /\baceite\b/, /\bvinagre\b/,
  /\bc[úu]rcuma\b/, /\bcomino\b/, /\bpiment[óo]n\b/, /\bcanela\b/, /\bor[ée]gano\b/,
  /\btomillo\b/, /\bromero\b/, /\bnuez moscada\b/, /\bclavo\b/, /\bcayena\b/,
  /\bjengibre en polvo\b/, /\bajo en polvo\b/, /\bcebolla en polvo\b/,
  /\bcardamomo\b/, /\bcurry en polvo\b/, /\bbicarbonato\b/, /\blevadura\b/,
  /\bcopos de chile\b/, /\bsazonador\b/, /\bespecias\b/, /\bhierbas\b/,
  /\bedulcorante\b/, /\bestevia\b/,
];
// Variantes "comprables" que NO deben filtrarse aunque casen con DESPENSA.
const NO_DESPENSA = /\b(coco|gas|mineral|t[óo]nica|de mar|azahar)\b/;

export function esDespensa(nombre) {
  const n = nombre.toLowerCase().trim();
  if (NO_DESPENSA.test(n)) return false;
  return DESPENSA.some((re) => re.test(n));
}

// Unidades simbólicas: para ellas no tiene sentido sumar, se muestra solo nombre.
export function esUnidadSimbolica(unidad) {
  const u = (unidad || "").toLowerCase().replace(/\.$/, "");
  return ["pizca", "pizcas", "cda", "cdas", "cdta", "cdtas", "cucharada",
          "cucharadas", "cucharadita", "cucharaditas", "rama", "ramas",
          "ramita", "ramitas", "diente", "dientes", "hoja", "hojas",
          "puñado", "puñados", "chorrito", "chorro", "manojo"].includes(u);
}

// Normaliza el nombre para comprar quitando el TRATAMIENTO que se hace en casa
// (picar, rallar, cortar, exprimir, pelar...) y los adjetivos de tamaño/estado.
// NO quita lo que define el producto a comprar (triturado, concentrado, lata,
// de coco...), que se conserva porque cambia lo que compras.
const PREP = new RegExp(
  "\\b(" + [
    // cortes y troceados
    "picad[oa]s?", "rallad[oa]s?", "cortad[oa]s?", "laminad[oa]s?",
    "trocead[oa]s?", "rebanad[oa]s?", "en\\s+(rodajas?|cubos?|dados?|tiras?|" +
    "juliana|l[áa]minas?|trozos?|gajos?|cuartos?|mitades?|floretes?|bastones?|aros?)",
    "partid[oa]s?(\\s+por\\s+la\\s+mitad)?", "en\\s+mitades?", "desmenuzad[oa]s?",
    // limpieza y preparado manual
    "pelad[oa]s?", "escurrid[oa]s?", "lavad[oa]s?", "enjuagad[oa]s?",
    "exprimid[oa]s?", "deshuesad[oa]s?", "desgranad[oa]s?", "descorazonad[oa]s?",
    "sin\\s+(rabito|tallo|hueso|piel|pepitas?|semillas?)", "con\\s+piel",
    "deveinad[oa]s?", "tamizad[oa]s?", "derretid[oa]s?", "ablandad[oa]s?",
    // estado / madurez / temperatura (no afecta a la compra)
    "fresc[oa]s?", "crud[oa]s?", "cocid[oa]s?", "maduro?s?", "templad[oa]s?",
    "fr[íi][oa]s?", "calient[ea]s?", "ti?bi[oa]s?",
    // tamaño y cantidad descriptiva
    "grandes?", "peque[ñn][oa]s?", "median[oa]s?", "grues[oa]s?",
    // modificadores de corte
    "finamente", "muy\\s+fin[oa]s?", "fin[oa]s?", "grues[oa]s?",
    // coletillas de uso
    "opcional", "al\\s+gusto", "al\\s+servir", "para\\s+servir",
    "para\\s+decorar", "para\\s+garnish", "extra",
  ].join("|") + ")\\b",
  "gi"
);

export function nombreCompra(nombre) {
  let n = nombre.replace(/\([^)]*\)/g, "");        // quita paréntesis (notas)
  n = n.replace(/,.*$/, "");                       // quita lo que va tras una coma
  // Quita prefijos de medida que quedaron pegados al nombre
  // ("cda. de aceite", "1/2 cdta. de sal", "Jugo de ½ limón", "1 taza de X").
  n = n.replace(/^\s*[\d¼-¾⅐-⅞.,/\s]*\b(cdas?|cdtas?|cucharad(?:a|ita)s?|tazas?|vasos?|pizcas?|g|kg|ml|l|gr|oz|libras?)\.?\s+de\s+/i, "");
  n = n.replace(/^\s*(jugo|zumo|ralladura|el jugo|el zumo)\s+de\s+(½|¼|¾|\d+\s*)?/i, "");
  n = n.replace(PREP, "").replace(PREP, ""); // dos pasadas: limpia coletillas encadenadas
  n = n.replace(/\s+/g, " ").replace(/\s+(y|o|e)\s*$/, "").trim();
  n = n.replace(/^de\s+/i, "");
  n = n.replace(/^[½¼¾⅐-⅞\d.,/\s]+/, "").trim();    // restos numéricos al inicio
  return n || nombre.trim();
}
