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
  const estado = { cat: "todas", epoca: "todas", guardadas: false };
  const pedida = parametros().get("cat");
  if (pedida && categorias.some(c => c.id === pedida)) estado.cat = pedida;
  if (parametros().get("guardadas") === "1") estado.guardadas = true;

  const porFiltros = () => publicadas.filter(h =>
    (estado.epoca === "todas" || h.epoca === estado.epoca) &&
    (!estado.guardadas || Lector.tiene("guardadas", h.id)));
  const catDe = id => categorias.find(c => c.id === id) || { nombre: "Sin categoría", color: "#4A5360" };

  function pintarCategorias() {
    const base = porFiltros();
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

  /* Guardadas: un filtro simple, solo si la persona ya guardó algo */
  function pintarGuardadas() {
    const n = publicadas.filter(h => Lector.tiene("guardadas", h.id)).length;
    $("#guardadas").innerHTML = `<button type="button" class="chip-guardadas" id="b-guardadas" aria-pressed="${estado.guardadas}">
      ${ICONO_MARCADOR}<span>Mis guardadas</span><span class="num">${n}</span></button>`;
  }

  /* Mi recorrido: las categorías se llenan de color cuando se termina una historia */
  function pintarRecorrido() {
    const leidas = Lector.lista("leidas");
    const catsLeidas = new Set(historias.filter(h => leidas.includes(h.id)).map(h => h.categoria));
    const total = categorias.length;
    const n = categorias.filter(c => catsLeidas.has(c.id)).length;
    const piezas = categorias.map(c => {
      const hecha = catsLeidas.has(c.id);
      return `<li class="${hecha ? "hecha" : ""}" style="--cat:${esc(c.color)}" title="${esc(c.nombre)}${hecha ? " (recorrida)" : ""}"><span class="solo-lectores">${esc(c.nombre)}: ${hecha ? "recorrida" : "sin recorrer"}</span></li>`;
    }).join("");
    $("#recorrido").innerHTML = `<h2>Mi recorrido</h2>
      <ul class="mapa" aria-hidden="true">${piezas}</ul>
      <p>${n === 0
        ? "Aún no has terminado ninguna historia. Cada color se llena cuando llegas al final de una."
        : `Has recorrido ${n} de ${total} formas de contar.`}</p>
      <p class="nota-chica">Se guarda solo en este navegador.</p>`;
  }

  function relato(h, i) {
    const c = catDe(h.categoria);
    const p = h.personaje || {};
    const quien = [p.nombre ? esc(p.nombre) + (p.edad ? `, ${esc(p.edad)} años` : "") : "", p.lugar ? esc(p.lugar) : "", fechaLarga(h.publicado)]
      .filter(Boolean).join(". ") + ".";
    const esperanza = (h.marcas || []).includes("esperanza")
      ? `<p class="marca-esp">${ICONO_VELA}<span>Historia de reconstrucción</span></p>` : "";
    const guardada = Lector.tiene("guardadas", h.id);
    const leida = Lector.tiene("leidas", h.id);
    return `<article class="relato ctx${i === 0 ? " destacado" : ""}" style="--cat:${esc(c.color)}">
      <a class="relato-enlace" href="historia.html?id=${encodeURIComponent(h.slug)}${vistaPrevia ? "&vista-previa" : ""}">
        <div class="relato-img"><img src="${esc(h.portada)}" alt="${esc(h.portada_alt || "")}" loading="${i === 0 ? "eager" : "lazy"}"></div>
        <div>
          <p class="relato-cat">${esc(c.nombre)}${leida ? ` <span class="estado-leida">${ICONO_CHECK}Terminada</span>` : ""}</p>
          <h3>${esc(h.titulo)}</h3>
          <p class="relato-res">${esc(h.resumen)}</p>
          <p class="relato-meta">${quien}</p>
          ${esperanza}
        </div>
      </a>
      <button type="button" class="guardar-mini" data-guardar="${esc(h.id)}" aria-pressed="${guardada}" aria-label="${guardada ? "Quitar de guardadas" : "Guardar para después"}: ${esc(h.titulo)}">${ICONO_MARCADOR}<span>${guardada ? "Guardada" : "Guardar"}</span></button>
    </article>`;
  }

  function pintarLista() {
    const base = porFiltros();
    const filtradas = base.filter(h => estado.cat === "todas" || h.categoria === estado.cat);
    const c = categorias.find(x => x.id === estado.cat);
    const nombreEpoca = { hoy: "hechos de 2016 en adelante", ayer: "hechos anteriores a 2016" }[estado.epoca];

    const titulo = estado.guardadas ? (c ? c.nombre + " · guardadas" : "Mis guardadas") : (c ? c.nombre : "Todas las historias");
    const sub = estado.guardadas
      ? "Las historias que guardaste en este navegador."
      : (c ? c.frase : "Las más recientes primero.");
    $("#lista-cab").innerHTML = `<h2 id="lista-titulo">${esc(titulo)}</h2>
      <p>${esc(sub)}${nombreEpoca ? " Mostrando " + nombreEpoca + "." : ""}</p>`;

    if (!filtradas.length) {
      const msg = estado.guardadas
        ? "Todavía no has guardado historias con este filtro. Usa el botón Guardar en cualquier historia."
        : (c ? "Todavía no hay historias en esta categoría con ese filtro. Se publican de a poco." : "Todavía no hay historias publicadas.");
      $("#lista").innerHTML = `<div class="vacio"><p>${msg}</p></div>`;
      return;
    }
    $("#lista").innerHTML = filtradas.map(relato).join("");
  }

  function pintarTodo() {
    pintarCategorias(); pintarEpoca(); pintarGuardadas(); pintarRecorrido(); pintarLista();
    try {
      const url = new URL(location.href);
      if (estado.cat === "todas") url.searchParams.delete("cat"); else url.searchParams.set("cat", estado.cat);
      if (estado.guardadas) url.searchParams.set("guardadas", "1"); else url.searchParams.delete("guardadas");
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
  $("#guardadas").addEventListener("click", e => {
    if (!e.target.closest("#b-guardadas")) return;
    estado.guardadas = !estado.guardadas; pintarTodo();
    const nuevo = $("#b-guardadas"); if (nuevo) nuevo.focus();
  });
  $("#lista").addEventListener("click", e => {
    const b = e.target.closest("[data-guardar]"); if (!b) return;
    const id = Number(b.dataset.guardar);
    Lector.alternar("guardadas", id);
    pintarTodo();
    const nuevo = $(`[data-guardar="${id}"]`); if (nuevo) nuevo.focus();
  });

  pintarTodo();
})();
