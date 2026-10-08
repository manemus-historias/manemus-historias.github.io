/* =====================================================================
   MANEMUS · funciones comunes
   ===================================================================== */

/* ---------- CONFIGURACIÓN (edítala aquí) ---------- */
const SITIO = {
  nombre: "Manemus",
  lema: "Historias para leer y escuchar.",
  // Deja "" para ocultar la franja de prototipo cuando el sitio sea definitivo.
  avisoPrototipo: "Prototipo con historias ficticias. La identidad visual es provisional.",
  // Con true, la página "De qué se trata" avisa que las historias son ficticias.
  // Cuando se publiquen testimonios reales, cámbialo a false y ajusta el texto.
  historiasFicticias: true,
  ficticiaIntro: "En esta versión de prueba, las historias son ficticias y se inspiran en patrones documentados por instituciones de memoria.",
  ficticiaTexto: "Historia ficticia, inspirada en patrones que las instituciones de memoria han documentado. Cualquier parecido con una persona real es casual.",
  // Verifica estos datos antes de publicar.
  apoyo: [
    "En Bogotá, la línea 106 atiende salud mental.",
    "A nivel nacional, la línea 192, opción 4."
  ],
  instituciones: "Para conocer testimonios reales, consulta el Centro Nacional de Memoria Histórica, el archivo de la Comisión de la Verdad y la Unidad de Búsqueda de Personas dadas por Desaparecidas."
};

/* ---------- Utilidades ---------- */
const $ = (selector, raiz = document) => raiz.querySelector(selector);

const esc = valor => String(valor ?? "").replace(/[&<>"']/g, c => (
  { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
));

function parametros() { return new URLSearchParams(location.search); }

function fechaLarga(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

/* Una historia aparece si su fecha ya llegó. Con ?vista-previa se ven todas
   (útil para revisar una historia programada antes de su fecha). */
function estaPublicada(historia, vistaPrevia) {
  if (vistaPrevia) return true;
  return new Date(historia.publicado + "T00:00:00") <= new Date();
}

function ordenarRecientes(lista) {
  return [...lista].sort((a, b) => b.publicado.localeCompare(a.publicado) || b.id - a.id);
}

async function cargarJSON(ruta) {
  const r = await fetch(ruta, { cache: "no-cache" });
  if (!r.ok) throw new Error(`No se pudo cargar ${ruta} (${r.status})`);
  return r.json();
}

async function cargarTexto(ruta) {
  const r = await fetch(ruta, { cache: "no-cache" });
  if (!r.ok) throw new Error(`No se pudo cargar ${ruta} (${r.status})`);
  return r.text();
}

function mostrarError(error, contenedor) {
  const enArchivo = location.protocol === "file:";
  const ayuda = enArchivo
    ? `<p>Estás abriendo el archivo directamente desde el computador. Los navegadores bloquean la lectura de datos en ese caso. Abre una terminal en esta carpeta y ejecuta <code>python3 -m http.server 8000</code>. Luego entra a <code>http://localhost:8000</code>.</p>`
    : `<p>Revisa que los archivos de la carpeta <code>data</code> existan y que el JSON esté bien escrito.</p>`;
  (contenedor || $("main")).innerHTML = `<div class="error" role="alert"><p><strong>No pudimos cargar las historias.</strong></p>${ayuda}<p>Detalle técnico: ${esc(error.message || error)}</p></div>`;
}

/* ---------- Markdown mínimo ----------
   Admite: párrafos, "## subtítulo", "> cita", **negrita** y *cursiva*. */
function leerMarkdown(md) {
  const bloques = [];
  md.replace(/\r\n/g, "\n").split(/\n{2,}/).forEach(parte => {
    const t = parte.trim();
    if (!t) return;
    if (t.startsWith("## ")) bloques.push({ tipo: "h2", texto: t.slice(3).trim() });
    else if (t.startsWith("> ")) bloques.push({ tipo: "cita", texto: t.replace(/^>\s?/gm, "").replace(/\n/g, " ").trim() });
    else bloques.push({ tipo: "p", texto: t.replace(/\n/g, " ") });
  });
  return bloques;
}

function enLinea(textoYaEscapado) {
  return textoYaEscapado
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function frasesDe(texto) {
  const m = texto.match(/[^.!?…]+[.!?…]+["”»’)]*|[^.!?…]+$/g);
  return m ? m.map(s => s.trim()).filter(Boolean) : [texto];
}

/* ---------- Franja de prototipo y pie (se escriben una sola vez aquí) ---------- */
function pintarMarco() {
  document.querySelectorAll(".marca").forEach(m => { m.textContent = SITIO.nombre; });
  const nota = $("#ficticia-intro");
  if (nota) {
    if (SITIO.historiasFicticias && SITIO.ficticiaIntro) { nota.textContent = SITIO.ficticiaIntro; nota.hidden = false; }
    else nota.remove();
  }
  const franja = $("#proto");
  if (franja) {
    if (SITIO.avisoPrototipo) franja.textContent = SITIO.avisoPrototipo;
    else franja.remove();
  }
  const pie = $("#pie");
  if (pie) {
    pie.innerHTML = `<div class="envoltura">
      <div>
        <h2>Sobre estas historias</h2>
        <p>${esc(SITIO.ficticiaTexto)}</p>
      </div>
      <div>
        <h2>Si algo de lo que leíste o escuchaste te removió</h2>
        <p>${SITIO.apoyo.map(esc).join(" ")}</p>
        <p>${esc(SITIO.instituciones)}</p>
      </div>
    </div>`;
  }
}

const ICONO_VELA = `<svg viewBox="0 0 20 26" aria-hidden="true"><path d="M10 1C14 6 15.5 9 15.5 11.5A5.5 5.5 0 0 1 4.5 11.5C4.5 9 6 6 10 1Z" fill="#c4571a" stroke="currentColor" stroke-width="1.6"/></svg>`;
const ICONO_AVISO = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2.5 20h19L12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 10v5M12 17.6v.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
