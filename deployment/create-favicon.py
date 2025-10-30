#!/usr/bin/env python3
"""
Create a simple favicon for OpenRole
"""

from PIL import Image, ImageDraw, ImageFont
import io
import base64

def create_favicon():
    # Create 32x32 image with transparency
    size = 32
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw circle background with teal color
    margin = 2
    circle_bbox = [margin, margin, size - margin, size - margin]
    draw.ellipse(circle_bbox, fill=(20, 184, 166, 255), outline=(15, 118, 110, 255), width=1)
    
    # Draw letter 'O' in white
    try:
        # Try to use a nice font
        font_size = 18
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Get text size and center it
    text = 'O'
    text_bbox = draw.textbbox((0, 0), text, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2 - 1  # Slight adjustment for better centering
    
    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)
    
    # Save as PNG
    img.save('/home/hyperdude/openrole/deployment/favicon.png', 'PNG')
    
    # Create 16x16 version
    img_16 = img.resize((16, 16), Image.Resampling.LANCZOS)
    img_16.save('/home/hyperdude/openrole/deployment/favicon-16x16.png', 'PNG')
    
    # Create ICO file with multiple sizes
    img.save('/home/hyperdude/openrole/deployment/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32)])
    
    print("Favicon files created:")
    print("- favicon.ico (16x16 and 32x32)")
    print("- favicon.png (32x32)")
    print("- favicon-16x16.png (16x16)")

if __name__ == "__main__":
    create_favicon()