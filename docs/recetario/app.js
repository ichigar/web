/* ===== Recetario — lógica de la app (vanilla JS) ===== */
(() => {
  "use strict";

  const LS_KEY = "recetario.seleccion";
  const LS_EXTRAS = "recetario.extras";
  // Ediciones hechas en este dispositivo cuando no hay servidor (móvil/PWA).
  // Objeto { [id]: receta }, se superpone sobre recetas.json al cargar.
  const LS_EDICIONES = "recetario.ediciones";
  const LS_TEMA = "recetario.tema";   // "auto" | "claro" | "oscuro"
  const LS_MENU = "recetario.menu";   // menú semanal { dia: { comida: [idReceta] } }
  // Ids que entraron en la cesta por el menú semanal (para poder quitarlos de la
  // cesta al quitarlos del menú, sin tocar los que el usuario seleccionó a mano).
  const LS_SEL_MENU = "recetario.seleccion_menu";

  // Menú semanal: 7 días × 4 comidas. Una receta por celda (puede repetirse en
  // varias celdas); las celdas vacías son null.
  const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const COMIDAS = ["desayuno", "almuerzo", "merienda", "cena"];
  // Nº máximo de platos por comida: almuerzo y cena admiten hasta 3; desayuno y
  // merienda, 1. Cada celda del menú es un array de ids (longitud ≤ este máximo).
  const MAX_PLATOS = { desayuno: 1, almuerzo: 3, merienda: 1, cena: 3 };
  const DIAS_NOMBRE = {
    lunes: "Lunes", martes: "Martes", miercoles: "Miércoles", jueves: "Jueves",
    viernes: "Viernes", sabado: "Sábado", domingo: "Domingo",
  };
  const COMIDAS_NOMBRE = {
    desayuno: "Desayuno", almuerzo: "Almuerzo", merienda: "Merienda", cena: "Cena",
  };

  // --- Iconos SVG (estilo línea, tipo Lucide; heredan el color con currentColor) ---
  // Cada entrada es el contenido interior de un <svg> 24x24 con stroke.
  const ICON_PATHS = {
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
  function ico(nombre, cls = "ico") {
    return `<svg class="${cls}" viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none"`
      + ` stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`
      + ` aria-hidden="true">${ICON_PATHS[nombre] || ""}</svg>`;
  }

  // Logo de WhatsApp (relleno, color de marca; hereda el blanco del texto del botón).
  const ICONO_WHATSAPP =
    `<svg class="icono-wa" viewBox="0 0 24 24" width="1.15em" height="1.15em" fill="currentColor" aria-hidden="true">`
    + `<path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.515 5.26l-.999 3.648 3.973-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>`
    + `</svg>`;

  let RECETAS = [];
  let porId = {};
  let seleccion = new Set(cargarSeleccion());
  let seleccionMenu = new Set(cargarSeleccionMenu());   // ids que entraron por el menú
  let extras = cargarExtras();   // ingredientes añadidos a mano [{nombre, cantidad}]
  let menuSemanal = cargarMenu();   // menú semanal { dia: { comida: [idReceta] } }
  // Ingredientes generados que el usuario ha quitado de la lista de la compra
  // (por clave en minúsculas). Solo en memoria: se descarta al cambiar la selección.
  let excluidos = new Set();

  // --- Referencias DOM ---
  const $ = (sel) => document.querySelector(sel);
  const vistaListado = $("#vista-listado");
  const vistaDetalle = $("#vista-detalle");
  const vistaEdicion = $("#vista-edicion");
  const vistaSeleccion = $("#vista-seleccion");
  const vistaCompra = $("#vista-compra");
  const vistaAyuda = $("#vista-ayuda");
  const vistaGuia = $("#vista-guia");
  const vistaMenu = $("#vista-menu");
  const grid = $("#grid");
  const contador = $("#contador");
  const inputBuscar = $("#buscar");
  const selectsCat = [...document.querySelectorAll(".filtro-categoria")];
  const zonaBuscador = $("#zona-buscador");
  const barraSel = $("#barra-seleccion");
  const resumenSel = $("#resumen-seleccion");

  // --- Utilidades ---
  function cargarSeleccion() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; }
    catch { return []; }
  }
  function guardarSeleccion() {
    localStorage.setItem(LS_KEY, JSON.stringify([...seleccion]));
  }
  function cargarSeleccionMenu() {
    try { return JSON.parse(localStorage.getItem(LS_SEL_MENU)) || []; }
    catch { return []; }
  }
  function guardarSeleccionMenu() {
    localStorage.setItem(LS_SEL_MENU, JSON.stringify([...seleccionMenu]));
  }
  function cargarExtras() {
    try { return JSON.parse(localStorage.getItem(LS_EXTRAS)) || []; }
    catch { return []; }
  }
  function guardarExtras() {
    localStorage.setItem(LS_EXTRAS, JSON.stringify(extras));
  }
  function cargarEdiciones() {
    try { return JSON.parse(localStorage.getItem(LS_EDICIONES)) || {}; }
    catch { return {}; }
  }
  function guardarEdiciones(ed) {
    localStorage.setItem(LS_EDICIONES, JSON.stringify(ed));
  }
  // Menú semanal normalizado: siempre los 7 días con sus 4 comidas (null si vacío).
  function cargarMenu() {
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
  function guardarMenu(m) {
    localStorage.setItem(LS_MENU, JSON.stringify(m));
  }
  // Superpone las ediciones locales (por id) sobre la lista cargada del JSON.
  // Las ediciones de recetas existentes se fusionan; las de ids que no están en
  // el JSON base son recetas NUEVAS añadidas a mano en este dispositivo → se anexan.
  function aplicarEdiciones(lista, ed) {
    const ids = new Set(lista.map((r) => r.id));
    const fusionada = lista.map((r) => (ed[r.id] ? { ...r, ...ed[r.id] } : r));
    const nuevas = Object.keys(ed).filter((id) => !ids.has(id)).map((id) => ed[id]);
    return fusionada.concat(nuevas);
  }
  function formatoCantidad(n) {
    if (n == null) return "";
    // entero exacto sin decimales; si no, redondea a 2.
    return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
  }
  function tiempoTexto(r) {
    const t = r.tiempo_total_min;
    return t ? `⏱️ ${t} min` : "";
  }
  function escapar(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  // Emoji representativo para recetas sin imagen (por palabras clave del título/categoría).
  function emojiReceta(r) {
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
  function placeholderHtml(r, clasePh) {
    return `<div class="${clasePh}" aria-label="${escapar(r.nombre)}">${emojiReceta(r)}</div>`;
  }

  // Imagen de la receta o, si no hay, el placeholder con emoji.
  // El fallback ante error de carga se ata con JS en activarMedia().
  function mediaHtml(r, claseImg, clasePh) {
    if (!r.imagen) return placeholderHtml(r, clasePh);
    return `<img class="${claseImg}" loading="lazy" data-ph="${escapar(clasePh)}"
              src="${escapar(r.imagen)}" alt="${escapar(r.nombre)}">`;
  }

  // Sustituye por el placeholder cualquier imagen que no cargue, dentro de `raiz`.
  function activarMedia(raiz, r) {
    raiz.querySelectorAll("img[data-ph]").forEach((img) => {
      img.addEventListener("error", () => {
        const tmp = document.createElement("div");
        tmp.innerHTML = placeholderHtml(r, img.dataset.ph);
        img.replaceWith(tmp.firstElementChild);
      });
    });
  }

  // --- Inicio / carga de datos ---
  async function init() {
    try {
      const resp = await fetch("recetas.json", { cache: "no-cache" });
      RECETAS = await resp.json();
    } catch (e) {
      grid.innerHTML = `<p class="aviso">No se pudo cargar recetas.json.<br>Sirve la web con un servidor (no abras el archivo directamente).</p>`;
      return;
    }
    // Superpone las ediciones guardadas en este dispositivo (móvil/PWA offline).
    RECETAS = aplicarEdiciones(RECETAS, cargarEdiciones());
    RECETAS.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    porId = Object.fromEntries(RECETAS.map((r) => [r.id, r]));
    volcarMenuASeleccion();   // las recetas del menú semanal alimentan la cesta
    actualizarSelectoresCategoria();
    renderListado();
    actualizarBarra();
    history.replaceState({ vista: "listado", id: null }, "");  // estado base
  }

  // Categorías disponibles en un conjunto de recetas (ordenadas).
  function categoriasDe(recetas) {
    const set = new Set();
    recetas.forEach((r) => (r.categoria || []).forEach((c) => c && set.add(c)));
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }

  // Nombres de ingredientes ya usados en el catálogo, limpios (sin cantidades ni
  // medidas pegadas), únicos y ordenados. Para autocompletar (datalist) al
  // añadir/editar una receta. Reutiliza nombreCompra() (hoisted).
  function nombresIngredientes() {
    const set = new Set();
    RECETAS.forEach((r) => (r.ingredientes || []).forEach((i) => {
      let limpio = nombreCompra((i.nombre || "").trim())
        .replace(/^[:;.\s]+/, "");                    // restos de scraping al inicio
      // Descarta lo que aún arrastra cantidad/medida (pocos casos residuales).
      if (!limpio || /^[\d½¼¾⅐-⅞]/.test(limpio) || /\bcdas?\.|cdtas?\.|cucharad/i.test(limpio)) return;
      set.add(limpio.charAt(0).toUpperCase() + limpio.slice(1));
    }));
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }

  // Rellena los selectores de categoría de forma ENCADENADA: el 2º solo ofrece
  // categorías de recetas que tienen la del 1º, y el 3º las que tienen 1º y 2º.
  // Conserva la selección de cada uno si sigue siendo válida; si no, la limpia.
  function actualizarSelectoresCategoria() {
    const placeholders = ["Categoría…", "+ Categoría…", "+ Categoría…"];
    selectsCat.forEach((sel, idx) => {
      // Recetas que ya cumplen las categorías elegidas en los selects ANTERIORES.
      const previas = selectsCat.slice(0, idx).map((s) => s.value).filter(Boolean);
      const base = RECETAS.filter((r) =>
        previas.every((c) => (r.categoria || []).includes(c)));
      // Opciones: categorías de esas recetas, excluyendo las ya elegidas antes.
      const opciones = categoriasDe(base).filter((c) => !previas.includes(c));
      const valorActual = sel.value;
      sel.innerHTML = `<option value="">${placeholders[idx]}</option>` +
        opciones.map((c) => `<option value="${escapar(c)}">${escapar(c)}</option>`).join("");
      // Conserva el valor si sigue disponible.
      sel.value = opciones.includes(valorActual) ? valorActual : "";
    });
  }

  // Normaliza texto para buscar: minúsculas y sin acentos ("plátano" → "platano").
  function normalizarBusqueda(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // --- Vista: listado ---
  function recetasFiltradas() {
    // Cada término separado por espacios debe aparecer (AND): "salmon aguacate"
    // encuentra recetas que contengan ambos, no la frase literal.
    const terminos = normalizarBusqueda(inputBuscar.value.trim()).split(/\s+/).filter(Boolean);
    // Categorías seleccionadas (hasta 3) — la receta debe tenerlas TODAS (AND).
    const cats = selectsCat.map((s) => s.value).filter(Boolean);
    return RECETAS.filter((r) => {
      const suyas = r.categoria || [];
      if (!cats.every((c) => suyas.includes(c))) return false;
      if (!terminos.length) return true;
      const heno = normalizarBusqueda([
        r.nombre, r.descripcion,
        ...(r.keywords || []),
        ...(r.ingredientes || []).map((i) => i.nombre),
      ].join(" "));
      return terminos.every((t) => heno.includes(t));
    });
  }

  function renderListado() {
    const lista = recetasFiltradas();
    contador.textContent = `${lista.length} receta${lista.length === 1 ? "" : "s"}`;
    grid.innerHTML = "";
    lista.forEach((r) => grid.appendChild(tarjeta(r)));
  }

  function tarjeta(r) {
    const el = document.createElement("article");
    el.className = "tarjeta";
    const checked = seleccion.has(r.id) ? "checked" : "";
    const tags = (r.categoria || []).map((c) => `<span class="tag">${escapar(c)}</span>`).join("");
    el.innerHTML = `
      ${mediaHtml(r, "tarjeta-img", "tarjeta-img tarjeta-ph")}
      <div class="tarjeta-cuerpo">
        <h3 class="tarjeta-titulo">${escapar(r.nombre)}</h3>
        <div class="tarjeta-meta">
          ${tiempoTexto(r) ? `<span>${tiempoTexto(r)}</span>` : ""}
          ${r.raciones ? `<span>🍽️ ${r.raciones}</span>` : ""}
        </div>
        <div class="tarjeta-tags">${tags}</div>
        <label class="sel-receta">
          <input type="checkbox" data-id="${escapar(r.id)}" ${checked}>
          Añadir a la lista
        </label>
        <button class="tarjeta-al-menu btn-ico" data-id="${escapar(r.id)}">${ico("calendario")} Añadir al menú</button>
      </div>`;
    el.querySelector(".tarjeta-img").onclick = () => verDetalle(r.id);
    el.querySelector(".tarjeta-titulo").onclick = () => verDetalle(r.id);
    el.querySelector("input").onchange = (e) => toggleSeleccion(r.id, e.target.checked);
    el.querySelector(".tarjeta-al-menu").onclick = () => elegirDiaComidaParaReceta(r.id);
    activarMedia(el, r);
    return el;
  }

  // --- Selección ---
  function toggleSeleccion(id, on) {
    if (on) seleccion.add(id); else seleccion.delete(id);
    // Tocar la cesta a mano "desvincula" el id del menú: ya no se auto-quitará al
    // quitarlo del menú (lo gestiona el usuario), ni se reañadirá solo.
    seleccionMenu.delete(id);
    guardarSeleccionMenu();
    excluidos.clear();   // cambiar la selección reinicia los ingredientes quitados
    guardarSeleccion();
    actualizarBarra();
    // sincroniza checkboxes con el mismo id en otras vistas
    document.querySelectorAll(`input[data-id="${CSS.escape(id)}"]`)
      .forEach((c) => (c.checked = on));
  }

  function actualizarBarra() {
    const n = seleccion.size;
    resumenSel.innerHTML =
      `<span class="sel-num">${n}</span>`
      + `<span class="sel-txt">seleccionada${n === 1 ? "" : "s"}</span>`
      + `<span class="sel-chevron" aria-hidden="true">›</span>`;
    barraSel.hidden = n === 0;
    // Si la vista de selección está abierta, refréscala al cambiar la selección.
    if (!vistaSeleccion.hidden) {
      if (n === 0) mostrarListado();
      else verSeleccion();
    }
  }

  // --- Vista: recetas seleccionadas ---
  function verSeleccion() {
    const recetasSel = [...seleccion].map((id) => porId[id]).filter(Boolean);
    if (!recetasSel.length) { mostrarListado(); return; }
    recetasSel.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

    const items = recetasSel.map((r) => {
      const cat = (r.categoria || []).filter((c) =>
        ["Desayuno", "Merienda", "Almuerzo", "Cena"].includes(c)).join(" · ");
      return `
        <li class="sel-item" data-id="${escapar(r.id)}">
          ${mediaHtml(r, "sel-item-img", "sel-item-img sel-item-ph")}
          <div class="sel-item-info">
            <span class="sel-item-nombre">${escapar(r.nombre)}</span>
            <span class="sel-item-meta">
              ${tiempoTexto(r) ? tiempoTexto(r) + " · " : ""}${cat || ""}
            </span>
          </div>
          <button class="btn-quitar" data-quitar="${escapar(r.id)}" aria-label="Quitar de la selección">${ico("x")}</button>
        </li>`;
    }).join("");

    vistaSeleccion.innerHTML = `
      <div class="seleccion">
        <button class="volver">← Volver al listado</button>
        <h2 class="titulo-ico">${ico("list")} Recetas seleccionadas (${recetasSel.length})</h2>
        <ul class="sel-lista">${items}</ul>
        <div class="acciones-compra">
          <button class="btn-primario btn-ico" id="sel-ver-lista">${ico("cart")} Generar lista de la compra</button>
          <button class="btn-secundario" id="sel-vaciar">Vaciar selección</button>
        </div>
      </div>`;

    vistaSeleccion.querySelector(".volver").onclick = mostrarListado;
    vistaSeleccion.querySelector("#sel-ver-lista").onclick = verListaCompra;
    vistaSeleccion.querySelector("#sel-vaciar").onclick = vaciarSeleccion;
    // Abrir detalle al pulsar la mini-tarjeta (excepto el botón quitar).
    vistaSeleccion.querySelectorAll(".sel-item").forEach((li) => {
      li.querySelector(".sel-item-info").onclick = () => verDetalle(li.dataset.id);
      li.querySelector(".sel-item-img").onclick = () => verDetalle(li.dataset.id);
    });
    vistaSeleccion.querySelectorAll("[data-quitar]").forEach((b) => {
      b.onclick = () => toggleSeleccion(b.dataset.quitar, false);
    });
    recetasSel.forEach((r) => activarMedia(vistaSeleccion, r));
    registrarVista("seleccion");
    cambiarVista(vistaSeleccion);
  }

  function vaciarSeleccion() {
    seleccion.clear();
    seleccionMenu.clear();
    excluidos.clear();
    guardarSeleccion();
    guardarSeleccionMenu();
    document.querySelectorAll('input[type="checkbox"][data-id]').forEach((c) => (c.checked = false));
    actualizarBarra();
    mostrarListado();
  }

  // --- Vista: detalle ---
  function verDetalle(id) {
    const r = porId[id];
    if (!r) return;
    const checked = seleccion.has(id) ? "checked" : "";
    const ingHtml = (r.ingredientes || []).map((i) => `
      <li>
        ${i.cantidad != null ? `<span class="cant">${formatoCantidad(i.cantidad)} ${escapar(i.unidad || "")}</span> ` : ""}
        ${escapar(i.nombre)}
        ${i.nota ? `<div class="nota">${escapar(i.nota)}</div>` : ""}
      </li>`).join("");
    const pasosHtml = (r.pasos || []).map((p) => `<li>${escapar(p)}</li>`).join("");
    const nutri = r.nutricion
      ? `<div class="bloque"><h3>Información nutricional</h3><div class="nutri">${
          Object.entries(r.nutricion).map(([k, v]) =>
            `<span>${escapar(k.replace(/_/g, " "))}: ${escapar(v)}</span>`).join("")
        }</div></div>`
      : "";

    vistaDetalle.innerHTML = `
      <div class="detalle">
        <div class="detalle-top">
          <button class="volver">← Volver al listado</button>
          <button class="btn-editar btn-ico" id="btn-editar">${ico("edit")} Editar</button>
        </div>
        ${mediaHtml(r, "detalle-img", "detalle-img detalle-ph")}
        <h2>${escapar(r.nombre)}</h2>
        <div class="detalle-meta">
          ${tiempoTexto(r) ? `<span>${tiempoTexto(r)}</span>` : ""}
          ${r.raciones ? `<span>🍽️ ${r.raciones} raciones</span>` : ""}
          ${(r.categoria || []).map((c) => `<span class="tag">${escapar(c)}</span>`).join("")}
          ${r.valoracion && r.valoracion.media ? `<span>⭐ ${r.valoracion.media} (${r.valoracion.votos || 0})</span>` : ""}
        </div>
        ${r.descripcion ? `<p class="detalle-desc">${escapar(r.descripcion)}</p>` : ""}
        <label class="sel-receta">
          <input type="checkbox" data-id="${escapar(r.id)}" ${checked}> Añadir a la lista de la compra
        </label>
        <button class="btn-secundario btn-ico" id="btn-al-menu">${ico("calendario")} Añadir al menú semanal</button>
        <div class="bloque"><h3>Ingredientes</h3><ul class="lista-ing">${ingHtml}</ul></div>
        ${(r.pasos && r.pasos.length)
          ? `<div class="bloque"><h3>Preparación</h3><ol class="pasos">${pasosHtml}</ol></div>`
          : `<p class="bloque nota">Plato orientativo del menú semanal (sin preparación detallada).</p>`}
        ${nutri}
        ${r.url ? `<p class="bloque"><a href="${escapar(r.url)}" target="_blank" rel="noopener">Ver receta original ↗</a></p>` : ""}
      </div>`;
    vistaDetalle.querySelector(".volver").onclick = mostrarListado;
    vistaDetalle.querySelector("#btn-editar").onclick = () => editarReceta(r.id);
    vistaDetalle.querySelector(".sel-receta input").onchange = (e) => toggleSeleccion(r.id, e.target.checked);
    vistaDetalle.querySelector("#btn-al-menu").onclick = () => elegirDiaComidaParaReceta(r.id);
    activarMedia(vistaDetalle, r);
    registrarVista("detalle", r.id);
    cambiarVista(vistaDetalle);
  }

  // Genera un id único tipo slug a partir del nombre (prefijo "mia-" = añadida a mano).
  function crearRecetaVacia(nombre) {
    const base = "mia-" + (nombre || "receta").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")   // quita acentos
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    let id = base, n = 2;
    while (porId[id]) id = `${base}-${n++}`;   // evita colisiones
    return {
      id, url: "", nombre: "", descripcion: "", imagen: null,
      categoria: [], cocina: [], keywords: [], dieta: [],
      raciones: null, tiempo_prep_min: null, tiempo_coccion_min: null, tiempo_total_min: null,
      ingredientes: [], pasos: [],
    };
  }

  // Redimensiona y comprime una imagen a una data-URL JPEG (lado máx 800px).
  // Mantiene el peso bajo para que quepa en localStorage en el móvil.
  function comprimirImagen(file, maxLado = 800, calidad = 0.78) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const w = Math.round(img.width * escala), h = Math.round(img.height * escala);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(c.toDataURL("image/jpeg", calidad));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // --- Edición / alta de receta (persiste en el JSON vía el servidor) ---
  // id == null  → alta de receta nueva.  id != null → edición de la existente.
  function editarReceta(id) {
    const nueva = id == null;
    const r = nueva ? null : porId[id];
    if (!nueva && !r) return;
    // Estado de trabajo (copias para no mutar hasta guardar).
    let cats = nueva ? [] : [...(r.categoria || [])];
    let ings = nueva ? [{ cantidad: null, unidad: null, nombre: "", nota: null, texto: "" }]
                     : (r.ingredientes || []).map((i) => ({ ...i }));
    let nombre = nueva ? "" : (r.nombre || "");
    let pasosTexto = nueva ? "" : (r.pasos || []).join("\n");
    let imagen = nueva ? null : (r.imagen || null);   // ruta o data-URL base64
    const todasCats = categoriasDe(RECETAS);

    // Vuelca lo que hay en los inputs al estado, para no perderlo al re-renderizar.
    function leerCampos() {
      const $e = (s) => vistaEdicion.querySelector(s);
      if ($e("#ed-nombre")) nombre = $e("#ed-nombre").value;
      if ($e("#ed-pasos")) pasosTexto = $e("#ed-pasos").value;
      ings = [...vistaEdicion.querySelectorAll(".fila-ing")].map((f) => {
        const cant = f.querySelector(".ed-cant").value.trim();
        return {
          cantidad: cant === "" ? null : (parseFloat(cant.replace(",", ".")) || null),
          unidad: f.querySelector(".ed-uni").value.trim() || null,
          nombre: f.querySelector(".ed-nom").value.trim(),
          nota: null,
          texto: "",
        };
      });
    }

    function render() {
      const optsCat = todasCats
        .filter((c) => !cats.includes(c))
        .map((c) => `<option value="${escapar(c)}">${escapar(c)}</option>`).join("");
      const optsIng = nombresIngredientes()
        .map((nom) => `<option value="${escapar(nom)}"></option>`).join("");
      const chips = cats.map((c, n) =>
        `<span class="chip-edit">${escapar(c)} <button data-quitar-cat="${n}" aria-label="Quitar">${ico("x")}</button></span>`).join("");
      const filasIng = ings.map((i, n) => `
        <div class="fila-ing" data-ing="${n}">
          <input class="ed-cant" value="${escapar(i.cantidad != null ? formatoCantidad(i.cantidad) : "")}" placeholder="Cant.">
          <input class="ed-uni" value="${escapar(i.unidad || "")}" placeholder="Unidad">
          <input class="ed-nom" value="${escapar(i.nombre || "")}" placeholder="Ingrediente" list="lista-ingredientes" autocomplete="off">
          <button class="btn-quitar" data-quitar-ing="${n}" aria-label="Quitar">${ico("x")}</button>
        </div>`).join("");

      const fotoHtml = imagen
        ? `<img class="ed-foto-preview" src="${escapar(imagen)}" alt="Foto de la receta">`
        : `<div class="ed-foto-vacia">Sin foto</div>`;

      vistaEdicion.innerHTML = `
        <div class="detalle edicion">
          <h2 class="titulo-ico">${ico(nueva ? "plus" : "edit")} ${nueva ? "Nueva receta" : "Editar receta"}</h2>
          <label class="campo"><span>Nombre</span>
            <input id="ed-nombre" value="${escapar(nombre)}"></label>

          <div class="campo"><span>Foto</span>
            <div class="ed-foto">${fotoHtml}</div>
            <div class="ed-foto-acciones">
              <label class="btn-secundario btn-ico ed-foto-btn">
                ${ico("camera")} ${imagen ? "Cambiar foto" : "Añadir foto"}
                <input type="file" id="ed-foto-input" accept="image/*" hidden>
              </label>
              ${imagen ? `<button type="button" class="btn-secundario" id="ed-foto-quitar">Quitar foto</button>` : ""}
            </div>
          </div>

          <div class="campo"><span>Categorías</span>
            <div class="chips-edit">${chips}</div>
            <div class="add-cat">
              <select id="ed-cat-sel"><option value="">Añadir categoría…</option>${optsCat}</select>
              <input id="ed-cat-nueva" placeholder="o categoría nueva…">
              <button class="btn-secundario" id="ed-cat-add">Añadir</button>
            </div>
          </div>

          <div class="campo"><span>Ingredientes</span>
            <div id="ed-ings">${filasIng}</div>
            <datalist id="lista-ingredientes">${optsIng}</datalist>
            <button class="btn-secundario btn-ico" id="ed-ing-add">${ico("plus")} Añadir ingrediente</button>
          </div>

          <label class="campo"><span>Preparación (un paso por línea)</span>
            <textarea id="ed-pasos" rows="8">${escapar(pasosTexto)}</textarea></label>

          <div class="acciones-compra">
            <button class="btn-primario btn-ico" id="ed-guardar">${ico("save")} Guardar</button>
            <button class="btn-secundario" id="ed-cancelar">Cancelar</button>
          </div>
          <p class="nota" id="ed-estado"></p>
        </div>`;

      vistaEdicion.querySelectorAll("[data-quitar-cat]").forEach((b) => {
        b.onclick = () => { leerCampos(); cats.splice(+b.dataset.quitarCat, 1); render(); };
      });
      vistaEdicion.querySelector("#ed-cat-add").onclick = () => {
        leerCampos();
        const sel = vistaEdicion.querySelector("#ed-cat-sel").value.trim();
        const nueva = vistaEdicion.querySelector("#ed-cat-nueva").value.trim();
        const c = nueva || sel;
        if (c && !cats.includes(c)) { cats.push(c); render(); }
      };
      vistaEdicion.querySelectorAll("[data-quitar-ing]").forEach((b) => {
        b.onclick = () => { leerCampos(); ings.splice(+b.dataset.quitarIng, 1); render(); };
      });
      vistaEdicion.querySelector("#ed-ing-add").onclick = () => {
        leerCampos(); ings.push({ cantidad: null, unidad: null, nombre: "", nota: null, texto: "" }); render();
      };

      // Foto: comprime la imagen elegida a una data-URL (máx 800px) y previsualiza.
      vistaEdicion.querySelector("#ed-foto-input").onchange = async (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        leerCampos();
        try { imagen = await comprimirImagen(file); }
        catch { alert("No se pudo procesar la imagen."); return; }
        render();
      };
      const btnQuitarFoto = vistaEdicion.querySelector("#ed-foto-quitar");
      if (btnQuitarFoto) btnQuitarFoto.onclick = () => { leerCampos(); imagen = null; render(); };

      vistaEdicion.querySelector("#ed-cancelar").onclick = () => (nueva ? mostrarListado() : verDetalle(id));
      vistaEdicion.querySelector("#ed-guardar").onclick = async () => {
        leerCampos();
        if (!nombre.trim()) { alert("El nombre no puede estar vacío."); return; }
        const pasos = pasosTexto.split("\n").map((p) => p.trim()).filter(Boolean);
        const ingredientes = ings.filter((i) => i.nombre).map((i) => ({
          ...i,
          texto: [i.cantidad != null ? formatoCantidad(i.cantidad) : "", i.unidad || "", i.nombre]
            .filter(Boolean).join(" "),
        }));
        // Receta destino: la existente (edición) o una nueva con id generado (alta).
        const destino = nueva ? crearRecetaVacia(nombre) : r;
        destino.nombre = nombre.trim();
        destino.categoria = cats;
        destino.ingredientes = ingredientes;
        destino.pasos = pasos;
        destino.imagen = imagen;
        if (nueva) { RECETAS.push(destino); porId[destino.id] = destino; }

        const estado = vistaEdicion.querySelector("#ed-estado");
        estado.textContent = "Guardando…";
        const ok = await guardarRecetas(destino.id);
        if (ok) verDetalle(destino.id);
        else estado.textContent = "⚠️ No se pudo guardar. Los cambios siguen en pantalla.";
      };
    }
    render();
    registrarVista("edicion", id);
    cambiarVista(vistaEdicion);
  }

  // Persiste la edición/alta. Con servidor (PC) escribe recetas.json vía POST; sin
  // servidor (móvil/PWA offline) cae a localStorage, superpuesto al cargar.
  async function guardarRecetas(idEditado) {
    try {
      // Con servidor, si la foto es una data-URL (recién hecha), la subimos como
      // archivo a web/img/ y dejamos en la receta la ruta, no el base64.
      const r = idEditado ? porId[idEditado] : null;
      if (r && typeof r.imagen === "string" && r.imagen.startsWith("data:")) {
        const ruta = await subirImagen(idEditado, r.imagen);
        if (ruta) r.imagen = ruta;   // si falla, se queda el base64 (también válido)
      }
      const resp = await fetch("/api/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(RECETAS),
      });
      if (resp.ok) {
        // El servidor es la fuente de verdad: limpiamos el override local de
        // esta receta para no pisar el JSON ya persistido.
        const ed = cargarEdiciones();
        if (idEditado && ed[idEditado]) { delete ed[idEditado]; guardarEdiciones(ed); }
        return true;
      }
    } catch {
      /* sin servidor: caemos a localStorage */
    }
    // Fallback PWA/offline: guardamos solo la receta editada/nueva en este dispositivo
    // (la foto queda como data-URL base64 dentro de la receta).
    if (idEditado) {
      const ed = cargarEdiciones();
      ed[idEditado] = porId[idEditado];
      try {
        guardarEdiciones(ed);
      } catch (e) {   // QuotaExceededError: localStorage lleno (fotos pesadas)
        alert("No hay espacio para guardar la foto en este dispositivo. "
            + "Prueba con una imagen más pequeña o guarda la receta sin foto.");
        return false;
      }
      return true;
    }
    return false;
  }

  // Sube una foto (data-URL) al servidor; devuelve la ruta relativa (img/<id>.jpg)
  // o null si no hay servidor / falla.
  async function subirImagen(id, dataUrl) {
    try {
      const resp = await fetch("/api/imagen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, dataUrl }),
      });
      if (!resp.ok) return null;
      const j = await resp.json();
      return j.ruta || null;
    } catch { return null; }
  }

  // --- Lista de la compra (agregación) ---

  // Básicos de despensa que no se compran (se omiten de la lista, como el agua).
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

  function esDespensa(nombre) {
    const n = nombre.toLowerCase().trim();
    if (NO_DESPENSA.test(n)) return false;
    return DESPENSA.some((re) => re.test(n));
  }

  // Unidades simbólicas: para ellas no tiene sentido sumar, se muestra solo nombre.
  function esUnidadSimbolica(unidad) {
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

  function nombreCompra(nombre) {
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

  function generarListaCompra(ids) {
    const agregados = new Map();   // clave: nombreNorm|unidad  (con cantidad sumable)
    const soloNombre = new Map();  // clave: nombreNorm          (sin cantidad / simbólica)
    ids.forEach((id) => {
      const r = porId[id];
      if (!r) return;
      (r.ingredientes || []).forEach((i) => {
        const original = (i.nombre || "").trim();
        if (!original || esDespensa(original)) return;   // omite despensa
        const nombre = nombreCompra(original);
        if (!nombre) return;
        const clave = nombre.toLowerCase();
        const unidad = (i.unidad || "").trim();
        // Sin cantidad, o cantidad en unidad simbólica -> solo nombre.
        if (i.cantidad == null || esUnidadSimbolica(unidad)) {
          if (!soloNombre.has(clave)) soloNombre.set(clave, { nombre });
          return;
        }
        const claveU = `${clave}|${unidad.toLowerCase()}`;
        const prev = agregados.get(claveU);
        if (prev) prev.cantidad += i.cantidad;
        else agregados.set(claveU, { nombre, unidad, cantidad: i.cantidad, clave });
      });
    });
    // Si un ingrediente ya está cuantificado, no lo dupliques en "solo nombre".
    const cuantificados = new Set([...agregados.values()].map((x) => x.clave));
    const lista = [...agregados.values()]
      .filter((x) => !excluidos.has(x.clave))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    const sinCantidad = [...soloNombre.values()]
      .filter((x) => !cuantificados.has(x.nombre.toLowerCase()))
      .filter((x) => !excluidos.has(x.nombre.toLowerCase()))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return { lista, sinCantidad };
  }

  function verListaCompra() {
    const ids = [...seleccion];
    if (!ids.length) return;
    const recetasSel = ids.map((id) => porId[id]).filter(Boolean);
    const { lista, sinCantidad } = generarListaCompra(ids);

    const incluidas = recetasSel.map((r) =>
      `<li>${escapar(r.nombre)}${r.raciones ? ` <span class="nota">(${r.raciones} raciones)</span>` : ""}</li>`).join("");

    const itemsHtml = lista.map((i) => `
      <li>
        <span class="casilla" aria-hidden="true"></span>
        <span class="cant">${formatoCantidad(i.cantidad)} ${escapar(i.unidad)}</span>
        <span class="nombre-ing">${escapar(i.nombre)}</span>
        <button class="btn-quitar-extra" data-quitar="${escapar(i.clave)}" aria-label="Quitar ${escapar(i.nombre)}">${ico("x")}</button>
      </li>`).join("");

    const sinHtml = sinCantidad.length ? `
      <p class="subtitulo-sin">Otros ingredientes (cantidad al gusto / sin especificar):</p>
      <ul class="lista-compra">
        ${sinCantidad.map((i) => `
          <li><span class="casilla" aria-hidden="true"></span>
          <span class="nombre-ing">${escapar(i.nombre)}${i.unidad ? " (" + escapar(i.unidad) + ")" : ""}</span>
          <button class="btn-quitar-extra" data-quitar="${escapar(i.nombre.toLowerCase())}" aria-label="Quitar ${escapar(i.nombre)}">${ico("x")}</button></li>`).join("")}
      </ul>` : "";

    // Ingredientes añadidos a mano por el usuario.
    const extrasHtml = extras.length ? `
      <ul class="lista-compra">
        ${extras.map((e, n) => `
          <li><span class="casilla" aria-hidden="true"></span>
          ${e.cantidad ? `<span class="cant">${escapar(e.cantidad)}</span>` : ""}
          <span class="nombre-ing">${escapar(e.nombre)}</span>
          <button class="btn-quitar-extra" data-extra="${n}" aria-label="Quitar ${escapar(e.nombre)}">${ico("x")}</button>
          </li>`).join("")}
      </ul>` : "";

    // Barra de acciones (se repite arriba y al final de la lista).
    const acciones = `
        <div class="acciones-compra">
          <button class="btn-primario btn-ico" data-accion="pdf">${ico("printer")} Exportar a PDF</button>
          <button class="btn-whatsapp" data-accion="whatsapp">${ICONO_WHATSAPP} WhatsApp</button>
          <button class="btn-secundario btn-ico" data-accion="copiar">${ico("copy")} Copiar lista</button>
        </div>`;

    vistaCompra.innerHTML = `
      <div class="compra">
        <button class="volver">← Volver a la selección</button>
        <h2 class="titulo-ico">${ico("cart")} Lista de la compra</h2>
        <div class="recetas-incluidas">
          <strong>Recetas seleccionadas (${recetasSel.length}):</strong>
          <ul>${incluidas}</ul>
        </div>
        ${acciones}
        <ul class="lista-compra">${itemsHtml}</ul>
        ${sinHtml}
        ${extras.length ? `<p class="subtitulo-sin">Añadidos a mano:</p>` : ""}
        ${extrasHtml}
        <form class="form-extra" id="form-extra" autocomplete="off">
          <input type="text" id="extra-cant" class="extra-cant" placeholder="Cant." aria-label="Cantidad">
          <input type="text" id="extra-nombre" class="extra-nombre" placeholder="Añadir ingrediente…" aria-label="Ingrediente" required>
          <button type="submit" class="btn-secundario btn-ico">${ico("plus")} Añadir</button>
        </form>
        ${acciones}
      </div>`;
    vistaCompra.querySelector(".volver").onclick = verSeleccion;
    const accion = {
      pdf: () => window.print(),
      whatsapp: () => compartirWhatsApp(recetasSel, lista, sinCantidad),
      copiar: () => copiarLista(recetasSel, lista, sinCantidad),
    };
    vistaCompra.querySelectorAll("[data-accion]").forEach((b) => {
      b.onclick = accion[b.dataset.accion];
    });
    vistaCompra.querySelectorAll("[data-extra]").forEach((b) => {
      b.onclick = () => { extras.splice(+b.dataset.extra, 1); guardarExtras(); verListaCompra(); };
    });
    vistaCompra.querySelectorAll("[data-quitar]").forEach((b) => {
      b.onclick = () => { excluidos.add(b.dataset.quitar); verListaCompra(); };
    });
    vistaCompra.querySelector("#form-extra").onsubmit = (ev) => {
      ev.preventDefault();
      const nombre = vistaCompra.querySelector("#extra-nombre").value.trim();
      const cantidad = vistaCompra.querySelector("#extra-cant").value.trim();
      if (!nombre) return;
      extras.push({ nombre, cantidad });
      guardarExtras();
      verListaCompra();
    };
    registrarVista("compra");
    cambiarVista(vistaCompra);
  }

  // Texto de la lista en texto plano (compartido por "copiar" y "WhatsApp").
  function textoLista(recetas, lista, sinCantidad) {
    let txt = "🛒 *LISTA DE LA COMPRA*\n\n";
    txt += "📋 Recetas:\n";
    txt += recetas.map((r) => `• ${r.nombre}`).join("\n");
    txt += "\n\n🥕 Ingredientes:\n";
    txt += lista.map((i) =>
      `• ${formatoCantidad(i.cantidad)} ${i.unidad} ${i.nombre}`.replace(/\s+/g, " ").trim()
    ).join("\n");
    if (sinCantidad.length) {
      txt += "\n\n➕ Otros:\n" + sinCantidad.map((i) => `• ${i.nombre}`).join("\n");
    }
    if (extras.length) {
      txt += "\n\n✍️ Añadidos a mano:\n" + extras.map((e) =>
        `• ${(e.cantidad ? e.cantidad + " " : "") + e.nombre}`.trim()).join("\n");
    }
    return txt;
  }

  function copiarLista(recetas, lista, sinCantidad) {
    const txt = textoLista(recetas, lista, sinCantidad);
    navigator.clipboard?.writeText(txt).then(
      () => alert("Lista copiada al portapapeles."),
      () => alert("No se pudo copiar.")
    );
  }

  function compartirWhatsApp(recetas, lista, sinCantidad) {
    const txt = textoLista(recetas, lista, sinCantidad);
    // wa.me abre WhatsApp (móvil) o WhatsApp Web (escritorio) con el texto.
    window.open("https://wa.me/?text=" + encodeURIComponent(txt), "_blank", "noopener");
  }

  // --- Exportar el menú semanal (texto / WhatsApp / copiar) ---
  function textoMenu() {
    let txt = "🗓️ *MENÚ SEMANAL*\n";
    DIAS.forEach((dia) => {
      if (!diaTienePlatos(dia)) return;
      txt += `\n*${DIAS_NOMBRE[dia]}*\n`;
      COMIDAS.forEach((comida) => {
        const platos = (menuSemanal[dia][comida] || [])
          .map((id) => porId[id] && porId[id].nombre).filter(Boolean);
        if (platos.length) txt += `• ${COMIDAS_NOMBRE[comida]}: ${platos.join(", ")}\n`;
      });
    });
    return txt.trim();
  }
  function copiarMenu() {
    if (!idsEnMenu().length) { alert("El menú está vacío."); return; }
    navigator.clipboard?.writeText(textoMenu()).then(
      () => alert("Menú copiado al portapapeles."),
      () => alert("No se pudo copiar.")
    );
  }
  function compartirMenuWhatsApp() {
    if (!idsEnMenu().length) { alert("El menú está vacío."); return; }
    window.open("https://wa.me/?text=" + encodeURIComponent(textoMenu()), "_blank", "noopener");
  }

  // --- Navegación entre vistas ---
  function cambiarVista(activa) {
    [vistaListado, vistaDetalle, vistaEdicion, vistaSeleccion, vistaCompra, vistaAyuda, vistaGuia, vistaMenu]
      .forEach((v) => (v.hidden = v !== activa));
    // El buscador y el filtro solo tienen función en el listado.
    zonaBuscador.hidden = activa !== vistaListado;
    window.scrollTo(0, 0);
  }
  function mostrarListado() {
    renderListado();
    registrarVista("listado");
    cambiarVista(vistaListado);
  }

  // --- Vista: ayuda (cómo instalar la app en el móvil como PWA) ---
  function verAyuda() {
    const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const instalada = window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;

    const bloqueAndroid = `
      <div class="ayuda-paso" data-plataforma="android">
        <h3 class="titulo-ico">${ico("smartphone")} En Android (Chrome)</h3>
        <ol>
          <li>Abre esta página en <strong>Chrome</strong>.</li>
          <li>Toca el menú <strong>⋮</strong> (arriba a la derecha).</li>
          <li>Pulsa <strong>«Instalar aplicación»</strong> (o «Añadir a pantalla de inicio»).</li>
          <li>Confirma con <strong>«Instalar»</strong>. El icono 🥗 aparecerá en tu pantalla de inicio.</li>
        </ol>
      </div>`;

    const bloqueIOS = `
      <div class="ayuda-paso" data-plataforma="ios">
        <h3 class="titulo-ico">${ico("apple")} En iPhone / iPad (Safari)</h3>
        <ol>
          <li>Abre esta página en <strong>Safari</strong> (no funciona desde Chrome en iPhone).</li>
          <li>Toca el botón <strong>Compartir</strong> <span class="ayuda-icono">${ico("share")}</span> (el cuadrado con la flecha hacia arriba).</li>
          <li>Desliza y pulsa <strong>«Añadir a pantalla de inicio»</strong>.</li>
          <li>Pulsa <strong>«Añadir»</strong> arriba a la derecha. El icono 🥗 aparecerá en tu pantalla de inicio.</li>
        </ol>
      </div>`;

    // Muestra primero la plataforma detectada; debajo, la otra.
    const bloques = esIOS ? bloqueIOS + bloqueAndroid : bloqueAndroid + bloqueIOS;

    const aviso = instalada
      ? `<p class="ayuda-ok">${ico("check")} ¡Ya tienes la app instalada! Puedes usarla desde su icono, incluso sin conexión.</p>`
      : "";

    vistaAyuda.innerHTML = `
      <div class="ayuda">
        <button class="volver" id="ayuda-volver">← Volver</button>
        <h2 class="titulo-ico">${ico("download")} Instalar la app en tu móvil</h2>
        <p>Instálalo como una <strong>app</strong>: tendrás un icono en la pantalla de inicio,
           se abre a pantalla completa y funciona <strong>sin conexión a internet</strong>.</p>
        ${aviso}
        ${bloques}
        <p class="ayuda-nota">Una vez instalada, las recetas y sus fotos quedan guardadas en el
           móvil para consultarlas aunque no tengas datos ni WiFi.</p>
      </div>`;

    vistaAyuda.querySelector("#ayuda-volver").onclick = () => history.back();
    registrarVista("ayuda");
    cambiarVista(vistaAyuda);
  }

  // --- Vista: guía de uso de la app ---
  function verGuia() {
    vistaGuia.innerHTML = `
      <div class="guia">
        <button class="volver" id="guia-volver">← Volver</button>
        <h2 class="titulo-ico">${ico("help")} Cómo usar la app</h2>

        <p class="guia-intro"><strong>Recetas a la Compra</strong> reúne recetas
          antiinflamatorias y, sobre todo, te ayuda a <strong>generar la lista de la compra</strong>:
          seleccionas las recetas que vas a cocinar y la app crea una lista unificada (suma
          cantidades y omite los básicos de despensa) que puedes <strong>compartir o imprimir</strong>.
          Además puedes <strong>buscar y filtrar</strong> recetas, <strong>añadir las tuyas</strong>
          con foto, e <strong>instalar la app</strong> en el móvil para usarla sin conexión.</p>

        <section class="guia-seccion">
          <h3 class="titulo-ico">${ico("home")} Buscar y filtrar recetas</h3>
          <ul>
            <li>Escribe en el <strong>buscador</strong> por nombre o por ingredientes. Puedes poner
              <strong>varios ingredientes separados por espacios</strong> (p. ej. «salmón aguacate»)
              y verás solo las recetas que tengan <strong>todos</strong>. No hace falta poner tildes.</li>
            <li>Usa los <strong>tres selectores de categoría</strong> para afinar: se combinan entre sí
              (la receta debe tener todas las elegidas) y se encadenan (el segundo solo ofrece
              categorías compatibles con el primero).</li>
          </ul>
          <img class="guia-img" loading="lazy" src="img/ayuda/buscar.jpg"
               alt="Buscador e selectores de categoría">
        </section>

        <section class="guia-seccion">
          <h3 class="titulo-ico">${ico("cart")} Lista de la compra</h3>
          <ul>
            <li>Marca la <strong>casilla</strong> de las recetas que quieras cocinar; abajo aparece una
              barra con el total seleccionado.</li>
            <li>Pulsa <strong>«Generar lista»</strong>: los ingredientes se <strong>unifican</strong>
              (se suman cantidades) y se omiten los básicos de despensa y el agua.</li>
            <li>Puedes <strong>quitar</strong> ingredientes con la ✕, <strong>añadir</strong> los tuyos a
              mano, y <strong>compartir</strong> la lista por WhatsApp, copiarla o exportarla a PDF.</li>
          </ul>
          <img class="guia-img" loading="lazy" src="img/ayuda/compra.jpg"
               alt="Vista de la lista de la compra">
        </section>

        <section class="guia-seccion">
          <h3 class="titulo-ico">${ico("plus")} Añadir y editar recetas</h3>
          <ul>
            <li>Desde el menú <strong>☰ → «Nueva receta»</strong> puedes crear una receta con nombre,
              <strong>foto</strong> (en el móvil se abre la cámara), categorías, ingredientes (con
              autocompletado) y preparación.</li>
            <li>En cualquier receta, el botón <strong>«Editar»</strong> permite modificarla.</li>
            <li class="guia-nota">En el móvil, las recetas que añadas se guardan <strong>en ese
              dispositivo</strong>. Para incorporarlas al recetario común hay que añadirlas desde el
              ordenador.</li>
          </ul>
          <img class="guia-img" loading="lazy" src="img/ayuda/nueva.jpg"
               alt="Formulario de nueva receta">
        </section>

        <section class="guia-seccion">
          <h3 class="titulo-ico">${ico("calendario")} Menú semanal</h3>
          <ul>
            <li>Desde el menú <strong>☰ → «Menú semanal»</strong> tienes una rejilla de lunes a domingo
              con desayuno, almuerzo, merienda y cena. Pulsa <strong>«+ Añadir»</strong> en cualquier
              comida para elegir una receta (puedes dejar comidas en blanco). El <strong>almuerzo y la
              cena admiten hasta 3 platos</strong>; el desayuno y la merienda, uno.</li>
            <li>El selector de receta muestra <strong>primero las de esa comida</strong> (en el
              almuerzo, primero los almuerzos…) y puedes <strong>buscar por nombre, categoría o
              ingrediente</strong>.</li>
            <li>También puedes añadir una receta al menú <strong>desde su ficha</strong> o desde el
              <strong>botón «Añadir al menú»</strong> de cada tarjeta del listado.</li>
            <li>Las recetas del menú se <strong>añaden automáticamente a la lista de la compra</strong>.
              Si quitas una receta del menú (con la ✕) y solo estaba ahí, también se quita de la lista
              (si la habías marcado tú a mano, se conserva). Puedes <strong>vaciar un día</strong> con
              el icono de papelera de su cabecera, o todo el menú con «Vaciar menú».</li>
            <li>Puedes <strong>exportar el menú</strong> a PDF (apaisado, en una hoja), compartirlo por
              <strong>WhatsApp</strong> o copiarlo al portapapeles.</li>
          </ul>
          <img class="guia-img" loading="lazy" src="img/ayuda/menu.jpg"
               alt="Vista del menú semanal">
        </section>

        <section class="guia-seccion">
          <h3 class="titulo-ico">${ico("sol")} Tema claro u oscuro</h3>
          <ul>
            <li>El botón <strong>☀️/🌙</strong> de la cabecera cambia el tema: <strong>Automático</strong>
              (sigue el ajuste de tu móvil) → <strong>Claro</strong> → <strong>Oscuro</strong>. Tu
              elección se recuerda.</li>
          </ul>
        </section>

        <section class="guia-seccion">
          <h3 class="titulo-ico">${ico("download")} Instalar como app</h3>
          <p>Puedes instalar «Recetas a la Compra» en tu móvil para tenerlo como una app y usarlo
            <strong>sin conexión</strong>. Encontrarás las instrucciones paso a paso en el menú
            <strong>☰ → «Instalar como app»</strong>.</p>
          <button class="btn-secundario btn-ico" id="guia-a-instalar">${ico("download")} Ver cómo instalar</button>
        </section>
      </div>`;

    vistaGuia.querySelector("#guia-volver").onclick = () => history.back();
    vistaGuia.querySelector("#guia-a-instalar").onclick = verAyuda;
    registrarVista("guia");
    cambiarVista(vistaGuia);
  }

  // --- Vista: menú semanal ---
  // HTML de una celda (día × comida): lista de platos (cada uno con ✕) y, si caben
  // más (almuerzo/cena admiten hasta 3), un botón "+ Añadir".
  function celdaMenuHtml(dia, comida) {
    const platos = (menuSemanal[dia] && menuSemanal[dia][comida]) || [];
    const filas = platos.map((id, n) => {
      const r = porId[id];
      const nombre = r ? r.nombre : "(receta no encontrada)";
      return `<div class="celda-plato">
                <button class="celda-receta" data-id="${escapar(id)}">
                  ${r ? mediaHtml(r, "celda-img", "celda-img celda-ph") : ""}
                  <span class="celda-nombre">${escapar(nombre)}</span>
                </button>
                <button class="celda-quitar" data-dia="${dia}" data-comida="${comida}" data-plato="${n}" aria-label="Quitar del menú">${ico("x")}</button>
              </div>`;
    }).join("");
    const puedeMas = platos.length < MAX_PLATOS[comida];
    const botonAnadir = puedeMas
      ? `<button class="celda-anadir" data-dia="${dia}" data-comida="${comida}">
           ${ico("plus")}<span>${platos.length ? "Añadir plato" : "Añadir"}</span>
         </button>`
      : "";
    return `<div class="celda-menu ${platos.length ? "llena" : "vacia"}">${filas}${botonAnadir}</div>`;
  }

  // ¿el día tiene algún plato en alguna comida?
  function diaTienePlatos(dia) {
    return COMIDAS.some((c) => (menuSemanal[dia][c] || []).length);
  }

  function verMenuSemanal() {
    const dias = DIAS.map((dia) => `
      <section class="dia-menu">
        <div class="dia-titulo">
          <h3>${DIAS_NOMBRE[dia]}</h3>
          ${diaTienePlatos(dia)
            ? `<button class="dia-vaciar" data-dia="${dia}" aria-label="Vaciar ${DIAS_NOMBRE[dia]}" title="Vaciar este día">${ico("trash")}</button>`
            : ""}
        </div>
        <div class="comidas">
          ${COMIDAS.map((comida) => `
            <div class="comida" data-comida="${comida}">
              <span class="comida-etiqueta">${COMIDAS_NOMBRE[comida]}</span>
              ${celdaMenuHtml(dia, comida)}
            </div>`).join("")}
        </div>
      </section>`).join("");

    vistaMenu.innerHTML = `
      <div class="menu-semanal">
        <div class="menu-cabecera">
          <h2 class="titulo-ico">${ico("calendario")} Menú semanal</h2>
          <button class="btn-secundario" id="menu-vaciar">Vaciar menú</button>
        </div>
        <p class="menu-ayuda">Coloca recetas en cada comida. Se añaden automáticamente a la lista de la compra.</p>
        <div class="acciones-compra" id="menu-acciones">
          <button class="btn-primario btn-ico" data-accion="pdf">${ico("printer")} Exportar a PDF</button>
          <button class="btn-whatsapp" data-accion="whatsapp">${ICONO_WHATSAPP} WhatsApp</button>
          <button class="btn-secundario btn-ico" data-accion="copiar">${ico("copy")} Copiar menú</button>
        </div>
        <div class="semana">${dias}</div>
      </div>`;

    // Delegación de eventos en la rejilla.
    vistaMenu.querySelector(".semana").addEventListener("click", (e) => {
      const anadir = e.target.closest(".celda-anadir");
      const quitar = e.target.closest(".celda-quitar");
      const receta = e.target.closest(".celda-receta");
      const vaciarD = e.target.closest(".dia-vaciar");
      if (vaciarD) {
        vaciarDia(vaciarD.dataset.dia);
      } else if (anadir) {
        elegirRecetaParaCelda(anadir.dataset.dia, anadir.dataset.comida);
      } else if (quitar) {
        quitarDeMenu(quitar.dataset.dia, quitar.dataset.comida, +quitar.dataset.plato);
      } else if (receta) {
        verDetalle(receta.dataset.id);
      }
    });
    vistaMenu.querySelector("#menu-vaciar").onclick = vaciarMenu;
    const accionMenu = {
      pdf: () => { document.body.classList.add("print-menu"); window.print(); },
      whatsapp: compartirMenuWhatsApp,
      copiar: copiarMenu,
    };
    vistaMenu.querySelectorAll("#menu-acciones [data-accion]").forEach((b) => {
      b.onclick = accionMenu[b.dataset.accion];
    });

    registrarVista("menu");
    cambiarVista(vistaMenu);
  }

  // Añade un plato a una celda (sin pasarse del máximo) y lo vuelca a la selección.
  function asignarAMenu(dia, comida, id) {
    const platos = menuSemanal[dia][comida];
    if (platos.length >= MAX_PLATOS[comida]) {
      alert(`Esta comida admite como máximo ${MAX_PLATOS[comida]} plato${MAX_PLATOS[comida] > 1 ? "s" : ""}.`);
      return false;
    }
    platos.push(id);
    guardarMenu(menuSemanal);
    // Marca el id como "venido del menú" salvo que ya estuviera seleccionado a mano.
    if (!seleccion.has(id)) seleccionMenu.add(id);
    guardarSeleccionMenu();
    seleccion.add(id);
    guardarSeleccion();
    actualizarBarra();
    return true;
  }

  // Quita un plato. Si esa receta ya no queda en ninguna celda y SOLO estaba en la
  // cesta por el menú (no la seleccionó el usuario a mano), también se quita de la cesta.
  function quitarDeMenu(dia, comida, indice) {
    const id = menuSemanal[dia][comida][indice];
    menuSemanal[dia][comida].splice(indice, 1);
    guardarMenu(menuSemanal);
    // Si la receta ya no está en ninguna celda y estaba en la cesta SOLO por el menú
    // (no la añadió el usuario a mano), se quita también de la cesta.
    if (id && !idsEnMenu().includes(id) && seleccionMenu.has(id)) {
      seleccionMenu.delete(id);
      guardarSeleccionMenu();
      seleccion.delete(id);
      guardarSeleccion();
      actualizarBarra();
    }
    if (!vistaMenu.hidden) verMenuSemanal();
  }

  function vaciarMenu() {
    const ids = idsEnMenu();
    if (!ids.length) { alert("El menú ya está vacío."); return; }
    if (!confirm("¿Vaciar todo el menú semanal?")) return;
    DIAS.forEach((d) => COMIDAS.forEach((c) => (menuSemanal[d][c] = [])));
    guardarMenu(menuSemanal);
    if (confirm("¿Quitar también esas recetas de la lista de la compra?")) {
      ids.forEach((id) => seleccion.delete(id));
      guardarSeleccion();
      actualizarBarra();
    }
    ids.forEach((id) => seleccionMenu.delete(id));
    guardarSeleccionMenu();
    if (!vistaMenu.hidden) verMenuSemanal();
  }

  // Vacía todas las comidas de un día. Las recetas que dejan de estar en el menú y
  // que solo estaban en la cesta por el menú se quitan también de la cesta (L189).
  function vaciarDia(dia) {
    if (!diaTienePlatos(dia)) return;
    if (!confirm(`¿Vaciar el ${DIAS_NOMBRE[dia]}?`)) return;
    const antes = idsEnMenu();
    COMIDAS.forEach((c) => (menuSemanal[dia][c] = []));
    guardarMenu(menuSemanal);
    const quedan = new Set(idsEnMenu());
    let cambió = false;
    antes.forEach((id) => {
      if (!quedan.has(id) && seleccionMenu.has(id)) {   // ya no en menú y vino del menú
        seleccionMenu.delete(id);
        if (seleccion.has(id)) { seleccion.delete(id); cambió = true; }
      }
    });
    guardarSeleccionMenu();
    if (cambió) { guardarSeleccion(); actualizarBarra(); }
    if (!vistaMenu.hidden) verMenuSemanal();
  }

  // Ids únicos presentes en el menú (una receta puede estar en varias celdas/platos).
  function idsEnMenu() {
    const set = new Set();
    DIAS.forEach((d) => COMIDAS.forEach((c) => {
      (menuSemanal[d][c] || []).forEach((id) => { if (id) set.add(id); });
    }));
    return [...set];
  }

  // Asegura que toda receta del menú esté en la selección (la cesta cuenta 1 vez
  // por receta aunque esté en varias celdas). No quita nada de la selección.
  // Los ids que añade (no estaban ya seleccionados a mano) se marcan como "de menú".
  function volcarMenuASeleccion() {
    const ids = idsEnMenu().filter((id) => porId[id]);   // ignora ids ya inexistentes
    let cambió = false;
    ids.forEach((id) => {
      if (!seleccion.has(id)) { seleccion.add(id); seleccionMenu.add(id); cambió = true; }
    });
    if (cambió) { guardarSeleccion(); guardarSeleccionMenu(); actualizarBarra(); }
  }

  // --- Modal reutilizable ---
  const modal = $("#modal");
  function abrirModal(html) {
    modal.innerHTML = `<div class="modal-caja" role="dialog" aria-modal="true">${html}</div>`;
    modal.hidden = false;
    document.body.classList.add("modal-abierto");
  }
  function cerrarModal() {
    modal.hidden = true;
    modal.innerHTML = "";
    document.body.classList.remove("modal-abierto");
  }
  modal.addEventListener("click", (e) => { if (e.target === modal) cerrarModal(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) cerrarModal();
  });

  // Selector de receta para una celda del menú: buscador + lista filtrable.
  function elegirRecetaParaCelda(dia, comida) {
    const titulo = `${DIAS_NOMBRE[dia]} · ${COMIDAS_NOMBRE[comida]}`;
    abrirModal(`
      <div class="modal-cab">
        <h3>Elegir receta<br><small>${escapar(titulo)}</small></h3>
        <button class="modal-cerrar" aria-label="Cerrar">${ico("x")}</button>
      </div>
      <input type="search" id="modal-buscar" class="modal-buscar" placeholder="Buscar por nombre, categoría o ingrediente…" autocomplete="off">
      <ul class="modal-lista" id="modal-lista"></ul>`);

    const input = modal.querySelector("#modal-buscar");
    const lista = modal.querySelector("#modal-lista");
    // Categoría asociada a la comida (Desayuno/Almuerzo/Merienda/Cena) para priorizar.
    const catComida = COMIDAS_NOMBRE[comida];
    const esDeComida = (r) => (r.categoria || []).includes(catComida);
    function pintar(filtro) {
      const q = normalizarBusqueda(filtro);
      const recetas = RECETAS
        // Busca por nombre, categoría (L191) o ingrediente (L207).
        .filter((r) => !q
          || normalizarBusqueda(r.nombre).includes(q)
          || (r.categoria || []).some((c) => normalizarBusqueda(c).includes(q))
          || (r.ingredientes || []).some((i) => normalizarBusqueda(i.nombre).includes(q)))
        // Primero las de la categoría de la comida; dentro, orden alfabético (L190).
        .sort((a, b) => {
          const da = esDeComida(a), db = esDeComida(b);
          if (da !== db) return da ? -1 : 1;
          return a.nombre.localeCompare(b.nombre, "es");
        })
        .slice(0, 60);
      lista.innerHTML = recetas.map((r) => `
        <li><button class="modal-item" data-id="${escapar(r.id)}">
          ${mediaHtml(r, "modal-item-img", "modal-item-img modal-item-ph")}
          <span class="modal-item-nombre">${escapar(r.nombre)}</span>
          ${esDeComida(r) ? `<span class="modal-item-tag">${escapar(catComida)}</span>` : ""}
        </button></li>`).join("")
        || `<li class="modal-vacio">Sin resultados</li>`;
    }
    pintar("");
    input.addEventListener("input", () => pintar(input.value));
    modal.querySelector(".modal-cerrar").onclick = cerrarModal;
    lista.addEventListener("click", (e) => {
      const item = e.target.closest(".modal-item");
      if (!item) return;
      asignarAMenu(dia, comida, item.dataset.id);
      cerrarModal();
      verMenuSemanal();
    });
    input.focus();
  }

  // Selector de día + comida para asignar una receta concreta al menú (desde el detalle).
  function elegirDiaComidaParaReceta(id) {
    const r = porId[id];
    if (!r) return;
    const opcDia = DIAS.map((d) => `<option value="${d}">${DIAS_NOMBRE[d]}</option>`).join("");
    const opcCom = COMIDAS.map((c) => `<option value="${c}">${COMIDAS_NOMBRE[c]}</option>`).join("");
    abrirModal(`
      <div class="modal-cab">
        <h3>Añadir al menú<br><small>${escapar(r.nombre)}</small></h3>
        <button class="modal-cerrar" aria-label="Cerrar">${ico("x")}</button>
      </div>
      <div class="modal-campos">
        <label>Día<select id="md-dia">${opcDia}</select></label>
        <label>Comida<select id="md-comida">${opcCom}</select></label>
      </div>
      <button class="btn-primario" id="md-aceptar">Añadir</button>`);
    modal.querySelector(".modal-cerrar").onclick = cerrarModal;
    modal.querySelector("#md-aceptar").onclick = () => {
      const dia = modal.querySelector("#md-dia").value;
      const comida = modal.querySelector("#md-comida").value;
      if (asignarAMenu(dia, comida, id)) cerrarModal();   // si la comida está llena, sigue abierto
    };
  }

  // --- Historial del navegador (botón Atrás navega entre vistas) ---
  // Estado actual: {vista, id}. Se sincroniza con history para que "Atrás"
  // vuelva a la vista anterior de la app en lugar de salir de ella.
  let restaurando = false;   // evita re-pushear durante popstate

  // Reconstruye una vista a partir de su estado guardado, sin tocar el historial.
  function restaurarVista(estado) {
    restaurando = true;
    try {
      switch (estado && estado.vista) {
        case "detalle": verDetalle(estado.id); break;
        case "edicion": editarReceta(estado.id); break;
        case "seleccion": verSeleccion(); break;
        case "compra": verListaCompra(); break;
        case "ayuda": verAyuda(); break;
        case "guia": verGuia(); break;
        case "menu": verMenuSemanal(); break;
        default: mostrarListado();
      }
    } finally {
      restaurando = false;
    }
  }

  // Registra un cambio de vista en el historial (salvo si venimos de popstate).
  function registrarVista(vista, id) {
    if (restaurando) return;
    const estado = { vista, id: id || null };
    // El listado es el estado base (replace); el resto se apila (push).
    if (vista === "listado") history.replaceState(estado, "");
    else history.pushState(estado, "");
  }

  window.addEventListener("popstate", (e) => {
    restaurarVista(e.state || { vista: "listado" });
  });

  // --- Eventos globales ---
  // Al terminar de imprimir, quita la marca de "imprimir solo el menú".
  window.addEventListener("afterprint", () => document.body.classList.remove("print-menu"));

  inputBuscar.addEventListener("input", renderListado);
  selectsCat.forEach((s) => s.addEventListener("change", () => {
    actualizarSelectoresCategoria();  // repuebla los dependientes (encadenado)
    renderListado();
  }));
  $("#ir-inicio").addEventListener("click", mostrarListado);
  $("#ver-lista").addEventListener("click", verListaCompra);

  // Inyecta los iconos SVG en los elementos del HTML estático con [data-ico].
  // data-ico-side="end" pone el icono después del texto (por defecto, antes).
  function pintarIconos() {
    document.querySelectorAll("[data-ico]").forEach((el) => {
      if (el.querySelector(".ico, .icono-wa")) return;   // ya pintado
      const svg = ico(el.dataset.ico);
      el.insertAdjacentHTML(el.dataset.icoSide === "end" ? "beforeend" : "afterbegin", svg);
    });
  }
  pintarIconos();

  // --- Tema claro/oscuro (auto → claro → oscuro) ---
  const TEMAS = ["auto", "claro", "oscuro"];
  const TEMA_ICONO = { auto: "auto", claro: "sol", oscuro: "luna" };
  const TEMA_NOMBRE = { auto: "Tema: automático", claro: "Tema: claro", oscuro: "Tema: oscuro" };
  const btnTema = $("#btn-tema");

  function aplicarTema(tema) {
    // "auto" no pone atributo: dejamos que mande prefers-color-scheme del CSS.
    if (tema === "auto") document.documentElement.removeAttribute("data-tema");
    else document.documentElement.setAttribute("data-tema", tema);
    btnTema.innerHTML = ico(TEMA_ICONO[tema]);
    btnTema.title = TEMA_NOMBRE[tema];
    btnTema.setAttribute("aria-label", TEMA_NOMBRE[tema]);
  }
  function cargarTema() {
    const t = localStorage.getItem(LS_TEMA);
    return TEMAS.includes(t) ? t : "auto";
  }
  let temaActual = cargarTema();
  aplicarTema(temaActual);
  btnTema.addEventListener("click", () => {
    temaActual = TEMAS[(TEMAS.indexOf(temaActual) + 1) % TEMAS.length];
    localStorage.setItem(LS_TEMA, temaActual);
    aplicarTema(temaActual);
  });

  // --- Menú hamburguesa (navegación global en móvil/escritorio) ---
  const btnMenu = $("#abrir-menu");
  const menu = $("#menu");
  function cerrarMenu() {
    menu.hidden = true;
    btnMenu.setAttribute("aria-expanded", "false");
  }
  function alternarMenu() {
    const abrir = menu.hidden;
    menu.hidden = !abrir;
    btnMenu.setAttribute("aria-expanded", String(abrir));
  }
  btnMenu.addEventListener("click", (e) => { e.stopPropagation(); alternarMenu(); });
  menu.addEventListener("click", (e) => {
    const item = e.target.closest("[data-menu]");
    if (!item) return;
    cerrarMenu();
    switch (item.dataset.menu) {
      case "inicio": mostrarListado(); break;
      case "nueva": editarReceta(null); break;   // alta de receta nueva
      case "seleccion": verSeleccion(); break;   // vacía → vuelve al listado
      case "compra":
        // Si no hay recetas seleccionadas, no hay lista que mostrar: ve a la selección.
        if (seleccion.size) verListaCompra(); else verSeleccion();
        break;
      case "vaciar":
        if (!seleccion.size) { alert("No hay recetas seleccionadas."); break; }
        if (confirm("¿Vaciar la selección de recetas?")) vaciarSeleccion();
        break;
      case "menu": verMenuSemanal(); break;
      case "guia": verGuia(); break;
      case "instalar": verAyuda(); break;
    }
  });
  // Cerrar al hacer clic fuera o con Escape.
  document.addEventListener("click", (e) => {
    if (!menu.hidden && !menu.contains(e.target) && e.target !== btnMenu) cerrarMenu();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarMenu(); });
  resumenSel.addEventListener("click", verSeleccion);
  $("#vaciar-seleccion").addEventListener("click", vaciarSeleccion);

  init();
})();
