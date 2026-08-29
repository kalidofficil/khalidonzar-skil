#!/usr/bin/env python3
"""Render scripts/og-cover.html to assets/og-cover.png (1200x630).

Headless Chromium clips the last few pixels of paint when the window is exactly
the document height, so the card is captured in a taller window and cropped back
to 1200x630 here. Needs no image library.

    python3 scripts/make-og-cover.py [--chromium /path/to/chromium]
"""
import argparse
import pathlib
import shutil
import struct
import subprocess
import sys
import zlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "scripts/og-cover.html"
TARGET = ROOT / "assets/og-cover.png"
WIDTH, HEIGHT, CAPTURE_HEIGHT = 1200, 630, 800

CANDIDATES = ["chromium", "chromium-browser", "google-chrome", "/opt/pw-browsers/chromium"]


def find_chromium(explicit):
    if explicit:
        return explicit
    for name in CANDIDATES:
        found = shutil.which(name) or (name if pathlib.Path(name).exists() else None)
        if found:
            return found
    sys.exit("No Chromium found. Pass --chromium /path/to/chromium.")


def read_png(path):
    """Decode a truecolour PNG into a list of unfiltered scanlines."""
    data = path.read_bytes()
    pos, idat = 8, b""
    while pos < len(data):
        length = struct.unpack(">I", data[pos:pos + 4])[0]
        kind, chunk = data[pos + 4:pos + 8], data[pos + 8:pos + 8 + length]
        if kind == b"IHDR":
            width, height, depth, colour = struct.unpack(">IIBB", chunk[:10])
        elif kind == b"IDAT":
            idat += chunk
        pos += 12 + length

    raw = zlib.decompress(idat)
    bpp = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[colour] * (depth // 8)
    stride = width * bpp
    rows, prev, i = [], bytearray(stride), 0

    for _ in range(height):
        filt = raw[i]; i += 1
        line = bytearray(raw[i:i + stride]); i += stride
        if filt == 1:
            for x in range(bpp, stride):
                line[x] = (line[x] + line[x - bpp]) & 255
        elif filt == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif filt == 3:
            for x in range(stride):
                left = line[x - bpp] if x >= bpp else 0
                line[x] = (line[x] + ((left + prev[x]) >> 1)) & 255
        elif filt == 4:
            for x in range(stride):
                a = line[x - bpp] if x >= bpp else 0
                b = prev[x]
                c = prev[x - bpp] if x >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pred = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pred) & 255
        rows.append(bytes(line))
        prev = line
    return width, depth, colour, rows


def write_png(path, width, depth, colour, rows):
    def chunk(kind, payload):
        return (struct.pack(">I", len(payload)) + kind + payload +
                struct.pack(">I", zlib.crc32(kind + payload) & 0xFFFFFFFF))

    body = b"".join(b"\x00" + row for row in rows)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, len(rows), depth, colour, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(body, 9))
        + chunk(b"IEND", b"")
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--chromium", help="path to a Chromium/Chrome binary")
    args = parser.parse_args()

    tall = ROOT / "assets/.og-cover-tall.png"
    subprocess.run([
        find_chromium(args.chromium), "--headless", "--disable-gpu", "--no-sandbox",
        "--hide-scrollbars", f"--window-size={WIDTH},{CAPTURE_HEIGHT}",
        "--virtual-time-budget=15000", f"--screenshot={tall}", SOURCE.as_uri(),
    ], check=True, capture_output=True)

    width, depth, colour, rows = read_png(tall)
    write_png(TARGET, width, depth, colour, rows[:HEIGHT])
    tall.unlink()
    print(f"wrote {TARGET.relative_to(ROOT)} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
