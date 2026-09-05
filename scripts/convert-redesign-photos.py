#!/usr/bin/env python3
"""
One-off: relocate the redesign photo set into public/ as web-optimized WebP.

Source: listworx-redesign-photos/*.png  (AI stock, ~2 MB each)
Dest:   public/images/redesign/*.webp    (max 1600px on the long edge, q82)

Re-runnable — overwrites the dest files. The source folder is left untouched
(it is gitignored) so we always have the originals to re-crop from.
"""
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "listworx-redesign-photos"
DST = ROOT / "public" / "images" / "redesign"
MAX_EDGE = 1600
QUALITY = 82

def main() -> int:
    if not SRC.is_dir():
        print(f"source folder not found: {SRC}", file=sys.stderr)
        return 1
    DST.mkdir(parents=True, exist_ok=True)

    pngs = sorted(SRC.glob("*.png"))
    if not pngs:
        print("no PNGs to convert", file=sys.stderr)
        return 1

    total_in = total_out = 0
    for p in pngs:
        with Image.open(p) as im:
            im = im.convert("RGB")
            w, h = im.size
            scale = min(1.0, MAX_EDGE / max(w, h))
            if scale < 1.0:
                im = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
            out = DST / (p.stem + ".webp")
            im.save(out, "WEBP", quality=QUALITY, method=6)
        size_in, size_out = p.stat().st_size, out.stat().st_size
        total_in += size_in
        total_out += size_out
        print(f"  {p.name:52s} {size_in/1024:7.0f}K -> {out.name:48s} {size_out/1024:6.0f}K  ({im.size[0]}x{im.size[1]})")

    print(f"\n{len(pngs)} files: {total_in/1024/1024:.1f} MB -> {total_out/1024/1024:.1f} MB")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
