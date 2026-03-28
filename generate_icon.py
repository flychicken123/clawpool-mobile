from PIL import Image, ImageDraw
import math

size = 1024
img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Background: rounded square (iOS style), dark
def rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.ellipse([x0, y0, x0 + radius*2, y0 + radius*2], fill=fill)
    draw.ellipse([x1 - radius*2, y0, x1, y0 + radius*2], fill=fill)
    draw.ellipse([x0, y1 - radius*2, x0 + radius*2, y1], fill=fill)
    draw.ellipse([x1 - radius*2, y1 - radius*2, x1, y1], fill=fill)

# Dark background
rounded_rect(draw, [0, 0, size, size], 180, (15, 15, 30, 255))

# Red glossy sphere
cx, cy, r = 512, 520, 360

# Shadow
for i in range(40):
    alpha = int(80 * (1 - i/40))
    draw.ellipse([cx - r - i + 20, cy - r - i + 60, cx + r + i + 20, cy + r + i + 60], 
                 fill=(0, 0, 0, alpha))

# Main sphere gradient (simulate with concentric ellipses)
for i in range(r, 0, -1):
    t = 1 - (i / r)
    red = int(220 + 35 * t)
    green = int(20 * (1 - t))
    blue = int(20 * (1 - t))
    draw.ellipse([cx - i, cy - i, cx + i, cy + i], fill=(red, green, blue, 255))

# Highlight (top-left glossy white)
highlight_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
hd = ImageDraw.Draw(highlight_img)
hx, hy, hr = 430, 390, 140
for i in range(hr, 0, -1):
    t = 1 - (i / hr)
    alpha = int(180 * t)
    hd.ellipse([hx - i, hy - i, hx + i, hy + i], fill=(255, 255, 255, alpha))

img = Image.alpha_composite(img, highlight_img)

# Save
img.save("assets/icon.png")
print("icon.png saved (1024x1024)")

# Also generate splash icon (same but slightly smaller sphere)
splash = Image.new("RGBA", (size, size), (15, 15, 30, 255))
draw2 = ImageDraw.Draw(splash)
r2 = 280
for i in range(r2, 0, -1):
    t = 1 - (i / r2)
    red = int(220 + 35 * t)
    green = int(20 * (1 - t))
    blue = int(20 * (1 - t))
    draw2.ellipse([512 - i, 512 - i, 512 + i, 512 + i], fill=(red, green, blue, 255))

highlight2 = Image.new("RGBA", (size, size), (0, 0, 0, 0))
hd2 = ImageDraw.Draw(highlight2)
for i in range(100, 0, -1):
    t = 1 - (i / 100)
    alpha = int(160 * t)
    hd2.ellipse([440 - i, 420 - i, 440 + i, 420 + i], fill=(255, 255, 255, alpha))

splash = Image.alpha_composite(splash, highlight2)
splash.save("assets/splash-icon.png")
print("splash-icon.png saved")
