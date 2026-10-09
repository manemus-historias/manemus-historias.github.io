# Manemus (prototipo)

Portal de historias sobre las violencias en Colombia que se pueden **leer o escuchar**. *Manemus* significa "permanecemos" en latín. Es un sitio estático: no necesita servidor ni base de datos y funciona gratis en GitHub Pages.

La historia que trae es de prueba y es **ficticia**. Las personas, los lugares y los hechos están inventados.

## Cómo publicarlo en GitHub Pages

1. Crea un repositorio **público** en GitHub.
2. Sube **el contenido** de esta carpeta (no la carpeta misma). En la raíz del repositorio deben quedar `index.html`, `historia.html`, `css/`, `js/`, `data/`, `historias/`, `herramientas/` y el archivo oculto `.nojekyll`.
3. En el repositorio: **Settings → Pages → Build and deployment**. Elige **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`.
4. En uno o dos minutos GitHub muestra la dirección del sitio.

> Si subes los archivos arrastrándolos en el navegador, confirma que `.nojekyll` quedó incluido. Algunos sistemas ocultan los archivos que empiezan por punto. Si no aparece, crea un archivo vacío con ese nombre desde GitHub (**Add file → Create new file**).

## Probarlo en tu computador

Los navegadores no dejan leer los datos si abres `index.html` con doble clic. Hay que usar un servidor local, y con Python basta una línea. Desde esta carpeta:

```
python3 -m http.server 8000
```

Luego abre `http://localhost:8000`.

## Cómo está organizado

```
index.html              portada: introducción, categorías, filtros y lista de historias
acerca.html             página "De qué se trata" (presentación y propósitos)
historia.html           plantilla única que muestra cualquier historia (?id=el-slug)
css/estilos.css         colores y tipografías (todo está en los "tokens" del inicio)
js/comun.js             configuración del sitio (textos de apoyo, avisos) y utilidades
js/index.js             lógica de la portada
js/historia.js          lógica de la página de historia y de la escucha
data/categorias.json    las 7 categorías
data/historias.json     el índice: una entrada por historia
historias/              una carpeta por historia (texto, imagen y audio)
herramientas/           scripts opcionales de ayuda
```

## Cómo publicar una historia nueva

1. **Crea la carpeta.** Con el script:
   ```
   python3 herramientas/nueva_historia.py "Título de la historia" falta-alguien
   ```
   Crea `historias/002-titulo-de-la-historia/` con un `texto.md` de plantilla y te imprime la entrada que debes copiar. (Se puede hacer a mano: es una carpeta con los archivos y una entrada en el JSON.)
2. **Escribe el texto** en `texto.md`.
   - Párrafos separados por una línea en blanco.
   - `## Subtítulo` para dividir en secciones.
   - `> cita` para una cita destacada.
   - `*cursiva*` y `**negrita**`.
3. **Agrega la imagen** (`portada.jpg`, `.webp` o `.svg`), de preferencia de unos 150 a 300 KB.
4. **Si hay audio**, guárdalo como `audio.mp3` en la misma carpeta y escribe su ruta en el campo `audio` del JSON. Mejor mono y en calidad media (cerca de 0,5 MB por minuto).
5. **Copia la entrada** al final de `data/historias.json` (con una coma después de la entrada anterior) y complétala.
6. **Revisa**: `python3 herramientas/validar.py`. Avisa de campos que faltan, archivos que no existen, categorías mal escritas y archivos muy pesados.
7. **Sube los cambios** al repositorio. En uno o dos minutos está publicada.

### Campos de cada historia

| Campo | Qué es |
|---|---|
| `slug` | Nombre corto para la dirección. Solo minúsculas, números y guiones. |
| `categoria` | Uno de los `id` de `categorias.json`. |
| `publicado` | Fecha AAAA-MM-DD. **Si es futura, la historia no aparece hasta ese día.** |
| `epoca` | `"hoy"` (hechos de 2016 en adelante) o `"ayer"` (anteriores a 2016). |
| `ficticia` | `true` si es inventada. Muestra el rótulo de historia ficticia. |
| `aviso` | Aviso de contenido: qué temas sensibles toca. |
| `marcas` | `["esperanza"]` si la historia habla de una reconstrucción. |
| `audio` | Ruta del MP3, o `null` si no hay. |
| `entender` | Cápsula "Para entender": título, texto y lista de fuentes. |

Los contadores por categoría y el orden de la portada (la más reciente primero) se calculan solos.

## Interacción para quien visita

Todo se guarda **solo en el navegador de cada persona** (no hay servidor ni cuentas, y no se recogen datos):

- **Guardar para después**: botón en cada historia y en cada tarjeta. En la portada, el filtro *Mis guardadas* las reúne.
- **Encender una vela**: reacción personal y silenciosa. Solo la ve quien la enciende (no hay contador compartido).
- **Compartir**: usa el menú nativo del celular. Si no existe, ofrece WhatsApp y copiar enlace.
- **Mi recorrido**: una historia cuenta como terminada cuando la persona llega al final del texto o termina de escucharla. Cada categoría recorrida se colorea y se muestra "Has recorrido X de 7 formas de contar".
- **Borrar lo que guardé**: en el pie de página.
- **Pausa**: al terminar una historia aparece un mensaje que invita a respirar antes de seguir.

