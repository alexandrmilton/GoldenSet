# -*- coding: utf-8 -*-
"""
Rebuild the app's image assets from the source art in docs/reference/.

Run after replacing any source image:

    python scripts/build-assets.py

Sources
  design-reference-home.jpg  the design mock-up — clay court band, icon texture
  ball-source.png            the tennis ball shot, on black with a glow

Everything it writes lives in assets/images/ and is committed.
"""
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

REF = 'docs/reference/design-reference-home.jpg'
BALL_SRC = 'docs/reference/ball-source.png'
OUT = 'assets/images'
FONT = 'node_modules/@expo-google-fonts/inter-tight/700Bold/InterTight_700Bold.ttf'

GOLD = (232, 200, 120)
CREAM = (245, 240, 234)
BASE = (20, 16, 13)

# The felt edge inside the source glow, measured by local texture variance.
BALL_CX, BALL_CY, BALL_R = 762, 478, 445
# 512 is exactly the largest on-screen use (168pt in the hero) at @3x.
BALL_SIZE = 512


def build_ball():
    im = Image.open(BALL_SRC).convert('RGB')
    crop = im.crop((BALL_CX - BALL_R, BALL_CY - BALL_R, BALL_CX + BALL_R, BALL_CY + BALL_R))

    mask = Image.new('L', crop.size, 0)
    ImageDraw.Draw(mask).ellipse((1, 1, crop.size[0] - 1, crop.size[1] - 1), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(1.4))

    # Bring out the individual fibres and calm the neon yellow of the render.
    out = crop.filter(ImageFilter.UnsharpMask(radius=2.2, percent=150, threshold=2))
    out = ImageEnhance.Color(out).enhance(0.86)
    out = ImageEnhance.Contrast(out).enhance(1.08)
    out.putalpha(mask)
    out = out.resize((BALL_SIZE, BALL_SIZE), Image.LANCZOS)
    # Felt texture compresses badly as truecolour PNG: ~600 KB against ~130 KB
    # quantised, with no banding visible at any size the app draws it.
    out.quantize(colors=192, method=Image.FASTOCTREE).save(OUT + '/ball.png', optimize=True)
    print('ball.png')


def build_hero_and_icon():
    im = Image.open(REF).convert('RGB')

    # Clay band from below the mock-up's own logo and tagline.
    im.crop((0, 292, 853, 528)).resize((1200, 332), Image.LANCZOS).save(
        OUT + '/hero-clay.jpg', quality=92)
    print('hero-clay.jpg')

    icon = im.crop((60, 330, 470, 520)).resize((1024, 1024), Image.LANCZOS)
    icon = Image.blend(icon, Image.new('RGB', icon.size, BASE), 0.55)
    d = ImageDraw.Draw(icon)
    f = ImageFont.truetype(FONT, 520)
    box = d.textbbox((0, 0), 'GS', font=f)
    d.text(((1024 - (box[2] - box[0])) / 2 - box[0], (1024 - (box[3] - box[1])) / 2 - box[1]),
           'GS', font=f, fill=GOLD)
    icon.save(OUT + '/icon.png')
    icon.resize((432, 432), Image.LANCZOS).save(OUT + '/android-icon-foreground.png')
    print('icon.png')

    Image.new('RGB', (48, 48), BASE).save(OUT + '/favicon.png')
    Image.new('RGB', (432, 432), BASE).save(OUT + '/android-icon-background.png')


def build_wordmark(width=1200, height=300, size=170, gap=34):
    """GOLDEN in gold, SET in cream — the splash lockup."""
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT, size)
    wa = d.textlength('GOLDEN', font=font)
    wb = d.textlength('SET', font=font)
    x = (width - (wa + gap + wb)) / 2
    box = font.getbbox('GOLDEN')
    y = (height - (box[3] - box[1])) / 2 - box[1]
    d.text((x, y), 'GOLDEN', font=font, fill=GOLD)
    d.text((x + wa + gap, y), 'SET', font=font, fill=CREAM)
    img.save(OUT + '/splash-icon.png')
    print('splash-icon.png')


if __name__ == '__main__':
    build_ball()
    build_hero_and_icon()
    build_wordmark()
    print('done')
