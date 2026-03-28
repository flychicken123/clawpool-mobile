from PIL import Image

# Generate splash-icon from icon.png (centered, smaller, on dark bg)
icon = Image.open("assets/icon.png").convert("RGBA")

size = 1024
splash = Image.new("RGBA", (size, size), (15, 15, 30, 255))

# Resize icon to 600x600 and center it
icon_resized = icon.resize((600, 600), Image.LANCZOS)
offset = ((size - 600) // 2, (size - 600) // 2)
splash.paste(icon_resized, offset, icon_resized)

splash.save("assets/splash-icon.png")
print("splash-icon.png saved")