Un contador compartido de velas necesitaría una base de datos en línea; por ahora no se incluye.

## Enlace al grupo de Facebook

Se define una sola vez en `js/comun.js` (bloque `SITIO.facebook`). Aparece en el menú, en el pie, al terminar cada historia y en *De qué se trata*. Para ocultarlo en todas partes, deja `url: ""`.

## Cómo funciona la escucha

- **Con `audio`**: la página muestra un reproductor con la narración grabada.
- **Sin `audio`**: usa la voz del navegador, frase por frase, resaltando lo que va leyendo. Se puede tocar cualquier frase para escuchar desde ahí. La voz **depende del dispositivo** (en algunos suena natural y en otros robótica) y el acento colombiano no está garantizado. Gratis y sin servidor.
- Por ahora, con audio grabado el texto no se resalta al ritmo de la voz. Se puede agregar más adelante.

## Revisar una historia antes de que llegue su fecha

Añade `?vista-previa` a la dirección, por ejemplo `historia.html?id=mi-historia&vista-previa`. Es solo una comodidad, **no una protección**: como el sitio es público, quien abra `data/historias.json` puede ver las historias programadas. Si algo no debe verse antes de tiempo, no lo subas todavía.

## Antes de publicar de verdad

- **Verifica los datos de apoyo** en `js/comun.js` (líneas de atención e instituciones). Se escribieron de memoria y deben comprobarse.
- **Verifica la cápsula "Para entender"** de cada historia contra la fuente que cita. La de la historia de prueba se basa en la Ley 387 de 1997 y en el Registro Único de Víctimas.
- **Historias ficticias**: mantén `ficticia: true`, no nombres grupos armados ni personas reales y no reproduzcas casos reconocibles. Usa patrones, no casos.
- **Testimonios reales** cambian el estándar: consentimiento informado y revocable por escrito, datos sensibles protegidos (Ley 1581 de 2012), autorización de representantes si hay menores, y cuidado con la voz, que también identifica. Lo ideal es trabajar con una organización de víctimas y pasar por revisión legal y psicosocial.
- **Todo lo que se sube a un repositorio público es público**, incluido el JSON y los audios.

## Editar los textos de presentación

- **Titular y párrafo de la portada**: en `index.html`, dentro de `<section class="intro">`.
- **Página "De qué se trata"**: el texto está en `acerca.html`.
- **Aviso de que las historias son ficticias** en esa página: se controla en `js/comun.js` con `historiasFicticias` y `ficticiaIntro`. Cuando se publiquen testimonios reales, cambia `historiasFicticias` a `false` y revisa el texto de consentimiento.

## Sistema de diseño

Paleta 60-30-10, definida como tokens al inicio de `css/estilos.css`:

| Uso | Color |
|---|---|
| Fondo y tarjetas (60%) | Hueso `#F7F4F0` (nunca blanco puro) |
| Encabezados, barra, héroe y pie (30%) | Vinotinto `#56070c` |
| Acciones principales, líneas de ayuda, avisos (10%) | Mostaza `#D99B00` |
| Recuperación, apoyo y testimonios | Oliva `#4A5D4E` |
| Texto | `#1E1E1E` |

- **Tipografías**: Montserrat (títulos) e Inter (texto), con interlineado de 1,7 a 1,85 en lo que se lee y mucho espacio entre bloques.
- **Imágenes**: sin imágenes gráficas ni de violencia. Las portadas pasan por un filtro duotono vinotinto y gris pizarra (definido en `instalarFiltroDuotono` de `js/comun.js`), así que cualquier imagen que se suba queda con el mismo estilo.
- **Colores de las categorías**: son tonos de la misma paleta y están en `data/categorias.json`.
- **Sin modo oscuro**: se quitó para respetar la paleta exacta.
- **Responsive**: probado sin desbordes entre 320 y 1920 px. Las tarjetas se adaptan a su propio ancho, y en celular las historias aparecen antes que el recorrido.

## Salida rápida

Botón mostaza siempre visible en todas las páginas. Al pulsarlo (o al pulsar Esc dos veces seguidas) cierra la sesión de la página y la reemplaza por un sitio neutral. La dirección se cambia en `js/comun.js`, bloque `SITIO.salidaRapida`.

**Limitación**: una página web no puede borrar el historial del navegador. El pie lo explica y recomienda una ventana privada.

## Cambiar el nombre y la identidad visual

- **Nombre y avisos**: `js/comun.js` (bloque `SITIO`). El nombre se escribe una sola vez ahí y se aplica a todas las páginas. Para quitar la franja de prototipo, deja `avisoPrototipo: ""`.
- **Colores y tipografías**: los primeros bloques de `css/estilos.css`. Los colores de cada categoría están en `data/categorias.json`.

## Límites conocidos

- Las páginas se arman con JavaScript, así que **Google y WhatsApp no muestran vista previa propia de cada historia**. Si más adelante importa, se pasa a un generador de sitios estáticos (Astro o Eleventy), que crea una página real por historia. Esta estructura ya sirve de base.
- GitHub Pages tiene límites de tamaño y de tráfico. Revisa los vigentes antes de lanzar.
