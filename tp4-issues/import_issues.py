#!/usr/bin/env python3
"""Importa las issues del TP4 al repo y las carga en el Project 5."""
import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

BASE = Path(__file__).resolve().parent
CONFIG = BASE / "project.json"
STATE = BASE / "imported.json"
REPO = "DevEriik/framework-e-interoperabilidad-2026"

PEOPLE = {
    "erick": "DevEriik",
    "abril": "abrilgavilan11",
    "daniela": "DanielaOnatibia",
}

STATUS_INICIAL = "Backlog"


def run(cmd, dry=False):
    if dry:
        print("    $", " ".join(cmd))
        return ""
    p = subprocess.run(cmd, text=True, capture_output=True)
    if p.returncode != 0:
        raise RuntimeError(f"Falló: {' '.join(cmd)}\n{p.stderr.strip()}")
    return p.stdout.strip()


def _clean(value):
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        value = value[1:-1]
    return value


def _list(value):
    value = value.strip()
    if value.startswith("[") and value.endswith("]"):
        value = value[1:-1]
    if not value.strip():
        return []
    return [_clean(x) for x in value.split(",") if x.strip()]


def parse_issue(path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError("falta el front matter")
    parts = text.split("---", 2)
    if len(parts) < 3:
        raise ValueError("front matter mal cerrado")
    front, body = parts[1], parts[2]

    meta = {"labels": [], "assignees": [], "fields": {}}
    in_fields = False

    for raw in front.splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        if raw.startswith("fields:"):
            in_fields = True
            continue
        if raw[:1] not in (" ", "\t"):
            in_fields = False
            if ":" not in raw:
                continue
            key, val = raw.split(":", 1)
            key = key.strip()
            if key in ("labels", "assignees"):
                meta[key] = _list(val)
            elif key in ("title", "milestone"):
                meta[key] = _clean(val)
            continue
        if in_fields and ":" in raw:
            key, val = raw.split(":", 1)
            meta["fields"][key.strip()] = _clean(val)

    meta["body"] = body.strip() + "\n"
    return meta


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", default="", help="TP4-01,TP4-02")
    args = ap.parse_args()

    if not CONFIG.exists():
        sys.exit("Falta tp4-issues/project.json")

    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    owner = cfg["project"]["owner"]
    pnum = str(cfg["project"]["number"])
    pid = cfg["project"]["id"]

    files = sorted(BASE.glob("TP4-*.md"))
    if args.only:
        wanted = {x.strip().upper() for x in args.only.split(",") if x.strip()}
        files = [f for f in files if f.stem.upper() in wanted]
    if not files:
        sys.exit("No encontré archivos TP4-*.md")

    state = json.loads(STATE.read_text(encoding="utf-8")) if STATE.exists() else {}
    errors = []

    for idx, path in enumerate(files, 1):
        key = path.stem
        try:
            meta = parse_issue(path)
            title = meta.get("title")
            if not title:
                raise ValueError("sin título")

            desconocidos = [a for a in meta["assignees"] if a not in PEOPLE]
            if desconocidos:
                raise ValueError(f"assignee desconocido: {desconocidos}")

            was_existing = key in state
            print(f"[{idx}/{len(files)}] {key} · {title}")

            if was_existing:
                url = state[key]["url"]
                print(f"    ya importada: {url}")
            else:
                tmp = Path(tempfile.gettempdir()) / f"{key}.body.md"
                tmp.write_text(meta["body"], encoding="utf-8")
                cmd = ["gh", "issue", "create", "--repo", REPO,
                       "--title", title, "--body-file", str(tmp)]
                for label in meta["labels"]:
                    cmd += ["--label", label]
                for person in meta["assignees"]:
                    cmd += ["--assignee", PEOPLE[person]]
                if meta.get("milestone"):
                    cmd += ["--milestone", meta["milestone"]]

                out = run(cmd, args.dry_run)
                if args.dry_run:
                    url = "https://github.com/DevEriik/framework-e-interoperabilidad-2026/issues/DRY"
                    print("    (dry-run) no se creó nada")
                else:
                    found = re.search(r"https://github\.com/\S+/issues/\d+", out)
                    if not found:
                        raise RuntimeError(f"No pude leer la URL de la issue:\n{out}")
                    url = found.group(0)
                    state[key] = {"number": int(url.rsplit("/", 1)[1]), "url": url}
                    STATE.write_text(json.dumps(state, indent=2, ensure_ascii=False),
                                     encoding="utf-8")
                    print(f"    creada: {url}")
                tmp.unlink(missing_ok=True)

            item_out = run(["gh", "project", "item-add", pnum, "--owner", owner,
                            "--url", url, "--format", "json"], args.dry_run)
            item_id = "DRY_ITEM" if args.dry_run else json.loads(item_out)["id"]

            fields = dict(meta["fields"])
            if not was_existing:
                fields.setdefault("Status", STATUS_INICIAL)

            for fname, fvalue in fields.items():
                fcfg = cfg["fields"].get(fname)
                if not fcfg:
                    print(f"    ! campo desconocido en el Project: {fname}")
                    continue
                if fcfg.get("type") == "date":
                    run(["gh", "project", "item-edit", "--project-id", pid,
                         "--id", item_id, "--field-id", fcfg["id"],
                         "--date", str(fvalue)], args.dry_run)
                else:
                    oid = fcfg["options"].get(str(fvalue))
                    if not oid:
                        print(f"    ! opción inválida para {fname}: {fvalue}")
                        continue
                    run(["gh", "project", "item-edit", "--project-id", pid,
                         "--id", item_id, "--field-id", fcfg["id"],
                         "--single-select-option-id", oid], args.dry_run)
            print("    campos listos")
        except Exception as exc:
            errors.append((key, str(exc)))
            print(f"    ERROR: {exc}")

    print("\nResumen")
    print(f"  procesadas: {len(files)}")
    print(f"  errores:    {len(errors)}")
    for key, msg in errors:
        print(f"   - {key}: {msg}")
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
