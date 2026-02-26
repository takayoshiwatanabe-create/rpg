#!/usr/bin/env python3
"""Auto-generated asset script for シュクダイ・クエスト 〜勇者の宿題なぎ倒しRPG〜 (theme: Warm Daily)"""
from PIL import Image, ImageDraw, ImageFont
import os

ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
os.makedirs(ASSETS_DIR, exist_ok=True)

def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

BG0 = hex_to_rgb("#FFFBEB")
BG1 = hex_to_rgb("#FEF3C7")
PRIMARY = hex_to_rgb("#F97316")
ACCENT = hex_to_rgb("#F59E0B")
TEXT = hex_to_rgb("#292524")
WHITE = (255, 255, 255)
IS_DARK = False

def gradient(draw, w, h, c1, c2):
    for y in range(h):
        r = int(c1[0] + (c2[0] - c1[0]) * y / h)
        g = int(c1[1] + (c2[1] - c1[1]) * y / h)
        b = int(c1[2] + (c2[2] - c1[2]) * y / h)
        draw.line([(0, y), (w, y)], fill=(r, g, b))

def try_font(size):
    for name in ["/System/Library/Fonts/HelveticaNeue.ttc",
                 "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"]:
        try:
            return ImageFont.truetype(name, size)
        except (OSError, IOError):
            pass
    return ImageFont.load_default()

# ── App Icon (1024x1024) ──
icon = Image.new("RGB", (1024, 1024))
d = ImageDraw.Draw(icon)
gradient(d, 1024, 1024, BG0, BG1)

# Center circle
d.ellipse([312, 312, 712, 712], fill=PRIMARY)
# App initial
font_big = try_font(200)
initial = "シ"
bbox = d.textbbox((0, 0), initial, font=font_big)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
d.text(((1024 - tw) // 2, (1024 - th) // 2 - 20), initial, fill=WHITE, font=font_big)

# Accent ring
d.ellipse([292, 292, 732, 732], outline=ACCENT, width=8)

icon.save(os.path.join(ASSETS_DIR, "app_icon.png"))

# ── Splash (1284x2778) ──
splash = Image.new("RGB", (1284, 2778))
d = ImageDraw.Draw(splash)
gradient(d, 1284, 2778, BG0, BG1)
font_splash = try_font(80)
name = "シュクダイ・クエスト 〜勇者の宿題なぎ倒しRPG〜"
bbox = d.textbbox((0, 0), name, font=font_splash)
tw = bbox[2] - bbox[0]
d.text(((1284 - tw) // 2, 1300), name, fill=PRIMARY, font=font_splash)
splash.save(os.path.join(ASSETS_DIR, "splash.png"))

# ── Screenshots (1284x2778) ──
captions = ["今日やることがひと目でわかる","家族みんなで使えるシンプル設計","習慣づけを楽しくサポート","生活をスマートに整理しよう"]
tagline_text = "毎日をもっとかんたん、もっと楽しく。"

for i, caption in enumerate(captions[:4]):
    img = Image.new("RGB", (1284, 2778))
    d = ImageDraw.Draw(img)
    gradient(d, 1284, 2778, BG0, BG1)

    # Phone frame (mock)
    frame_x, frame_y = 142, 600
    frame_w, frame_h = 1000, 1800
    d.rounded_rectangle([frame_x, frame_y, frame_x + frame_w, frame_y + frame_h],
                        radius=40, fill=WHITE if not IS_DARK else (30, 30, 50),
                        outline=(200, 200, 200) if not IS_DARK else (80, 80, 120), width=3)

    # Caption at top
    font_cap = try_font(64)
    bbox = d.textbbox((0, 0), caption, font=font_cap)
    tw = bbox[2] - bbox[0]
    cap_color = WHITE if IS_DARK else TEXT
    d.text(((1284 - tw) // 2, 200), caption, fill=cap_color, font=font_cap)

    # Tagline at bottom
    if tagline_text:
        font_tag = try_font(36)
        bbox = d.textbbox((0, 0), tagline_text, font=font_tag)
        tw = bbox[2] - bbox[0]
        d.text(((1284 - tw) // 2, 2550), tagline_text, fill=ACCENT, font=font_tag)

    img.save(os.path.join(ASSETS_DIR, f"screenshot_{str(i+1).zfill(2)}.png"))

print(f"Generated: app_icon.png, splash.png, {len(captions[:4])} screenshots")
