/* MANEMUS · página de una historia */
(async function () {
  pintarMarco();
  const contenedor = $("#contenido");
  const vistaPrevia = parametros().has("vista-previa");
  const slug = parametros().get("id");

  let categorias, historias;
  try {
    [categorias, historias] = await Promise.all([
      cargarJSON("data/categorias.json"),
      cargarJSON("data/historias.json")
    ]);
  } catch (e) { mostrarError(e, contenedor); return; }

  const h = historias.find(x => x.slug === slug);
  if (!h || !estaPublicada(h, vistaPrevia)) {
    contenedor.innerHTML = `<div class="error"><p><strong>No encontramos esa historia.</strong></p><p><a href="index.html">Volver a todas las historias</a></p></div>`;
    document.title = "Historia no encontrada · " + SITIO.nombre;
    return;
  }

  let md;
  try { md = await cargarTexto(h.texto); } catch (e) { mostrarError(e, contenedor); return; }

  const cat = categorias.find(c => c.id === h.categoria) || { id: "", nombre: "Sin categoría", color: "#4A5360" };
  const p = h.personaje || {};
  const bloques = leerMarkdown(md);
  const sufijo = vistaPrevia ? "&vista-previa" : "";

  const textoHTML = bloques.map(b => {
    const frases = frasesDe(b.texto).map(f => `<span class="frase">${enLinea(esc(f))}</span>`).join(" ");
    if (b.tipo === "h2") return `<h2>${frases}</h2>`;
    if (b.tipo === "cita") return `<blockquote><p>${frases}</p></blockquote>`;
    return `<p>${frases}</p>`;
  }).join("\n");

  const relacionadas = ordenarRecientes(historias.filter(x => x.slug !== h.slug && estaPublicada(x, vistaPrevia)));
  const mismaCat = relacionadas.filter(x => x.categoria === h.categoria);
  const sugeridas = (mismaCat.length ? mismaCat : relacionadas).slice(0, 3);
  const colorDe = id => (categorias.find(c => c.id === id) || { color: "#4A5360" }).color;

  const dato = (t, v) => v ? `<div><dt>${t}</dt><dd>${esc(v)}</dd></div>` : "";

  contenedor.innerHTML = `
  <article class="historia ctx" style="--cat:${esc(cat.color)}">
    <header class="historia-cab">
      <a class="cat-enlace" href="index.html?cat=${encodeURIComponent(cat.id)}">${esc(cat.nombre)}</a>
      <h1>${esc(h.titulo)}</h1>
      <p class="bajada">${esc(h.resumen)}</p>
      <div class="acciones" id="acciones" role="group" aria-label="Acciones de la historia"></div>
      <p class="estado-accion" id="estado-accion" role="status" aria-live="polite"></p>
    </header>

    <figure class="portada" style="margin-left:0;margin-right:0">
      <img src="${esc(h.portada)}" alt="${esc(h.portada_alt || "")}">
    </figure>

    <div class="historia-cuerpo">
      <aside class="lateral" aria-label="Datos de la historia y opciones para escuchar">
        <dl>
          ${dato("Quién cuenta", p.nombre ? p.nombre + (p.edad ? ", " + p.edad + " años" : "") : "")}
          ${dato("Dónde vive hoy", p.lugar)}
          ${dato("Publicada", fechaLarga(h.publicado))}
          ${dato("Hechos", h.epoca === "hoy" ? "De 2016 en adelante" : h.epoca === "ayer" ? "Anteriores a 2016" : "")}
        </dl>
        ${(h.etiquetas || []).length ? `<ul class="etiquetas" aria-label="Etiquetas">${h.etiquetas.map(e => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}
        <div class="escucha" id="escucha" role="group" aria-label="Escuchar esta historia"></div>
      </aside>

      <div>
        ${h.aviso ? `<p class="aviso-hist">${ICONO_AVISO}<span><strong>Aviso de contenido.</strong> ${esc(h.aviso)}</span></p>` : ""}
        ${h.ficticia ? `<p class="ficticia">${esc(SITIO.ficticiaTexto)}</p>` : ""}
        <div class="texto" id="texto">${textoHTML}</div>
        <div id="fin-texto" aria-hidden="true"></div>

        ${h.entender ? `<section class="entender" aria-labelledby="entender-t">
          <h2 id="entender-t">${esc(h.entender.titulo || "Para entender")}</h2>
          <p>${esc(h.entender.texto)}</p>
          ${(h.entender.fuentes || []).length ? `<p class="fuentes-t">Fuentes</p><ul>${h.entender.fuentes.map(f => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
        </section>` : ""}

        <div class="cierre" id="cierre" hidden>
          <p class="pausa">Si lo necesitas, haz una pausa antes de seguir. Respirar también es parte de escuchar.</p>
          <p class="progreso-cierre" id="progreso-cierre"></p>
          ${SITIO.facebook && SITIO.facebook.url ? `<p><a class="boton sec" data-facebook></a></p>` : ""}
        </div>

        <p class="apoyo"><strong>Si esta historia te removió algo:</strong> ${SITIO.apoyo.map(textoApoyo).join(" ")}</p>
      </div>
    </div>

    ${sugeridas.length ? `<nav class="mas" aria-labelledby="mas-t">
      <h2 id="mas-t">${mismaCat.length ? "Más en " + esc(cat.nombre) : "Más historias"}</h2>
      <ul>${sugeridas.map(s => `<li class="ctx" style="--cat:${esc(colorDe(s.categoria))}"><a href="historia.html?id=${encodeURIComponent(s.slug)}${sufijo}">${esc(s.titulo)}</a></li>`).join("")}</ul>
    </nav>` : ""}
  </article>`;

  document.title = `${h.titulo} · ${SITIO.nombre}`;
  pintarMarco();
  prepararAcciones(h, categorias);
  prepararFinal(h, categorias);
  prepararEscucha(h);
})();

/* ---------- Escuchar: audio grabado si existe; si no, la voz del navegador ---------- */
function prepararEscucha(h) {
  const caja = $("#escucha");

  if (h.audio) {
    caja.innerHTML = `<h2>Escuchar</h2>
      <audio controls preload="none" src="${esc(h.audio)}">Tu navegador no puede reproducir audio.</audio>
      <p class="nota">Narración grabada.</p>`;
    const au = $("#escucha audio");
    if (au) au.addEventListener("ended", () => { if (window.__terminarHistoria) window.__terminarHistoria(); });
    return;
  }

  const sintesis = window.speechSynthesis;
  if (!sintesis || typeof SpeechSynthesisUtterance === "undefined") {
    caja.innerHTML = `<h2>Escuchar</h2><p class="nota" style="margin-top:0">Tu navegador no permite escuchar el texto en voz alta. Puedes leer la historia en esta página.</p>`;
    return;
  }

  caja.innerHTML = `<h2>Escuchar</h2>
    <div class="controles">
      <button type="button" class="boton" id="b-escuchar">Escuchar la historia</button>
      <button type="button" class="boton sec" id="b-detener" hidden>Empezar de nuevo</button>
    </div>
    <label>Velocidad
      <select id="velocidad">
        <option value="0.85">Lenta</option>
        <option value="1" selected>Normal</option>
        <option value="1.2">Rápida</option>
      </select>
    </label>
    <p class="nota">Voz generada por tu navegador. Suena distinto según el dispositivo. Toca cualquier frase del texto para escuchar desde ahí.</p>`;

  const texto = $("#texto");
  const frases = [...texto.querySelectorAll(".frase")];
  const bEscuchar = $("#b-escuchar"), bDetener = $("#b-detener"), selVel = $("#velocidad");
  const sinMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let voz = null, i = 0, activo = false, velocidad = 1, ticket = 0;

  texto.classList.add("habla");

  function elegirVoz() {
    const v = sintesis.getVoices();
    voz = v.find(x => x.lang.replace("_", "-") === "es-CO")
       || v.find(x => /^es[-_](MX|US|419|AR|CL|PE)/i.test(x.lang))
       || v.find(x => /^es/i.test(x.lang))
       || null;
  }
  elegirVoz();
  if (sintesis.addEventListener) sintesis.addEventListener("voiceschanged", elegirVoz);

  function marcar(k) {
    frases.forEach((f, j) => f.classList.toggle("leyendo", j === k));
    const f = frases[k]; if (!f) return;
    const r = f.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight - 80) {
      f.scrollIntoView({ block: "center", behavior: sinMovimiento ? "auto" : "smooth" });
    }
  }

  function etiqueta() {
    bEscuchar.textContent = activo ? "Pausar" : (i > 0 && i < frases.length ? "Continuar" : "Escuchar la historia");
    bDetener.hidden = !(activo || (i > 0 && i < frases.length));
  }

  function hablar() {
    if (!activo) return;
    if (i >= frases.length) { activo = false; i = 0; frases.forEach(f => f.classList.remove("leyendo")); etiqueta(); if (window.__terminarHistoria) window.__terminarHistoria(); return; }
    marcar(i);
    const mio = ++ticket;
    const u = new SpeechSynthesisUtterance(frases[i].textContent.trim());
    u.lang = voz ? voz.lang : "es-CO";
    if (voz) u.voice = voz;
    u.rate = velocidad;
    u.onend = () => { if (mio !== ticket || !activo) return; i++; hablar(); };
    u.onerror = ev => {
      if (ev.error === "interrupted" || ev.error === "canceled") return;
      activo = false; etiqueta();
    };
    sintesis.speak(u);
  }

  function parar() { ticket++; sintesis.cancel(); }

  bEscuchar.addEventListener("click", () => {
    if (activo) { activo = false; parar(); etiqueta(); return; }
    activo = true; etiqueta(); hablar();
  });
  bDetener.addEventListener("click", () => {
    parar(); i = 0; activo = true; etiqueta();
    setTimeout(hablar, 80);
  });
  selVel.addEventListener("change", () => {
    velocidad = parseFloat(selVel.value) || 1;
    if (activo) { parar(); setTimeout(hablar, 80); }
  });
  texto.addEventListener("click", e => {
    const f = e.target.closest(".frase"); if (!f) return;
    i = frases.indexOf(f); parar(); activo = true; etiqueta();
    setTimeout(hablar, 80);
  });
  window.addEventListener("pagehide", () => { ticket++; sintesis.cancel(); });
}


/* ---------- Guardar, vela y compartir ---------- */
function prepararAcciones(h, categorias) {
  const caja = $("#acciones"), msg = $("#estado-accion");
  let temporizador = 0;
  const avisar = t => {
    msg.textContent = t;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { msg.textContent = ""; }, 4000);
  };
  const nombreCorto = (h.personaje && h.personaje.nombre) ? h.personaje.nombre.split(" ")[0] : "";

  function pintar() {
    const guardada = Lector.tiene("guardadas", h.id);
    const vela = Lector.tiene("velas", h.id);
    caja.innerHTML = `
      <button type="button" class="accion" id="a-guardar" aria-pressed="${guardada}">${ICONO_MARCADOR}<span>${guardada ? "Guardada" : "Guardar para después"}</span></button>
      <button type="button" class="accion accion-vela" id="a-vela" aria-pressed="${vela}">${ICONO_VELA_BOTON}<span>${vela ? "Vela encendida" : "Encender una vela"}</span></button>
      <button type="button" class="accion" id="a-compartir">${ICONO_COMPARTIR}<span>Compartir</span></button>`;
  }
  pintar();

  caja.addEventListener("click", async e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.id === "a-guardar") {
      const quedo = Lector.alternar("guardadas", h.id); pintar();
      $("#a-guardar").focus();
      avisar(quedo ? "Historia guardada en este navegador." : "Quitada de tus guardadas.");
    } else if (b.id === "a-vela") {
      const quedo = Lector.alternar("velas", h.id); pintar();
      $("#a-vela").focus();
      avisar(quedo ? "Vela encendida" + (nombreCorto ? " por " + nombreCorto : "") + ". Solo la ves tú." : "Vela apagada.");
    } else if (b.id === "a-compartir") {
      const enlace = urlCompartible(h.slug);
      const texto = `${h.titulo}. ${SITIO.nombre}: ${SITIO.lema}`;
      if (navigator.share) {
        try { await navigator.share({ title: h.titulo, text: texto, url: enlace }); return; }
        catch (err) { if (err && err.name === "AbortError") return; }
      }
      mostrarOpcionesCompartir(enlace, texto, avisar);
    }
  });
}

