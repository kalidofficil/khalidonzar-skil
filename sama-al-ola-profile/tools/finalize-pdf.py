"""Finish the exported PDF: document metadata plus a clean bookmark tree.

Chromium builds bookmarks from heading text, which loses spaces at line breaks,
so the outline is written here instead. Tags, links and fonts are kept as they are.

Usage: python3 tools/finalize-pdf.py Sama-Al-Ola-Company-Profile.pdf
"""
import sys
from pypdf import PdfReader, PdfWriter

# (title, page number, children)
OUTLINE = [
    ("Cover", 1, []),
    ("About Us", 2, []),
    ("Contents", 3, []),
    ("Mission & Values", 4, []),
    ("Why Choose Us", 5, []),
    ("Our Services", 6, [
        ("A. General Contracting", 6),
        ("B. Interior Design & Fit-out", 7),
        ("C. Building Maintenance & Facility Management", 8),
        ("D. Central Air Conditioning Maintenance", 8),
        ("E. MEP Works", 8),
    ]),
    ("Villa Projects", 9, [
        ("Villa Mohammad Al Shehhi", 9),
        ("Villa Hussain Al Hosani", 10),
        ("Villa Qedaib Musabbeh Alkaabi", 11),
        ("Villa Mohammad Al Kaabi", 12),
        ("Villa Faisal Khajeh — MEP works", 13),
        ("Villa Adel Alkatheeri — MEP works", 13),
    ]),
    ("Interior Projects", 14, [
        ("Kissaki Japanese Restaurant", 15),
        ("Villa Qedaib Musabbeh Alkaabi — Interiors", 16),
        ("VIP Villa, Al Saadiyat", 17),
        ("Tamim Apartment", 18),
        ("Picasso Salon", 19),
        ("Le Méridien Hotel", 20),
        ("Hitachi Zosen Offices", 21),
        ("Lucky Office", 22),
        ("Game Room", 23),
    ]),
    ("Contact", 24, []),
]

path = sys.argv[1]
writer = PdfWriter(clone_from=PdfReader(path))

# drop Chromium's heading-based outline, then write the curated one
if "/Outlines" in writer.root_object:
    del writer.root_object["/Outlines"]
writer._root_object.pop("/Outlines", None)
for title, page, children in OUTLINE:
    parent = writer.add_outline_item(title, page - 1)
    for child_title, child_page in children:
        writer.add_outline_item(child_title, child_page - 1, parent=parent)

writer.add_metadata({
    "/Title": "Sama Al Ola General Contracting — Company Profile",
    "/Author": "Sama Al Ola General Contracting",
    "/Subject": "Company profile: general contracting, interior design & fit-out, building maintenance & "
                "facility management, central air conditioning maintenance and MEP works",
    "/Keywords": "Sama Al Ola, general contracting, interior fit-out, MEP, maintenance, Abu Dhabi, UAE",
})
writer.page_mode = "/UseOutlines"
with open(path, "wb") as f:
    writer.write(f)
print("finalised", path)
