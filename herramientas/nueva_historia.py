#!/usr/bin/env python3
"""Crea la carpeta de una historia nueva y te imprime la entrada para historias.json.

Uso (desde la carpeta raíz del sitio):
    python3 herramientas/nueva_historia.py "Título de la historia" me-toco-irme

La categoría debe ser uno de los 'id' de data/categorias.json.
"""
import json
import re
import sys
import unicodedata
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def a_slug(texto):
    t = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")


if len(sys.argv) != 3:
    print(__doc__)
    sys.exit(1)

titulo, categoria = sys.argv[1], sys.argv[2]
categorias = json.loads((RAIZ / "data/categorias.json").read_text(encoding="utf-8"))
historias = json.loads((RAIZ / "data/historias.json").read_text(encoding="utf-8"))

if categoria not in {c["id"] for c in categorias}:
    print("Esa categoría no existe. Opciones:")
    for c in categorias:
        print("  -", c["id"])
    sys.exit(1)

nuevo_id = max([h["id"] for h in historias], default=0) + 1
slug = a_slug(titulo)
carpeta = f"historias/{nuevo_id:03d}-{slug}"
destino = RAIZ / carpeta

if destino.exists():
    print("Esa carpeta ya existe:", carpeta)
    sys.exit(1)

destino.mkdir(parents=True)
(destino / "texto.md").write_text(
    "Escribe aquí el primer párrafo.\n\n## Subtítulo (opcional)\n\nOtro párrafo. "
    "Deja una línea en blanco entre párrafos.\n",
    encoding="utf-8",
)

entrada = {
    "id": nuevo_id,
    "slug": slug,
    "titulo": titulo,
    "categoria": categoria,
    "publicado": date.today().isoformat(),
    "epoca": "hoy",
    "ficticia": True,
    "personaje": {"nombre": "", "edad": 0, "lugar": ""},
    "resumen": "Una o dos frases que inviten a leer.",
    "aviso": "Qué temas sensibles toca esta historia.",
    "etiquetas": [],
    "marcas": [],
    "texto": f"{carpeta}/texto.md",
    "portada": f"{carpeta}/portada.jpg",
    "portada_alt": "Describe la imagen en una frase.",
    "audio": None,
    "entender": {"titulo": "Para entender", "texto": "", "fuentes": []},
}

print(f"Carpeta creada: {carpeta}/")
print("Pasos:")
print(f"  1. Escribe la historia en {carpeta}/texto.md")
print(f"  2. Pon la imagen en {carpeta}/portada.jpg (y el audio en {carpeta}/audio.mp3, si hay)")
print("  3. Copia esta entrada al final de data/historias.json (con una coma antes) y complétala:")
print("     Si hay audio, cambia \"audio\": null por \"audio\": \"" + carpeta + "/audio.mp3\"")
print()
print(json.dumps(entrada, ensure_ascii=False, indent=2))
print()
print("  4. Ejecuta: python3 herramientas/validar.py")
