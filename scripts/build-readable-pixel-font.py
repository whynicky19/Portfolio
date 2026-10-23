"""Build the portfolio's OFL Silkscreen derivative (requires fonttools + brotli).
Keep original metrics; distinguish M/W with open, stepped diagonals.
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
        # Full bold stems and a 250-unit diagonal band, with a stepped notch.
        bold_m = [(125,625),(125,0),(375,0),(375,125),(437.5,125),
                  (437.5,187.5),(562.5,187.5),(562.5,125),(625,125),
                  (625,0),(875,0),(875,625),(625,625),(625,375),
                  (562.5,375),(562.5,437.5),(437.5,437.5),(437.5,375),
                  (375,375),(375,625)]
        points = [(round(x), round(625-y)) for x,y in bold_m]
    # Preserve clockwise outlines when reflecting M into W.
    if char in 'Ww': points.reverse()
    pen.moveTo(points[0])
    for point in points[1:]: pen.lineTo(point)
    pen.closePath()
    font['glyf'][font.getBestCmap()[ord(char)]] = pen.glyph()
for record in font['name'].names:
    replacements = {1:'Portfolio Pixel',2:'Bold',3:'PortfolioPixel-Bold-1.1',
                    4:'Portfolio Pixel Bold',6:'PortfolioPixel-Bold',16:'Portfolio Pixel',17:'Bold'}
    if record.nameID in replacements:
        record.string = replacements[record.nameID].encode(record.getEncoding())
font.flavor = 'woff2'
font.save(ROOT / 'fonts/PortfolioPixel-Bold.woff2')
