#!/usr/bin/env python3
"""
Holobox asset pipeline — photo optimization.

Camera originals are unusable as live kiosk textures. A 7039x5279 JPEG becomes a
149 MB RGBA texture on the GPU; sixteen of them exhaust VRAM and stall cold boot
well past the 5-second target.

This script produces the delivery set: longest edge clamped, EXIF stripped,
progressive JPEG, sRGB, auto-rotated to match the orientation tag.

Usage
    python3 scripts/optimize-photos.py
    python3 scripts/optimize-photos.py --max-edge 1600 --quality 82

Source of truth is projects/golf/Fotos (originals, committed).
Output is apps/holobox/public/assets/photos (delivery set, committed).

Requires Pillow:  pip install --break-system-packages Pillow
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is required.  Install with: pip install Pillow")

REPO_ROOT = Path(__file__).resolve().parent.parent
PHOTO_DIR = REPO_ROOT / "apps" / "holobox" / "public" / "assets" / "photos"

# 1600px longest edge is deliberate, not arbitrary.
# The canvas is 1080x1920. The largest a photo is ever drawn is the FocusView
# hero at 800x660. 1600 leaves 2x headroom for future full-bleed layouts while
# keeping the worst-case texture at ~10 MB of VRAM instead of ~169 MB.
DEFAULT_MAX_EDGE = 1600
DEFAULT_QUALITY = 82


def optimize(path: Path, max_edge: int, quality: int) -> tuple[int, int, int, int]:
    """Rewrite `path` in place. Returns (bytes_before, bytes_after, w, h)."""
    before = path.stat().st_size

    with Image.open(path) as img:
        # Honour the EXIF orientation tag, then discard the EXIF block entirely.
        # PixiJS ignores EXIF, so an unrotated portrait photo would render sideways.
        img = ImageOps.exif_transpose(img)
        img = img.convert("RGB")

        w, h = img.size
        if max(w, h) > max_edge:
            scale = max_edge / max(w, h)
            w, h = round(w * scale), round(h * scale)
            img = img.resize((w, h), Image.LANCZOS)

        img.save(
            path,
            format="JPEG",
            quality=quality,
            optimize=True,
            progressive=True,
            subsampling=1,  # 4:2:2 — retains more chroma detail than the 4:2:0 default
        )

    return before, path.stat().st_size, w, h


def main() -> int:
    parser = argparse.ArgumentParser(description="Optimize Holobox photo assets in place.")
    parser.add_argument("--max-edge", type=int, default=DEFAULT_MAX_EDGE)
    parser.add_argument("--quality", type=int, default=DEFAULT_QUALITY)
    parser.add_argument("--dir", type=Path, default=PHOTO_DIR)
    args = parser.parse_args()

    photos = sorted(p for p in args.dir.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"})
    if not photos:
        return sys.exit(f"No photos found in {args.dir}")

    total_before = total_after = 0
    vram_before = vram_after = 0

    for path in photos:
        with Image.open(path) as probe:
            ow, oh = probe.size
        before, after, w, h = optimize(path, args.max_edge, args.quality)

        total_before += before
        total_after += after
        vram_before += ow * oh * 4
        vram_after += w * h * 4

        print(f"  {path.name:<14} {ow}x{oh} -> {w}x{h}   {before / 1e6:6.2f} MB -> {after / 1e6:5.2f} MB")

    print()
    print(f"  disk   {total_before / 1e6:8.1f} MB -> {total_after / 1e6:6.1f} MB")
    print(f"  vram   {vram_before / 1e6:8.0f} MB -> {vram_after / 1e6:6.0f} MB  (RGBA8, all textures resident)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
