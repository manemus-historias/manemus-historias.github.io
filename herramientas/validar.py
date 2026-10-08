#!/usr/bin/env python3
"""Revisa que todo esté en orden antes de subir al repositorio.

Uso (desde la carpeta raíz del sitio):
    python3 herramientas/validar.py
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LIMITE_AUDIO_MB = 8
LIMITE_IMAGEN_KB = 500
errores, avisos = [], []


def cargar(ruta):
    try:
        return json.loads((RAIZ / ruta).read_text(encoding="utf-8"))
    except FileNotFoundError:
        errores.append(f"Falta el archivo {ruta}")
    except json.JSONDecodeError as e:
        errores.append(f"{ruta} tiene un error de escritura (línea {e.lineno}, columna {e.colno}): {e.msg}")
    return None


categorias = cargar("data/categorias.json")
historias = cargar("data/historias.json")

if categorias is None or historias is None:
    print("\n".join("ERROR: " + e for e in errores))
    sys.exit(1)

ids_cat = {c["id"] for c in categorias}
ids, slugs = set(), set()
OBLIGATORIOS = ["id", "slug", "titulo", "categoria", "publicado", "epoca", "resumen", "texto", "portada"]

for h in historias:
    nombre = h.get("slug") or h.get("titulo") or "(sin nombre)"
    for campo in OBLIGATORIOS:
        if not h.get(campo):
            errores.append(f"[{nombre}] falta el campo '{campo}'")

    if h.get("id") in ids:
        errores.append(f"[{nombre}] el id {h.get('id')} está repetido")
    ids.add(h.get("id"))

    if h.get("slug") in slugs:
        errores.append(f"[{nombre}] el slug está repetido")
    slugs.add(h.get("slug"))
    if h.get("slug") and not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", h["slug"]):
        errores.append(f"[{nombre}] el slug solo puede tener minúsculas, números y guiones")

    if h.get("categoria") and h["categoria"] not in ids_cat:
        errores.append(f"[{nombre}] la categoría '{h['categoria']}' no existe en categorias.json")

    if h.get("epoca") and h["epoca"] not in ("hoy", "ayer"):
        errores.append(f"[{nombre}] 'epoca' debe ser 'hoy' o 'ayer'")

    try:
        f = date.fromisoformat(h.get("publicado", ""))
        if f > date.today():
            avisos.append(f"[{nombre}] está programada para el {f.isoformat()} y aún no se verá")
    except ValueError:
        errores.append(f"[{nombre}] la fecha 'publicado' debe ser AAAA-MM-DD")

    for campo in ("texto", "portada", "audio"):
        ruta = h.get(campo)
        if not ruta:
            continue
        archivo = RAIZ / ruta
        if not archivo.is_file():
            errores.append(f"[{nombre}] no existe el archivo de '{campo}': {ruta}")
            continue
        kb = archivo.stat().st_size / 1024
        if campo == "audio" and kb > LIMITE_AUDIO_MB * 1024:
            avisos.append(f"[{nombre}] el audio pesa {kb/1024:.1f} MB; conviene comprimirlo (mono, calidad media)")
        if campo == "portada" and kb > LIMITE_IMAGEN_KB:
            avisos.append(f"[{nombre}] la portada pesa {kb:.0f} KB; conviene reducirla")

    if h.get("ficticia") is None:
        avisos.append(f"[{nombre}] no tiene el campo 'ficticia' (true o false). Define si es inventada o real")
    if not h.get("aviso"):
        avisos.append(f"[{nombre}] no tiene 'aviso' de contenido")

print(f"Categorías: {len(categorias)}   Historias: {len(historias)}")
for a in avisos:
    print("AVISO:", a)
for e in errores:
    print("ERROR:", e)
if errores:
    print(f"\n{len(errores)} error(es). Corrígelos antes de subir.")
    sys.exit(1)
print("\nTodo en orden." if not avisos else "\nSin errores. Revisa los avisos.")
