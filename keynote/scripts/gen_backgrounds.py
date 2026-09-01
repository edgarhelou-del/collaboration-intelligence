#!/usr/bin/env python3
"""Generate cinematic abstract backgrounds for the keynote deck (no stock photos)."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import math, random, os

W, H = 1920, 1080
OUTDIR = "/home/user/collaboration-intelligence/keynote/assets/images/bg"
os.makedirs(OUTDIR, exist_ok=True)

# Palette
BASE_TOP = np.array([9, 15, 13])       # near-black forest
BASE_BOT = np.array([20, 30, 24])      # dark moss
BASE_TOP_WARM = np.array([16, 13, 10]) # near-black warm (dawn variant)
BASE_BOT_WARM = np.array([34, 26, 16])
GOLD = np.array([196, 155, 74])
GOLD_LIGHT = np.array([224, 196, 140])
SAGE = np.array([120, 145, 122])
OFFWHITE = np.array([244, 240, 230])

def lerp(a, b, t):
    return a * (1 - t) + b * t

def vertical_gradient(top, bot, w=W, h=H):
    t = np.linspace(0, 1, h).reshape(h, 1, 1)
    row = lerp(top.reshape(1, 1, 3), bot.reshape(1, 1, 3), t)
    img = np.repeat(row, w, axis=1)
    return img

def radial_glow(cx, cy, radius, color, base, w=W, h=H, strength=0.9, power=2.0):
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / radius
    d = np.clip(d, 0, 1)
    t = (1 - d) ** power * strength
    t = t[..., None]
    return lerp(base, color.reshape(1, 1, 3), t)

def add_vignette(arr, strength=0.55):
    h, w, _ = arr.shape
    yy, xx = np.mgrid[0:h, 0:w]
    cx, cy = w / 2, h / 2
    d = np.sqrt(((xx - cx) / (w / 2)) ** 2 + ((yy - cy) / (h / 2)) ** 2)
    vig = 1 - strength * np.clip(d - 0.35, 0, 1) ** 1.6
    vig = np.clip(vig, 0, 1)[..., None]
    return arr * vig

def add_grain(arr, amount=6, seed=0):
    rng = np.random.default_rng(seed)
    noise = rng.normal(0, amount, arr.shape[:2])[..., None]
    return arr + noise

def to_img(arr):
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr, mode="RGB")

def draw_branching(draw, x, y, angle, length, depth, width, color_fn, rng, max_depth):
    if depth <= 0 or length < 4:
        return
    x2 = x + length * math.cos(angle)
    y2 = y + length * math.sin(angle)
    t = depth / max_depth
    col = color_fn(t)
    draw.line([(x, y), (x2, y2)], fill=col, width=max(1, int(width)))
    n = 2 if rng.random() < 0.85 else 1
    for _ in range(n):
        a2 = angle + rng.uniform(-0.55, 0.55)
        draw_branching(draw, x2, y2, a2, length * rng.uniform(0.68, 0.82), depth - 1,
                        width * 0.72, color_fn, rng, max_depth)

def network_overlay(w, h, seed=0, n_seeds=5, color=(196, 155, 74), alpha=70, max_depth=9):
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    rng = random.Random(seed)
    def color_fn(t):
        a = int(alpha * (0.35 + 0.65 * t))
        return (color[0], color[1], color[2], a)
    for i in range(n_seeds):
        x0 = rng.uniform(w * 0.05, w * 0.95)
        y0 = rng.uniform(h * 0.55, h * 1.05)
        ang = rng.uniform(-2.4, -0.7)
        draw_branching(draw, x0, y0, ang, rng.uniform(140, 220), max_depth, 3.2, color_fn, rng, max_depth)
    layer = layer.filter(ImageFilter.GaussianBlur(0.4))
    return layer

def particle_field(w, h, seed=0, n=140, color=(244, 240, 230), swirl=False, r_min=1.0, r_max=3.2, alpha=200):
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    rng = random.Random(seed)
    pts = []
    if swirl:
        cx, cy = w * 0.5, h * 0.46
        for i in range(n):
            t = i / n
            ang = t * math.pi * 7.5 + rng.uniform(-0.2, 0.2)
            rad = (1 - t) * min(w, h) * 0.42 * rng.uniform(0.85, 1.05)
            x = cx + rad * math.cos(ang)
            y = cy + rad * math.sin(ang) * 0.62
            pts.append((x, y))
    else:
        for i in range(n):
            pts.append((rng.uniform(0, w), rng.uniform(0, h)))
    for (x, y) in pts:
        r = rng.uniform(r_min, r_max)
        a = int(alpha * rng.uniform(0.4, 1.0))
        draw.ellipse([x - r, y - r, x + r, y + r], fill=(color[0], color[1], color[2], a))
    layer = layer.filter(ImageFilter.GaussianBlur(0.3))
    return layer

def rings_overlay(w, h, seed=0, n_rings=14, color=(196, 155, 74), alpha=70, cx=None, cy=None, jitter=6):
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    rng = random.Random(seed)
    cx = cx if cx is not None else w * 0.5
    cy = cy if cy is not None else h * 0.5
    max_r = min(w, h) * 0.46
    for i in range(1, n_rings + 1):
        r = max_r * (i / n_rings)
        a = int(alpha * (0.3 + 0.7 * (i / n_rings)))
        pts = []
        steps = 90
        for s in range(steps + 1):
            ang = 2 * math.pi * s / steps
            rr = r + rng.uniform(-jitter, jitter)
            pts.append((cx + rr * math.cos(ang), cy + rr * math.sin(ang) * 0.98))
        draw.line(pts, fill=(color[0], color[1], color[2], a), width=2)
    return layer

def strata_overlay(w, h, seed=0, n_layers=10, color=(196, 155, 74), alpha=55):
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    rng = random.Random(seed)
    band_h = h / n_layers
    for i in range(n_layers):
        y0 = i * band_h
        pts_top = []
        pts_bot = []
        steps = 24
        amp = rng.uniform(4, 14)
        for s in range(steps + 1):
            x = w * s / steps
            off = amp * math.sin(s * 0.7 + i) + rng.uniform(-3, 3)
            pts_top.append((x, y0 + off))
        a = int(alpha * (0.25 + 0.75 * (i / n_layers)))
        draw.line(pts_top, fill=(color[0], color[1], color[2], a), width=1)
    return layer

def contour_overlay(w, h, seed=0, n=16, color=(196, 155, 74), alpha=60):
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    rng = random.Random(seed)
    cx, cy = w * rng.uniform(0.3, 0.7), h * rng.uniform(0.75, 1.1)
    for i in range(1, n + 1):
        r = min(w, h) * 0.06 * i
        a = int(alpha * (1 - i / (n * 1.4)))
        if a <= 0:
            continue
        bbox = [cx - r, cy - r * 0.7, cx + r, cy + r * 0.7]
        draw.arc(bbox, start=180, end=360, fill=(color[0], color[1], color[2], a), width=2)
    return layer

def beam_overlay(w, h, seed=0, x=None, color=(244, 240, 230), alpha=60, width_top=40, width_bot=340):
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    x = x if x is not None else w * 0.5
    top = (x - width_top / 2, 0, x + width_top / 2, h * 0.05)
    poly = [(x - width_top / 2, 0), (x + width_top / 2, 0), (x + width_bot / 2, h), (x - width_bot / 2, h)]
    grad = Image.new("L", (1, h), 0)
    for y in range(h):
        grad.putpixel((0, y), int(alpha * (1 - y / h) ** 1.3))
    mask = grad.resize((w, h))
    solid = Image.new("RGBA", (w, h), (color[0], color[1], color[2], 255))
    poly_mask = Image.new("L", (w, h), 0)
    d2 = ImageDraw.Draw(poly_mask)
    d2.polygon(poly, fill=255)
    combined = Image.composite(solid, Image.new("RGBA", (w, h), (0, 0, 0, 0)), poly_mask)
    combined.putalpha(Image.composite(poly_mask, Image.new("L", (w, h), 0), poly_mask).point(lambda p: p))
    final = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    final.paste(combined, (0, 0), Image.composite(mask, Image.new("L", (w, h), 0), poly_mask))
    return final

def base_canvas(warm=False, glow=None, seed=0):
    top, bot = (BASE_TOP_WARM, BASE_BOT_WARM) if warm else (BASE_TOP, BASE_BOT)
    arr = vertical_gradient(top, bot)
    if glow:
        cx, cy, radius, color, strength = glow
        arr = radial_glow(cx, cy, radius, color, arr, strength=strength)
    arr = add_grain(arr, amount=4, seed=seed)
    arr = add_vignette(arr, strength=0.5)
    return arr

def compose(base_arr, overlays):
    img = to_img(base_arr).convert("RGBA")
    for ov in overlays:
        img = Image.alpha_composite(img, ov)
    return img.convert("RGB")

def save(img, name):
    path = os.path.join(OUTDIR, name)
    img.save(path, quality=92)
    print("saved", path)

# ---- Slide -> background spec ----
SPECS = {
    1:  dict(warm=True, glow=(W*0.5, H*0.32, 900, GOLD_LIGHT, 0.35), overlays=[("contour", dict(seed=1, n=18))]),
    2:  dict(warm=False, glow=(W*0.62, H*0.5, 650, OFFWHITE, 0.14), overlays=[]),
    3:  dict(warm=False, glow=(W*0.5, H*0.5, 1200, SAGE, 0.16), overlays=[("particles", dict(seed=3, n=90, swirl=False, alpha=70, r_min=0.6, r_max=1.6))]),
    4:  dict(warm=False, glow=(W*0.5, H*0.55, 500, GOLD, 0.22), overlays=[]),
    5:  dict(warm=True, glow=(W*0.5, H*0.35, 800, GOLD, 0.28), overlays=[]),
    6:  dict(warm=True, glow=(W*0.3, H*0.4, 650, GOLD, 0.24), overlays=[]),
    7:  dict(warm=False, glow=(W*0.5, H*0.5, 500, GOLD, 0.28), overlays=[]),
    8:  dict(warm=False, glow=(W*0.5, H*0.5, 300, OFFWHITE, 0.10), overlays=[]),
    9:  dict(warm=False, glow=None, overlays=[("beam", dict(seed=9, x=W*0.5, alpha=75))]),
    10: dict(warm=False, glow=(W*0.55, H*0.4, 900, SAGE, 0.16), overlays=[("strata", dict(seed=10, n_layers=9, alpha=55))]),
    11: dict(warm=False, glow=(W*0.5, H*0.3, 700, OFFWHITE, 0.10), overlays=[]),
    12: dict(warm=False, glow=(W*0.5, H*0.5, 450, GOLD, 0.26), overlays=[("rings", dict(seed=12, n_rings=6, alpha=90))]),
    13: dict(warm=True, glow=(W*0.5, H*0.55, 900, GOLD, 0.18), overlays=[("strata", dict(seed=13, n_layers=14, alpha=60))]),
    14: dict(warm=False, glow=(W*0.4, H*0.6, 700, GOLD_LIGHT, 0.30), overlays=[("network", dict(seed=14, n_seeds=6, alpha=95, max_depth=10))]),
    15: dict(warm=False, glow=(W*0.5, H*0.7, 900, GOLD, 0.26), overlays=[("network", dict(seed=15, n_seeds=9, alpha=110, max_depth=11))]),
    16: dict(warm=False, glow=(W*0.5, H*0.42, 750, GOLD_LIGHT, 0.24), overlays=[("particles", dict(seed=16, n=260, swirl=False, alpha=190, r_min=1.2, r_max=3.4))]),
    17: dict(warm=False, glow=(W*0.5, H*0.46, 900, OFFWHITE, 0.14), overlays=[("particles", dict(seed=17, n=320, swirl=True, alpha=210, r_min=1.0, r_max=2.6))]),
    18: dict(warm=False, glow=(W*0.5, H*0.5, 650, SAGE, 0.28), overlays=[("particles", dict(seed=18, n=70, swirl=False, alpha=140, r_min=2.5, r_max=6.5))]),
    19: dict(warm=True, glow=(W*0.5, H*0.75, 1000, GOLD, 0.28), overlays=[("rings", dict(seed=19, n_rings=10, alpha=55))]),
    20: dict(warm=False, glow=(W*0.5, H*0.45, 700, OFFWHITE, 0.10), overlays=[("rings", dict(seed=20, n_rings=4, alpha=60, jitter=14))]),
    21: dict(warm=False, glow=(W*0.5, H*0.4, 550, GOLD, 0.20), overlays=[]),
    22: dict(warm=False, glow=(W*0.5, H*0.5, 900, SAGE, 0.16), overlays=[("particles", dict(seed=22, n=60, swirl=False, alpha=90, r_min=1.5, r_max=4))]),
    23: dict(warm=True, glow=(W*0.4, H*0.35, 700, GOLD, 0.24), overlays=[("strata", dict(seed=23, n_layers=6, alpha=45))]),
    24: dict(warm=False, glow=(W*0.5, H*0.5, 600, GOLD_LIGHT, 0.18), overlays=[]),
    25: dict(warm=False, glow=(W*0.5, H*0.42, 500, OFFWHITE, 0.12), overlays=[("network", dict(seed=25, n_seeds=3, alpha=50, max_depth=7))]),
    26: dict(warm=False, glow=(W*0.5, H*0.5, 650, GOLD, 0.22), overlays=[]),
    27: dict(warm=False, glow=(W*0.5, H*0.5, 650, SAGE, 0.20), overlays=[]),
    28: dict(warm=False, glow=(W*0.5, H*0.4, 700, OFFWHITE, 0.12), overlays=[("particles", dict(seed=28, n=7, swirl=False, alpha=230, r_min=6, r_max=14))]),
    29: dict(warm=False, glow=(W*0.5, H*0.5, 1000, GOLD, 0.14), overlays=[("particles", dict(seed=29, n=48, swirl=False, alpha=220, r_min=3, r_max=7))]),
    30: dict(warm=False, glow=(W*0.5, H*0.5, 700, GOLD_LIGHT, 0.22), overlays=[("network", dict(seed=30, n_seeds=4, alpha=90, max_depth=8))]),
    31: dict(warm=False, glow=(W*0.42, H*0.5, 500, GOLD, 0.26), overlays=[]),
    32: dict(warm=True, glow=(W*0.5, H*0.5, 800, GOLD, 0.22), overlays=[("rings", dict(seed=32, n_rings=16, alpha=85))]),
    33: dict(warm=False, glow=None, overlays=[("beam", dict(seed=33, x=W*0.46, alpha=70, width_bot=120))]),
    34: dict(warm=False, glow=(W*0.5, H*0.5, 700, SAGE, 0.18), overlays=[]),
    35: dict(warm=True, glow=(W*0.5, H*0.62, 1100, GOLD_LIGHT, 0.34), overlays=[("network", dict(seed=35, n_seeds=5, alpha=55, max_depth=9))]),
}

def build_overlay(kind, params):
    if kind == "network":
        return network_overlay(W, H, color=tuple(GOLD), **params)
    if kind == "particles":
        return particle_field(W, H, color=tuple(OFFWHITE), **params)
    if kind == "rings":
        return rings_overlay(W, H, color=tuple(GOLD), **params)
    if kind == "strata":
        return strata_overlay(W, H, color=tuple(GOLD), **params)
    if kind == "contour":
        return contour_overlay(W, H, color=tuple(GOLD), **params)
    if kind == "beam":
        return beam_overlay(W, H, **params)
    raise ValueError(kind)

def main():
    for n, spec in SPECS.items():
        base = base_canvas(warm=spec.get("warm", False), glow=spec.get("glow"), seed=n)
        overlays = [build_overlay(k, p) for (k, p) in spec.get("overlays", [])]
        img = compose(base, overlays)
        save(img, f"slide{n:02d}.jpg")

if __name__ == "__main__":
    main()
