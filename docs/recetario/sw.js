/* Service worker del Recetario antiinflamatorio (PWA).
 *
 * Estrategia de caché en dos niveles:
 *
 *  - PRECACHE (install): el "shell" de la app + recetas.json (~415 KB), para que
 *    toda la app sea navegable offline desde el primer arranque.
 *  - RUNTIME (fetch):
 *      · recetas.json      -> stale-while-revalidate (sirve cacheado al instante
 *                             y refresca en segundo plano; recoge el JSON nuevo
 *                             tras cada despliegue).
 *      · img/*             -> cache-first bajo demanda en una caché aparte (los
 *                             ~17 MB de fotos NO se precachean).
 *      · resto del shell   -> cache-first.
 *
 * Las peticiones que no son GET (p. ej. POST /api/guardar del PC) no se tocan.
 *
 * Versionado: subir CACHE / CACHE_IMG al cambiar el shell. Al editar este fichero
 * el navegador detecta el cambio y dispara la actualización; en `activate` se
 * borran las cachés con versión antigua.
 */

const CACHE = "recetario-v19";
const CACHE_IMG = "recetario-img-v1";

// Rutas relativas al scope del SW (funciona bajo cualquier subdirectorio).
const PRECACHE = [
  "./",
  "./index.html",
  "./app.js",
  "./styles.css",
  "./manifest.webmanifest",
  "./recetas.json",
  "./favicon-32.png",
  "./favicon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-192-maskable.png",
  "./icon-512-maskable.png",
  // Capturas de la guía de uso (para que se vea offline desde el inicio).
  "./img/ayuda/buscar.jpg",
  "./img/ayuda/compra.jpg",
  "./img/ayuda/nueva.jpg",
  "./img/ayuda/menu.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((n) => n !== CACHE && n !== CACHE_IMG)
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// stale-while-revalidate: devuelve lo cacheado y refresca en segundo plano.
function staleWhileRevalidate(request) {
  return caches.open(CACHE).then((cache) =>
    cache.match(request).then((cacheada) => {
      const red = fetch(request)
        .then((resp) => {
          if (resp && resp.ok) cache.put(request, resp.clone());
          return resp;
        })
        .catch(() => cacheada);
      return cacheada || red;
    })
  );
}

// cache-first: si está cacheada la sirve; si no, va a red y guarda la copia.
function cacheFirst(request, nombreCache) {
  return caches.open(nombreCache).then((cache) =>
    cache.match(request).then((cacheada) => {
      if (cacheada) return cacheada;
      return fetch(request).then((resp) => {
        if (resp && resp.ok) cache.put(request, resp.clone());
        return resp;
      });
    })
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // No interceptamos nada que no sea GET (deja pasar POST /api/guardar, etc.).
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Solo gestionamos peticiones de nuestro propio origen.
  if (url.origin !== self.location.origin) return;

  // recetas.json: stale-while-revalidate.
  if (url.pathname.endsWith("/recetas.json")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Imágenes de recetas: cache-first bajo demanda, en caché separada.
  if (/\/img\/.+\.(jpg|jpeg|png|webp)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE_IMG));
    return;
  }

  // Resto (shell): cache-first contra la caché principal.
  event.respondWith(cacheFirst(request, CACHE));
});