function mostrarOpcionesCompartir(enlace, texto, avisar) {
  let panel = $("#panel-compartir");
  if (panel) { panel.remove(); return; }
  panel = document.createElement("div");
  panel.id = "panel-compartir"; panel.className = "panel-compartir";
  panel.innerHTML = `
    <a class="boton sec" target="_blank" rel="noopener noreferrer" href="https://wa.me/?text=${encodeURIComponent(texto + " " + enlace)}">WhatsApp</a>
    <button type="button" class="boton sec" id="c-copiar">Copiar enlace</button>`;
  $("#acciones").after(panel);
  $("#c-copiar").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      avisar("Enlace copiado.");
    } catch (err) {
      window.prompt("Copia este enlace:", enlace);
    }
  });
}

/* ---------- Final de la historia: cuenta para el recorrido ---------- */
function prepararFinal(h, categorias) {
  const fin = $("#fin-texto");
  let hecho = false;

  function terminar() {
    if (hecho) return; hecho = true;
    const nuevo = Lector.agregar("leidas", h.id);
    const cierre = $("#cierre");
    if (!cierre) return;
    cierre.hidden = false;
    pintarMarco();
    cargarJSON("data/historias.json").then(todas => {
      const leidas = Lector.lista("leidas");
      const cats = new Set(todas.filter(x => leidas.includes(x.id)).map(x => x.categoria));
      const p = $("#progreso-cierre");
      if (p) p.textContent = `Has recorrido ${cats.size} de ${categorias.length} formas de contar.` + (nuevo ? "" : " Ya habías terminado esta historia.");
    }).catch(() => {});
  }
  window.__terminarHistoria = terminar;

  if (typeof window.IntersectionObserver === "function" && fin) {
    const obs = new IntersectionObserver(entradas => {
      if (entradas.some(en => en.isIntersecting)) { terminar(); obs.disconnect(); }
    }, { threshold: 0 });
    obs.observe(fin);
  }
}
