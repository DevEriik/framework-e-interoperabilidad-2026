#!/usr/bin/env python3
"""Corrige los campos de issues que ya existen en el Project."""
import argparse
import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE))

from import_issues import CONFIG, STATUS_INICIAL, parse_issue, run  # noqa: E402


def find_item_id(owner, pnum, number):
    out = run(["gh", "project", "item-list", str(pnum), "--owner", owner,
               "--format", "json", "--limit", "1000"])
    for item in json.loads(out).get("items", []):
        content = item.get("content") or {}
        if content.get("number") == number:
            return item["id"]
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", required=True, help="TP4-15,TP4-20,TP4-21")
    args = ap.parse_args()

    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    owner = cfg["project"]["owner"]
    pnum = str(cfg["project"]["number"])
    pid = cfg["project"]["id"]

    state = json.loads((BASE / "imported.json").read_text(encoding="utf-8"))
    claves = [k.strip() for k in args.only.split(",") if k.strip()]
    errores = []

    for key in claves:
        try:
            if key not in state:
                raise RuntimeError("no está en imported.json")
            number = state[key]["number"]
            meta = parse_issue(BASE / f"{key}.md")

            item_id = find_item_id(owner, pnum, number)
            if not item_id:
                raise RuntimeError("no encontré el ítem en el Project")
            print(f"{key} · issue #{number} · item {item_id}")

            fields = dict(meta["fields"])
            fields["Status"] = STATUS_INICIAL

            for fname, fvalue in fields.items():
                fcfg = cfg["fields"].get(fname)
                if not fcfg:
                    print(f"  ! campo desconocido: {fname}")
                    continue
                if fcfg.get("type") == "date":
                    run(["gh", "project", "item-edit", "--project-id", pid,
                         "--id", item_id, "--field-id", fcfg["id"],
                         "--date", str(fvalue)])
                else:
                    oid = fcfg["options"].get(str(fvalue))
                    if not oid:
                        print(f"  ! opción inválida {fname}: {fvalue}")
                        continue
                    run(["gh", "project", "item-edit", "--project-id", pid,
                         "--id", item_id, "--field-id", fcfg["id"],
                         "--single-select-option-id", oid])
            print("  campos corregidos")
        except Exception as exc:
            errores.append((key, str(exc)))
            print(f"  ERROR: {exc}")

    print(f"\ncorregidas: {len(claves) - len(errores)} · errores: {len(errores)}")
    if errores:
        sys.exit(1)


if __name__ == "__main__":
    main()
