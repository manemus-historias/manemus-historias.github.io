/* MANEMUS · portada */
(async function () {
  pintarMarco();
  const vistaPrevia = parametros().has("vista-previa");

  let categorias, historias;
  try {
    [categorias, historias] = await Promise.all([
      cargarJSON("data/categorias.json"),
      cargarJSON("data/historias.json")
    ]);
  } catch (e) {
    mostrarError(e, $("#cuerpo"));
    return;
  }

  const publicadas = ordenarRecientes(historias.filter(h => estaPublicada(h, vistaPrevia)));
  const estado = { cat: "todas", epoca: "todas" };
  const pedida = parametros().get("cat");
  if (pedida && categorias.some(c => c.id === pedida)) estado.cat = pedida;

  const porEpoca = () => publicadas.filter(h => estado.epoca === "todas" || h.epoca === estado.epoca);
  const catDe = id => categorias.find(c => c.id === id) || { nombre: "Sin categoría", color: "#4A5360" };

  function pintarCategorias() {
    const base = porEpoca();
    const botones = categorias.map(c => {
      const n = base.filter(h => h.categoria === c.id).length;
      const activa = estado.cat === c.id;
      return `<li><button type="button" class="cat ctx${activa ? " activa" : ""}" data-cat="${esc(c.id)}" style="--cat:${esc(c.color)}" aria-pressed="${activa}">
        <span class="muestra" aria-hidden="true"></span><span>${esc(c.nombre)}</span><span class="num">${n}</span></button></li>`;
    }).join("");
    const todas = `<li><button type="button" class="cat todas${estado.cat === "todas" ? " activa" : ""}" data-cat="todas" aria-pressed="${estado.cat === "todas"}">
      <span class="muestra" aria-hidden="true"></span><span>Todas</span><span class="num">${base.length}</span></button></li>`;
    $("#cats").innerHTML = todas + botones;
  }

  function pintarEpoca() {
    const opciones = [["todas", "Todas"], ["hoy", "Hoy"], ["ayer", "Ayer"]];
    $("#epoca-botones").innerHTML = opciones.map(([v, t]) =>
      `<button type="button" data-epoca="${v}" aria-pressed="${estado.epoca === v}">${t}</button>`).join("");
  }

  function relato(h, i) {
    const c = catDe(h.categoria);
    const p = h.personaje || {};
    const quien = [p.nombre ? esc(p.nombre) + (p.edad ? `, ${esc(p.edad)} años` : "") : "", p.lugar ? esc(p.lugar) : "", fechaLarga(h.publicado)]
      .filter(Boolean).join(". ") + ".";
    const esperanza = (h.marcas || []).includes("esperanza")
      ? `<p class="marca-esp">${ICONO_VELA}<span>Historia de reconstrucción</span></p>` : "";
    return `<article class="relato ctx${i === 0 ? " destacado" : ""}" style="--cat:${esc(c.color)}">
      <a class="relato-enlace" href="historia.html?id=${encodeURIComponent(h.slug)}${vistaPrevia ? "&vista-previa" : ""}">
        <div class="relato-img"><img src="${esc(h.portada)}" alt="${esc(h.portada_alt || "")}" loading="${i === 0 ? "eager" : "lazy"}"></div>
        <div>
          <p class="relato-cat">${esc(c.nombre)}</p>
          <h3>${esc(h.titulo)}</h3>
          <p class="relato-res">${esc(h.resumen)}</p>
          <p class="relato-meta">${quien}</p>
          ${esperanza}
        </div>
      </a>
    </article>`;
  }

  function pintarLista() {
    const base = porEpoca();
    const filtradas = base.filter(h => estado.cat === "todas" || h.categoria === estado.cat);
    const c = categorias.find(x => x.id === estado.cat);
    const nombreEpoca = { hoy: "hechos de 2016 en adelante", ayer: "hechos anteriores a 2016" }[estado.epoca];

    $("#lista-cab").innerHTML = `<h2 id="lista-titulo">${esc(c ? c.nombre : "Todas las historias")}</h2>
      <p>${esc(c ? c.frase : "Las más recientes primero.")}${nombreEpoca ? " Mostrando " + nombreEpoca + "." : ""}</p>`;

    if (!filtradas.length) {
      $("#lista").innerHTML = `<div class="vacio"><p>${c
        ? "Todavía no hay historias en esta categoría con ese filtro. Se publican de a poco."
        : "Todavía no hay historias publicadas."}</p></div>`;
      return;
    }
    $("#lista").innerHTML = filtradas.map(relato).join("");
  }

  function pintarTodo() {
    pintarCategorias(); pintarEpoca(); pintarLista();
    try {
      const url = new URL(location.href);
      if (estado.cat === "todas") url.searchParams.delete("cat"); else url.searchParams.set("cat", estado.cat);
      history.replaceState(null, "", url);
    } catch (e) { /* algunos entornos no permiten cambiar la dirección */ }
  }

  $("#cats").addEventListener("click", e => {
    const b = e.target.closest("[data-cat]"); if (!b) return;
    estado.cat = b.dataset.cat; pintarTodo();
    const nuevo = $(`#cats [data-cat="${estado.cat}"]`); if (nuevo) nuevo.focus();
  });
  $("#epoca-botones").addEventListener("click", e => {
    const b = e.target.closest("[data-epoca]"); if (!b) return;
    estado.epoca = b.dataset.epoca; pintarTodo();
    const nuevo = $(`#epoca-botones [data-epoca="${estado.epoca}"]`); if (nuevo) nuevo.focus();
  });

  pintarTodo();
})();
