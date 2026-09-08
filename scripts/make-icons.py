#!/usr/bin/env python3
"""Rasterize Clear Reply toolbar icons as RGBA PNGs."""

from __future__ import annotations

import struct
import zlib
from pathlib import Path

TEAL = (15, 107, 92, 255)
WHITE = (255, 253, 248, 255)
CLEAR = (0, 0, 0, 0)


def png(width: int, height: int, rgba: bytes) -> bytes:
    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    raw = b"".join(b"\x00" + rgba[y * width * 4 : (y + 1) * width * 4] for y in range(height))
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def blend(dst: list[int], i: int, color: tuple[int, int, int, int], cover: float) -> None:
    if cover <= 0:
        return
    cover = min(1.0, cover)
    sr, sg, sb, sa = color
    src_a = (sa / 255.0) * cover
    dr, dg, db, da = dst[i], dst[i + 1], dst[i + 2], dst[i + 3] / 255.0
    out_a = src_a + da * (1 - src_a)
    if out_a == 0:
        dst[i : i + 4] = [0, 0, 0, 0]
        return
    dst[i] = round((sr * src_a + dr * da * (1 - src_a)) / out_a)
    dst[i + 1] = round((sg * src_a + dg * da * (1 - src_a)) / out_a)
    dst[i + 2] = round((sb * src_a + db * da * (1 - src_a)) / out_a)
    dst[i + 3] = round(out_a * 255)


def fill_round_rect(
    px: list[int],
    size: int,
    x0: float,
    y0: float,
    x1: float,
    y1: float,
    radius: float,
    color: tuple[int, int, int, int],
) -> None:
    for y in range(size):
        cy = y + 0.5
        for x in range(size):
            cx = x + 0.5
            dx = 0.0 if x0 + radius <= cx <= x1 - radius else min(abs(cx - (x0 + radius)), abs(cx - (x1 - radius)))
            dy = 0.0 if y0 + radius <= cy <= y1 - radius else min(abs(cy - (y0 + radius)), abs(cy - (y1 - radius)))
            inside_x = x0 <= cx <= x1
            inside_y = y0 <= cy <= y1
            if not inside_x or not inside_y:
                continue
            in_corner = (cx < x0 + radius or cx > x1 - radius) and (cy < y0 + radius or cy > y1 - radius)
            if in_corner:
                dist = (dx * dx + dy * dy) ** 0.5
                cover = max(0.0, min(1.0, radius - dist + 0.5))
            else:
                cover = 1.0
            blend(px, (y * size + x) * 4, color, cover)


def fill_circle(px: list[int], size: int, cx: float, cy: float, r: float, color) -> None:
    for y in range(size):
        for x in range(size):
            dist = ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2) ** 0.5
            cover = max(0.0, min(1.0, r - dist + 0.5))
            blend(px, (y * size + x) * 4, color, cover)


def fill_triangle(
    px: list[int],
    size: int,
    a: tuple[float, float],
    b: tuple[float, float],
    c: tuple[float, float],
    color,
) -> None:
    def edge(p, q, r):
        return (r[0] - p[0]) * (q[1] - p[1]) - (q[0] - p[0]) * (r[1] - p[1])

    area = edge(a, b, c)
    if area == 0:
        return
    minx = max(0, int(min(a[0], b[0], c[0]) - 1))
    maxx = min(size - 1, int(max(a[0], b[0], c[0]) + 1))
    miny = max(0, int(min(a[1], b[1], c[1]) - 1))
    maxy = min(size - 1, int(max(a[1], b[1], c[1]) + 1))
    for y in range(miny, maxy + 1):
        for x in range(minx, maxx + 1):
            p = (x + 0.5, y + 0.5)
            w0 = edge(b, c, p) / area
            w1 = edge(c, a, p) / area
            w2 = edge(a, b, p) / area
            if w0 >= 0 and w1 >= 0 and w2 >= 0:
                blend(px, (y * size + x) * 4, color, 1.0)


def stroke_line(
    px: list[int],
    size: int,
    x0: float,
    y0: float,
    x1: float,
    y1: float,
    width: float,
    color,
) -> None:
    dx = x1 - x0
    dy = y1 - y0
    length = max((dx * dx + dy * dy) ** 0.5, 1e-6)
    ux, uy = dx / length, dy / length
    vx, vy = -uy, ux
    hw = width / 2
    a = (x0 + vx * hw, y0 + vy * hw)
    b = (x0 - vx * hw, y0 - vy * hw)
    c = (x1 - vx * hw, y1 - vy * hw)
    d = (x1 + vx * hw, y1 + vy * hw)
    fill_triangle(px, size, a, b, c, color)
    fill_triangle(px, size, a, c, d, color)
    fill_circle(px, size, x0, y0, hw, color)
    fill_circle(px, size, x1, y1, hw, color)


def draw(size: int) -> bytes:
    px = [0] * (size * size * 4)
    s = float(size)
    pad = s * 0.04
    fill_round_rect(px, size, pad, pad, s - pad, s - pad, s * 0.22, TEAL)
    bx0, by0, bx1, by1 = s * 0.20, s * 0.18, s * 0.80, s * 0.66
    fill_round_rect(px, size, bx0, by0, bx1, by1, s * 0.10, WHITE)
    fill_triangle(
        px,
        size,
        (s * 0.42, by1 - 1),
        (s * 0.58, by1 - 1),
        (s * 0.50, s * 0.80),
        WHITE,
    )
    w = max(s * 0.07, 1.6)
    stroke_line(px, size, s * 0.34, s * 0.44, s * 0.46, s * 0.55, w, TEAL)
    stroke_line(px, size, s * 0.46, s * 0.55, s * 0.68, s * 0.34, w, TEAL)
    return png(size, size, bytes(px))


def main() -> None:
    out = Path(__file__).resolve().parents[1] / "public" / "icons"
    out.mkdir(parents=True, exist_ok=True)
    for size in (16, 32, 48, 128):
        (out / f"{size}.png").write_bytes(draw(size))


if __name__ == "__main__":
    main()
