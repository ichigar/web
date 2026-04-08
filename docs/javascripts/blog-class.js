/* blog-class.js — añade/quita la clase `blog-page` al <body> según la URL
   actual. Usa document$ (observable de Material) que emite en la carga
   inicial y en cada navegación instantánea. */

function applyBlogClass() {
  var isBlog = /\/blog(\/|$)/.test(location.pathname);
  if (document.body) {
    document.body.classList.toggle("blog-page", isBlog);
  }
}

// Ejecución inmediata
applyBlogClass();

// Suscripción al observable de Material (carga inicial + navegación instantánea)
if (typeof document$ !== "undefined") {
  document$.subscribe(applyBlogClass);
}
