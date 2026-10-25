"""Create static font instances from the variable fonts so Chromium embeds them as
real TrueType fonts in the PDF (variable fonts get flattened to Type 3 glyph outlines).

The static files are already in assets/fonts; this is only needed to add another weight.
The variable sources are not committed. Download them from github.com/google/fonts
(ofl/notoserifdisplay and ofl/jost) into assets/fonts/ as NotoSerifDisplay-VF.ttf,
NotoSerifDisplay-Italic-VF.ttf, Jost-VF.ttf and Jost-Italic-VF.ttf, then run:

    pip install fonttools
    python3 tools/make_static_fonts.py
"""
import os
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "..", "assets", "fonts")

JOBS = [
    # (variable source, output name, axis locations, family name, style name)
    ("NotoSerifDisplay-VF.ttf", "NotoSerifDisplay-Regular.ttf", {"wght": 400, "wdth": 100}, "SAO Display", "Regular"),
    ("NotoSerifDisplay-VF.ttf", "NotoSerifDisplay-Medium.ttf", {"wght": 500, "wdth": 100}, "SAO Display", "Medium"),
    ("NotoSerifDisplay-Italic-VF.ttf", "NotoSerifDisplay-Italic.ttf", {"wght": 400, "wdth": 100}, "SAO Display", "Italic"),
    ("Jost-VF.ttf", "Jost-Regular.ttf", {"wght": 400}, "SAO Sans", "Regular"),
    ("Jost-VF.ttf", "Jost-Medium.ttf", {"wght": 500}, "SAO Sans", "Medium"),
    ("Jost-VF.ttf", "Jost-SemiBold.ttf", {"wght": 600}, "SAO Sans", "SemiBold"),
    ("Jost-Italic-VF.ttf", "Jost-Italic.ttf", {"wght": 400}, "SAO Sans", "Italic"),
]

for src, out, loc, fam, style in JOBS:
    vf = TTFont(os.path.join(FONTS, src))
    axes = {a.axisTag for a in vf["fvar"].axes}
    st = instancer.instantiateVariableFont(vf, {k: v for k, v in loc.items() if k in axes}, updateFontNames=False)
    # proper names so PDF/preflight reports list each weight correctly
    base = "Noto Serif Display" if "Noto" in src else "Jost"
    ps = base.replace(" ", "") + "-" + style.replace(" ", "")
    name = st["name"]
    for rec in list(name.names):
        if rec.nameID in (1, 2, 3, 4, 6, 16, 17, 21, 22, 25):
            name.removeNames(nameID=rec.nameID)
    for nid, val in ((1, base if style in ("Regular", "Italic") else f"{base} {style}"),
                     (2, style if style in ("Regular", "Italic") else "Regular"),
                     (3, f"{ps};instance"), (4, f"{base} {style}"), (6, ps),
                     (16, base), (17, style)):
        name.setName(val, nid, 3, 1, 0x409)
    st.save(os.path.join(FONTS, out))
    print(f"{out:34s} {os.path.getsize(os.path.join(FONTS, out)) // 1024:5d} KB  {loc}")
