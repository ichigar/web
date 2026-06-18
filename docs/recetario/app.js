/* ===== «Recetas a la Compra» — orquestador principal (ES Module) ===== */
import {
  S, LS_KEY, LS_EXTRAS, LS_EDICIONES, LS_TEMA, LS_MENU, LS_SEL_MENU,
  DIAS, COMIDAS, MAX_PLATOS, DIAS_NOMBRE, COMIDAS_NOMBRE,
} from "./js/estado.js";
import {
  ICON_PATHS, ico, ICONO_WHATSAPP, emojiReceta, placeholderHtml, mediaHtml, activarMedia,
} from "./js/iconos.js";
import {
  formatoCantidad, tiempoTexto, escapar, normalizarBusqueda, categoriasDe,
} from "./js/formato.js";
import {
  esDespensa, esUnidadSimbolica, nombreCompra,
} from "./js/compra-utils.js";
import {
  cargarSeleccion, guardarSeleccion, cargarSeleccionMenu, guardarSeleccionMenu,
  cargarExtras, guardarExtras, cargarEdiciones, guardarEdiciones,
  cargarMenu, guardarMenu, aplicarEdiciones,
} from "./js/persistencia.js";


  // El estado vive en S (estado.js). Se inicializa desde localStorage.
  S.seleccion = new Set(cargarSeleccion());
  S.seleccionMenu = new Set(cargarSeleccionMenu());   // ids que entraron por el menú
  S.extras = cargarExtras();   // ingredientes añadidos a mano [{nombre, cantidad}]
  S.menuSemanal = cargarMenu();   // menú semanal { dia: { comida: [idReceta] } }
  // S.RECETAS, S.porId, S.excluidos ya tienen valor inicial en estado.js.

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






  // --- Inicio / carga de datos ---
  async function init() {
    try {
      const resp = await fetch("recetas.json", { cache: "no-cache" });
      S.RECETAS = await resp.json();
    } catch (e) {
      grid.innerHTML = `<p class="aviso">No se pudo cargar recetas.json.<br>Sirve la web con un servidor (no abras el archivo directamente).</p>`;
      return;
    }
    // Superpone las ediciones guardadas en este dispositivo (móvil/PWA offline).
    S.RECETAS = aplicarEdiciones(S.RECETAS, cargarEdiciones());
    S.RECETAS.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    S.porId = Object.fromEntries(S.RECETAS.map((r) => [r.id, r]));
    volcarMenuASeleccion();   // las recetas del menú semanal alimentan la cesta
    actualizarSelectoresCategoria();
    renderListado();
    actualizarBarra();
    history.replaceState({ vista: "listado", id: null }, "");  // estado base
  }


  // Nombres de ingredientes ya usados en el catálogo, limpios (sin cantidades ni
  // medidas pegadas), únicos y ordenados. Para autocompletar (datalist) al
  // añadir/editar una receta. Reutiliza nombreCompra() (hoisted).
  function nombresIngredientes() {
    const set = new Set();
    S.RECETAS.forEach((r) => (r.ingredientes || []).forEach((i) => {
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
      const base = S.RECETAS.filter((r) =>
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


  // --- Vista: listado ---
  function recetasFiltradas() {
    // Cada término separado por espacios debe aparecer (AND): "salmon aguacate"
    // encuentra recetas que contengan ambos, no la frase literal.
    const terminos = normalizarBusqueda(inputBuscar.value.trim()).split(/\s+/).filter(Boolean);
    // Categorías seleccionadas (hasta 3) — la receta debe tenerlas TODAS (AND).
    const cats = selectsCat.map((s) => s.value).filter(Boolean);
    return S.RECETAS.filter((r) => {
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
    const checked = S.seleccion.has(r.id) ? "checked" : "";
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
    if (on) S.seleccion.add(id); else S.seleccion.delete(id);
    // Tocar la cesta a mano "desvincula" el id del menú: ya no se auto-quitará al
    // quitarlo del menú (lo gestiona el usuario), ni se reañadirá solo.
    S.seleccionMenu.delete(id);
    guardarSeleccionMenu(S.seleccionMenu);
    S.excluidos.clear();   // cambiar la selección reinicia los ingredientes quitados
    guardarSeleccion(S.seleccion);
    actualizarBarra();
    // sincroniza checkboxes con el mismo id en otras vistas
    document.querySelectorAll(`input[data-id="${CSS.escape(id)}"]`)
      .forEach((c) => (c.checked = on));
  }

  function actualizarBarra() {
    const n = S.seleccion.size;
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
    const recetasSel = [...S.seleccion].map((id) => S.porId[id]).filter(Boolean);
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
    S.seleccion.clear();
    S.seleccionMenu.clear();
    S.excluidos.clear();
    guardarSeleccion(S.seleccion);
    guardarSeleccionMenu(S.seleccionMenu);
    document.querySelectorAll('input[type="checkbox"][data-id]').forEach((c) => (c.checked = false));
    actualizarBarra();
    mostrarListado();
  }

  // --- Vista: detalle ---
  function verDetalle(id) {
    const r = S.porId[id];
    if (!r) return;
    const checked = S.seleccion.has(id) ? "checked" : "";
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
    while (S.porId[id]) id = `${base}-${n++}`;   // evita colisiones
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
    const r = nueva ? null : S.porId[id];
    if (!nueva && !r) return;
    // Estado de trabajo (copias para no mutar hasta guardar).
    let cats = nueva ? [] : [...(r.categoria || [])];
    let ings = nueva ? [{ cantidad: null, unidad: null, nombre: "", nota: null, texto: "" }]
                     : (r.ingredientes || []).map((i) => ({ ...i }));
    let nombre = nueva ? "" : (r.nombre || "");
    let pasosTexto = nueva ? "" : (r.pasos || []).join("\n");
    let imagen = nueva ? null : (r.imagen || null);   // ruta o data-URL base64
    const todasCats = categoriasDe(S.RECETAS);

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
        if (nueva) { S.RECETAS.push(destino); S.porId[destino.id] = destino; }

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
      const r = idEditado ? S.porId[idEditado] : null;
      if (r && typeof r.imagen === "string" && r.imagen.startsWith("data:")) {
        const ruta = await subirImagen(idEditado, r.imagen);
        if (ruta) r.imagen = ruta;   // si falla, se queda el base64 (también válido)
      }
      const resp = await fetch("/api/guardar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(S.RECETAS),
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
      ed[idEditado] = S.porId[idEditado];
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






  function generarListaCompra(ids) {
    const agregados = new Map();   // clave: nombreNorm|unidad  (con cantidad sumable)
    const soloNombre = new Map();  // clave: nombreNorm          (sin cantidad / simbólica)
    ids.forEach((id) => {
      const r = S.porId[id];
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
      .filter((x) => !S.excluidos.has(x.clave))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    const sinCantidad = [...soloNombre.values()]
      .filter((x) => !cuantificados.has(x.nombre.toLowerCase()))
      .filter((x) => !S.excluidos.has(x.nombre.toLowerCase()))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return { lista, sinCantidad };
  }

  function verListaCompra() {
    const ids = [...S.seleccion];
    if (!ids.length) return;
    const recetasSel = ids.map((id) => S.porId[id]).filter(Boolean);
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
    const extrasHtml = S.extras.length ? `
      <ul class="lista-compra">
        ${S.extras.map((e, n) => `
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
        ${S.extras.length ? `<p class="subtitulo-sin">Añadidos a mano:</p>` : ""}
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
      b.onclick = () => { S.extras.splice(+b.dataset.extra, 1); guardarExtras(S.extras); verListaCompra(); };
    });
    vistaCompra.querySelectorAll("[data-quitar]").forEach((b) => {
      b.onclick = () => { S.excluidos.add(b.dataset.quitar); verListaCompra(); };
    });
    vistaCompra.querySelector("#form-extra").onsubmit = (ev) => {
      ev.preventDefault();
      const nombre = vistaCompra.querySelector("#extra-nombre").value.trim();
      const cantidad = vistaCompra.querySelector("#extra-cant").value.trim();
      if (!nombre) return;
      S.extras.push({ nombre, cantidad });
      guardarExtras(S.extras);
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
    if (S.extras.length) {
      txt += "\n\n✍️ Añadidos a mano:\n" + S.extras.map((e) =>
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
        const platos = (S.menuSemanal[dia][comida] || [])
          .map((id) => S.porId[id] && S.porId[id].nombre).filter(Boolean);
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
  // Imprime el menú en horizontal. Inyecta un @page landscape ÚNICO durante la
  // impresión (evita la página en blanco que causa mezclar orientaciones de @page).
  function imprimirMenu() {
    if (!idsEnMenu().length) { alert("El menú está vacío."); return; }
    const st = document.createElement("style");
    st.id = "print-page-landscape";
    st.textContent = "@page { size: A4 landscape; margin: 8mm; }";
    document.head.appendChild(st);
    document.body.classList.add("print-menu");
    window.print();
    // afterprint quita la clase; aquí quitamos el estilo de página (con respaldo).
    setTimeout(() => st.remove(), 0);
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
    const platos = (S.menuSemanal[dia] && S.menuSemanal[dia][comida]) || [];
    const filas = platos.map((id, n) => {
      const r = S.porId[id];
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
    return COMIDAS.some((c) => (S.menuSemanal[dia][c] || []).length);
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
      pdf: imprimirMenu,
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
    const platos = S.menuSemanal[dia][comida];
    if (platos.length >= MAX_PLATOS[comida]) {
      alert(`Esta comida admite como máximo ${MAX_PLATOS[comida]} plato${MAX_PLATOS[comida] > 1 ? "s" : ""}.`);
      return false;
    }
    platos.push(id);
    guardarMenu(S.menuSemanal);
    // Marca el id como "venido del menú" salvo que ya estuviera seleccionado a mano.
    if (!S.seleccion.has(id)) S.seleccionMenu.add(id);
    guardarSeleccionMenu(S.seleccionMenu);
    S.seleccion.add(id);
    guardarSeleccion(S.seleccion);
    actualizarBarra();
    return true;
  }

  // Quita un plato. Si esa receta ya no queda en ninguna celda y SOLO estaba en la
  // cesta por el menú (no la seleccionó el usuario a mano), también se quita de la cesta.
  function quitarDeMenu(dia, comida, indice) {
    const id = S.menuSemanal[dia][comida][indice];
    S.menuSemanal[dia][comida].splice(indice, 1);
    guardarMenu(S.menuSemanal);
    // Si la receta ya no está en ninguna celda y estaba en la cesta SOLO por el menú
    // (no la añadió el usuario a mano), se quita también de la cesta.
    if (id && !idsEnMenu().includes(id) && S.seleccionMenu.has(id)) {
      S.seleccionMenu.delete(id);
      guardarSeleccionMenu(S.seleccionMenu);
      S.seleccion.delete(id);
      guardarSeleccion(S.seleccion);
      actualizarBarra();
    }
    if (!vistaMenu.hidden) verMenuSemanal();
  }

  function vaciarMenu() {
    const ids = idsEnMenu();
    if (!ids.length) { alert("El menú ya está vacío."); return; }
    if (!confirm("¿Vaciar todo el menú semanal?")) return;
    DIAS.forEach((d) => COMIDAS.forEach((c) => (S.menuSemanal[d][c] = [])));
    guardarMenu(S.menuSemanal);
    if (confirm("¿Quitar también esas recetas de la lista de la compra?")) {
      ids.forEach((id) => S.seleccion.delete(id));
      guardarSeleccion(S.seleccion);
      actualizarBarra();
    }
    ids.forEach((id) => S.seleccionMenu.delete(id));
    guardarSeleccionMenu(S.seleccionMenu);
    if (!vistaMenu.hidden) verMenuSemanal();
  }

  // Vacía todas las comidas de un día. Las recetas que dejan de estar en el menú y
  // que solo estaban en la cesta por el menú se quitan también de la cesta (L189).
  function vaciarDia(dia) {
    if (!diaTienePlatos(dia)) return;
    if (!confirm(`¿Vaciar el ${DIAS_NOMBRE[dia]}?`)) return;
    const antes = idsEnMenu();
    COMIDAS.forEach((c) => (S.menuSemanal[dia][c] = []));
    guardarMenu(S.menuSemanal);
    const quedan = new Set(idsEnMenu());
    let cambió = false;
    antes.forEach((id) => {
      if (!quedan.has(id) && S.seleccionMenu.has(id)) {   // ya no en menú y vino del menú
        S.seleccionMenu.delete(id);
        if (S.seleccion.has(id)) { S.seleccion.delete(id); cambió = true; }
      }
    });
    guardarSeleccionMenu(S.seleccionMenu);
    if (cambió) { guardarSeleccion(S.seleccion); actualizarBarra(); }
    if (!vistaMenu.hidden) verMenuSemanal();
  }

  // Ids únicos presentes en el menú (una receta puede estar en varias celdas/platos).
  function idsEnMenu() {
    const set = new Set();
    DIAS.forEach((d) => COMIDAS.forEach((c) => {
      (S.menuSemanal[d][c] || []).forEach((id) => { if (id) set.add(id); });
    }));
    return [...set];
  }

  // Asegura que toda receta del menú esté en la selección (la cesta cuenta 1 vez
  // por receta aunque esté en varias celdas). No quita nada de la selección.
  // Los ids que añade (no estaban ya seleccionados a mano) se marcan como "de menú".
  function volcarMenuASeleccion() {
    const ids = idsEnMenu().filter((id) => S.porId[id]);   // ignora ids ya inexistentes
    let cambió = false;
    ids.forEach((id) => {
      if (!S.seleccion.has(id)) { S.seleccion.add(id); S.seleccionMenu.add(id); cambió = true; }
    });
    if (cambió) { guardarSeleccion(S.seleccion); guardarSeleccionMenu(S.seleccionMenu); actualizarBarra(); }
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
      const recetas = S.RECETAS
        // Busca por nombre, categoría (L191) o ingrediente (L207).
        .filter((r) => !q
          || normalizarBusqueda(r.nombre).includes(q)
          || (r.categoria || []).some((c) => normalizarBusqueda(c).includes(q))
          || (r.ingredientes || []).some((i) => normalizarBusqueda(i.nombre).includes(q)))
        // Primero las de la categoría de la comida; dentro, orden alfabético (L190).
        // NO se restringe la lista: tras las de la comida aparecen TODAS las demás (L221).
        .sort((a, b) => {
          const da = esDeComida(a), db = esDeComida(b);
          if (da !== db) return da ? -1 : 1;
          return a.nombre.localeCompare(b.nombre, "es");
        });
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
    const r = S.porId[id];
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
  S.restaurando = false;   // evita re-pushear durante popstate

  // Reconstruye una vista a partir de su estado guardado, sin tocar el historial.
  function restaurarVista(estado) {
    S.restaurando = true;
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
      S.restaurando = false;
    }
  }

  // Registra un cambio de vista en el historial (salvo si venimos de popstate).
  function registrarVista(vista, id) {
    if (S.restaurando) return;
    const estado = { vista, id: id || null };
    // El listado es el estado base (replace); el resto se apila (push).
    if (vista === "listado") history.replaceState(estado, "");
    else history.pushState(estado, "");
  }

  window.addEventListener("popstate", (e) => {
    restaurarVista(e.state || { vista: "listado" });
  });

  // --- Eventos globales ---
  // Al terminar de imprimir, quita la marca de "imprimir solo el menú" y el @page.
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("print-menu");
    document.getElementById("print-page-landscape")?.remove();
  });

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
  S.temaActual = cargarTema();
  aplicarTema(S.temaActual);
  btnTema.addEventListener("click", () => {
    S.temaActual = TEMAS[(TEMAS.indexOf(S.temaActual) + 1) % TEMAS.length];
    localStorage.setItem(LS_TEMA, S.temaActual);
    aplicarTema(S.temaActual);
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
        if (S.seleccion.size) verListaCompra(); else verSeleccion();
        break;
      case "vaciar":
        if (!S.seleccion.size) { alert("No hay recetas seleccionadas."); break; }
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
