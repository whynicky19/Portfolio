"""Build the portfolio's OFL Silkscreen derivative (requires fonttools + brotli).
Use full bold M stems on the original pixel grid and open W diagonals.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen

ROOT = Path(__file__).resolve().parents[1]
font = TTFont(ROOT / 'fonts/Silkscreen-Bold.ttf')
# W retains its open diagonals. M uses the same 250-unit stems as I, T and N.
outline = [(0,7),(0,0),(2,0),(2,1),(3,1),(3,2),(4,2),(4,3),
           (5,3),(5,2),(6,2),(6,1),(7,1),(7,0),(9,0),(9,7),
           (7,7),(7,3),(6,3),(6,4),(5,4),(5,5),(4,5),(4,4),
           (3,4),(3,3),(2,3),(2,7)]
for char in 'MmWw':
    pen = TTGlyphPen(None)
    points = [(round(125 + x * 750 / 9), round((7-y if char in 'Mm' else y) * 625 / 7)) for x,y in outline]
    if char in 'Mm':
        # M needs a wider body to keep a readable notch AND full bold strokes.
        # Every step uses the family's original 125-unit pixel grid.
        bold_m = [(0,5),(0,0),(2,0),(2,1),(3,1),(3,2),(5,2),
                  (5,1),(6,1),(6,0),(8,0),(8,5),(6,5),(6,3),
                  (5,3),(5,4),(3,4),(3,3),(2,3),(2,5)]
        points = [(125 + x*125, (5-y)*125) for x,y in bold_m]
        font['hmtx'][font.getBestCmap()[ord(char)]] = (1250, 125)
    # Preserve clockwise outlines when reflecting M into W.
    if char in 'Ww': points.reverse()
    pen.moveTo(points[0])
    for point in points[1:]: pen.lineTo(point)
    pen.closePath()
    font['glyf'][font.getBestCmap()[ord(char)]] = pen.glyph()
for record in font['name'].names:
    replacements = {1:'Portfolio Pixel',2:'Bold',3:'PortfolioPixel-Bold-1.2',
                    4:'Portfolio Pixel Bold',6:'PortfolioPixel-Bold',16:'Portfolio Pixel',17:'Bold'}
    if record.nameID in replacements:
        record.string = replacements[record.nameID].encode(record.getEncoding())
font.flavor = 'woff2'
font.save(ROOT / 'fonts/PortfolioPixel-Bold.woff2')
