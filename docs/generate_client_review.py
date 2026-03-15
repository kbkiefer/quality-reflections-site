#!/usr/bin/env python3
"""
Quality Reflections Glasswork — Client Review Document
Generates a branded PDF for client review with notes areas.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.pdfgen import canvas
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.lib.enums import TA_LEFT, TA_CENTER
import textwrap
import os

# Brand colors
NAVY = HexColor("#012A89")
NAVY_DARK = HexColor("#011B5A")
NAVY_BLACK = HexColor("#010E2F")
GLASS_BLUE = HexColor("#4A90D9")
STEEL = HexColor("#8A919A")
SILVER = HexColor("#D1D5DB")
LIGHT_BG = HexColor("#F8F9FA")
WHITE = white
NOTES_BG = HexColor("#FFFDE7")
NOTES_BORDER = HexColor("#E0D68A")
DIVIDER = HexColor("#E2E8F0")

WIDTH, HEIGHT = letter
MARGIN = 0.75 * inch
CONTENT_W = WIDTH - 2 * MARGIN

# Track page number
page_count = [0]


def draw_header_bar(c, y, sheet_num, total_sheets=12):
    """Draw the top bar with company name and sheet info."""
    c.setFillColor(NAVY_BLACK)
    c.rect(0, y, WIDTH, 28, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN, y + 10, "QUALITY REFLECTIONS GLASSWORK")
    c.setFont("Helvetica", 7)
    c.setFillColor(GLASS_BLUE)
    c.drawRightString(WIDTH - MARGIN, y + 10, f"SHEET {sheet_num:02d} OF {total_sheets:02d}")


def draw_footer(c):
    """Draw footer with page number and revision info."""
    y = 30
    c.setStrokeColor(DIVIDER)
    c.setLineWidth(0.5)
    c.line(MARGIN, y + 15, WIDTH - MARGIN, y + 15)
    c.setFont("Helvetica", 6)
    c.setFillColor(STEEL)
    c.drawString(MARGIN, y, "QR-CLIENT-REVIEW-2026-03  |  REV 01  |  CONFIDENTIAL")
    c.drawRightString(WIDTH - MARGIN, y, f"Page {page_count[0]}")


def new_page(c, sheet_num, total_sheets=12):
    """Start a new page with header and footer."""
    if page_count[0] > 0:
        draw_footer(c)
        c.showPage()
    page_count[0] += 1
    draw_header_bar(c, HEIGHT - 28, sheet_num, total_sheets)
    return HEIGHT - 28 - 20  # return Y position below header


def draw_section_title(c, y, number, title):
    """Draw a section title with number badge."""
    # Number badge
    badge_size = 22
    c.setFillColor(NAVY)
    c.rect(MARGIN, y - badge_size + 4, badge_size, badge_size, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(MARGIN + badge_size / 2, y - badge_size + 11, f"{number:02d}")

    # Title text
    c.setFillColor(NAVY_BLACK)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(MARGIN + badge_size + 10, y - badge_size + 8, title.upper())

    # Underline
    c.setStrokeColor(GLASS_BLUE)
    c.setLineWidth(2)
    c.line(MARGIN, y - badge_size - 2, WIDTH - MARGIN, y - badge_size - 2)

    return y - badge_size - 16


def draw_notes_box(c, y, height=80, label="CLIENT NOTES"):
    """Draw a notes area for client feedback."""
    box_y = y - height
    # Background
    c.setFillColor(NOTES_BG)
    c.rect(MARGIN, box_y, CONTENT_W, height, fill=1, stroke=0)
    # Border
    c.setStrokeColor(NOTES_BORDER)
    c.setLineWidth(0.75)
    c.rect(MARGIN, box_y, CONTENT_W, height, fill=0, stroke=1)
    # Label
    c.setFillColor(NOTES_BORDER)
    c.setFont("Helvetica-Bold", 6)
    c.drawString(MARGIN + 8, box_y + height - 12, label)
    # Lines for writing
    c.setStrokeColor(HexColor("#E8E0B0"))
    c.setLineWidth(0.3)
    line_y = box_y + height - 24
    while line_y > box_y + 8:
        c.line(MARGIN + 8, line_y, MARGIN + CONTENT_W - 8, line_y)
        line_y -= 16
    return box_y - 12


def draw_text(c, x, y, text, font="Helvetica", size=9, color=NAVY_BLACK, max_width=None):
    """Draw text, return new Y position."""
    c.setFont(font, size)
    c.setFillColor(color)
    if max_width:
        chars = int(max_width / (size * 0.5))
        lines = textwrap.wrap(text, width=chars)
        for line in lines:
            c.drawString(x, y, line)
            y -= size + 3
        return y
    else:
        c.drawString(x, y, text)
        return y - size - 3


def draw_subsection(c, y, title):
    """Draw a subsection header."""
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(NAVY)
    c.drawString(MARGIN, y, title)
    c.setStrokeColor(DIVIDER)
    c.setLineWidth(0.5)
    c.line(MARGIN, y - 4, WIDTH - MARGIN, y - 4)
    return y - 18


def draw_bullet(c, x, y, text, font="Helvetica", size=9, color=NAVY_BLACK):
    """Draw a bullet point."""
    c.setFont(font, size)
    c.setFillColor(GLASS_BLUE)
    c.drawString(x, y, "\u2022")
    c.setFillColor(color)
    # Wrap long text
    chars = int((WIDTH - MARGIN - x - 15) / (size * 0.48))
    lines = textwrap.wrap(text, width=chars)
    for i, line in enumerate(lines):
        c.drawString(x + 12, y - (i * (size + 2)), line)
    return y - len(lines) * (size + 2) - 4


def draw_card(c, x, y, width, title, body, tag=None):
    """Draw a content card with optional tag."""
    card_h = 72
    # Card background
    c.setFillColor(HexColor("#F1F5F9"))
    c.rect(x, y - card_h, width, card_h, fill=1, stroke=0)
    # Left accent
    c.setFillColor(GLASS_BLUE)
    c.rect(x, y - card_h, 3, card_h, fill=1, stroke=0)
    # Tag
    inner_x = x + 12
    inner_y = y - 14
    if tag:
        c.setFont("Helvetica", 6.5)
        c.setFillColor(GLASS_BLUE)
        c.drawString(inner_x, inner_y, tag.upper())
        inner_y -= 12
    # Title
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(NAVY_BLACK)
    c.drawString(inner_x, inner_y, title)
    inner_y -= 12
    # Body
    c.setFont("Helvetica", 7.5)
    c.setFillColor(STEEL)
    chars = int((width - 24) / 3.8)
    lines = textwrap.wrap(body, width=chars)
    for line in lines[:3]:
        c.drawString(inner_x, inner_y, line)
        inner_y -= 10
    return y - card_h - 8


def draw_color_swatch(c, x, y, color_hex, name, var_name):
    """Draw a color swatch with label."""
    size = 28
    c.setFillColor(HexColor(color_hex))
    c.rect(x, y - size, size, size, fill=1, stroke=0)
    c.setStrokeColor(DIVIDER)
    c.setLineWidth(0.5)
    c.rect(x, y - size, size, size, fill=0, stroke=1)
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(NAVY_BLACK)
    c.drawString(x + size + 8, y - 10, name)
    c.setFont("Helvetica", 7)
    c.setFillColor(STEEL)
    c.drawString(x + size + 8, y - 22, f"{color_hex}  ({var_name})")


def draw_testimonial(c, y, quote, author):
    """Draw a testimonial quote block."""
    # Quote background
    c.setFillColor(HexColor("#F1F5F9"))
    # Calculate height needed
    chars = int(CONTENT_W / 4.5)
    lines = textwrap.wrap(quote, width=chars)
    box_h = len(lines) * 12 + 30
    c.rect(MARGIN, y - box_h, CONTENT_W, box_h, fill=1, stroke=0)
    # Left accent
    c.setFillColor(GLASS_BLUE)
    c.rect(MARGIN, y - box_h, 3, box_h, fill=1, stroke=0)
    # Quote mark
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(HexColor("#CBD5E1"))
    c.drawString(MARGIN + 14, y - 20, "\u201C")
    # Quote text
    c.setFont("Helvetica-Oblique", 8.5)
    c.setFillColor(NAVY_BLACK)
    qy = y - 18
    for line in lines:
        c.drawString(MARGIN + 30, qy, line)
        qy -= 12
    # Author
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(NAVY)
    c.drawString(MARGIN + 30, qy - 4, f"-- {author}")
    return y - box_h - 10


def build_pdf():
    output_path = os.path.join(os.path.dirname(__file__), "QR-Client-Review-2026-03.pdf")
    c = canvas.Canvas(output_path, pagesize=letter)
    c.setTitle("Quality Reflections Glasswork - Client Review")
    c.setAuthor("Quality Reflections Glasswork")
    c.setSubject("Website Content Review for Client Approval")

    total_sheets = 12

    # =========================================================
    # PAGE 1 — COVER
    # =========================================================
    page_count[0] += 1
    # Full background
    c.setFillColor(NAVY_BLACK)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)

    # Blueprint grid
    c.setStrokeColor(HexColor("#0A1E4A"))
    c.setLineWidth(0.3)
    for gx in range(0, int(WIDTH), 40):
        c.line(gx, 0, gx, HEIGHT)
    for gy in range(0, int(HEIGHT), 40):
        c.line(0, gy, WIDTH, gy)

    # Center content
    cy = HEIGHT / 2 + 80

    # Accent line
    c.setStrokeColor(GLASS_BLUE)
    c.setLineWidth(2)
    c.line(WIDTH / 2 - 60, cy + 20, WIDTH / 2 + 60, cy + 20)

    # Company name
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(WIDTH / 2, cy - 10, "QUALITY REFLECTIONS")
    c.setFont("Helvetica", 14)
    c.setFillColor(GLASS_BLUE)
    c.drawCentredString(WIDTH / 2, cy - 30, "G L A S S W O R K")

    # Subtitle
    c.setFont("Helvetica", 10)
    c.setFillColor(SILVER)
    c.drawCentredString(WIDTH / 2, cy - 60, "Commercial Glazing  |  Laredo, Texas")

    # Document title
    c.setStrokeColor(HexColor("#1A3A7A"))
    c.setLineWidth(0.5)
    c.line(WIDTH / 2 - 120, cy - 85, WIDTH / 2 + 120, cy - 85)

    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(WHITE)
    c.drawCentredString(WIDTH / 2, cy - 110, "WEBSITE CONTENT REVIEW")

    c.setFont("Helvetica", 9)
    c.setFillColor(STEEL)
    c.drawCentredString(WIDTH / 2, cy - 128, "For Client Approval  |  March 2026  |  Rev 01")

    # Title block at bottom
    block_y = 80
    block_h = 50
    c.setStrokeColor(HexColor("#1A3A7A"))
    c.setLineWidth(0.5)
    c.rect(MARGIN, block_y, CONTENT_W, block_h, fill=0, stroke=1)
    c.line(MARGIN + CONTENT_W * 0.25, block_y, MARGIN + CONTENT_W * 0.25, block_y + block_h)
    c.line(MARGIN + CONTENT_W * 0.5, block_y, MARGIN + CONTENT_W * 0.5, block_y + block_h)
    c.line(MARGIN + CONTENT_W * 0.75, block_y, MARGIN + CONTENT_W * 0.75, block_y + block_h)

    labels = ["DOCUMENT", "REVISION", "DATE", "STATUS"]
    values = ["QR-CLIENT-REVIEW", "REV 01", "2026-03-01", "FOR REVIEW"]
    for i, (label, value) in enumerate(zip(labels, values)):
        lx = MARGIN + CONTENT_W * 0.25 * i + 10
        c.setFont("Helvetica", 6)
        c.setFillColor(STEEL)
        c.drawString(lx, block_y + block_h - 14, label)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(WHITE)
        c.drawString(lx, block_y + 12, value)

    # =========================================================
    # PAGE 2 — TABLE OF CONTENTS + HOW TO USE
    # =========================================================
    y = new_page(c, 1, total_sheets)

    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(NAVY_BLACK)
    c.drawString(MARGIN, y, "TABLE OF CONTENTS")
    c.setStrokeColor(GLASS_BLUE)
    c.setLineWidth(2)
    c.line(MARGIN, y - 6, MARGIN + 180, y - 6)
    y -= 30

    toc_items = [
        ("01", "Brand Identity & Design System", "Colors, fonts, design direction"),
        ("02", "Navigation & Header", "Menu links, logo"),
        ("03", "Hero Section", "Headline, CTAs, stats"),
        ("04", "Services", "6 service offerings"),
        ("05", "Featured Projects", "5 project showcase cards"),
        ("06", "Glazing Platforms", "6 manufacturer partnerships"),
        ("07", "Kawneer Partnership", "Authorized dealer details"),
        ("08", "Certifications", "5 credentials"),
        ("09", "Testimonials", "3 client quotes"),
        ("10", "Careers & Applications", "Job listings, 2 application forms"),
        ("11", "Contact & Footer", "Contact info, footer links"),
        ("12", "Additional Pages", "Employee & office application pages"),
    ]

    for num, title, desc in toc_items:
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(NAVY)
        c.drawString(MARGIN, y, num)
        c.setFillColor(NAVY_BLACK)
        c.drawString(MARGIN + 24, y, title)
        c.setFont("Helvetica", 8)
        c.setFillColor(STEEL)
        c.drawString(MARGIN + 24, y - 12, desc)
        # Dot leader
        c.setStrokeColor(DIVIDER)
        c.setDash(1, 2)
        c.setLineWidth(0.3)
        text_w = c.stringWidth(title, "Helvetica-Bold", 9)
        c.line(MARGIN + 28 + text_w, y + 2, WIDTH - MARGIN, y + 2)
        c.setDash()
        y -= 28

    y -= 10
    c.setStrokeColor(DIVIDER)
    c.setLineWidth(0.5)
    c.line(MARGIN, y, WIDTH - MARGIN, y)
    y -= 20

    # How to use
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(NAVY)
    c.drawString(MARGIN, y, "HOW TO USE THIS DOCUMENT")
    y -= 16

    instructions = [
        "Each section shows current website content as it appears on the live site.",
        "Yellow \"Client Notes\" boxes are provided for your feedback, changes, and additions.",
        "Mark items to KEEP, CHANGE, or REMOVE. Add new content ideas directly.",
        "Pay special attention to: contact info, service descriptions, project details, and testimonials.",
        "Return this document with your notes to proceed with revisions.",
    ]
    for instr in instructions:
        y = draw_bullet(c, MARGIN + 8, y, instr, size=8.5, color=NAVY_BLACK)

    # =========================================================
    # PAGE 3 — BRAND IDENTITY & DESIGN SYSTEM
    # =========================================================
    y = new_page(c, 2, total_sheets)
    y = draw_section_title(c, y, 1, "Brand Identity & Design System")

    y = draw_subsection(c, y, "Company Name")
    y = draw_text(c, MARGIN + 8, y, "Quality Reflections Glasswork", "Helvetica-Bold", 12, NAVY_BLACK)
    y = draw_text(c, MARGIN + 8, y, "Commercial Glazing  |  Laredo, Texas", "Helvetica", 9, STEEL)
    y -= 8

    y = draw_subsection(c, y, "Brand Colors")
    colors = [
        ("#012A89", "Navy (Primary)", "--color-navy"),
        ("#011B5A", "Navy Dark", "--color-navy-dark"),
        ("#010E2F", "Navy Black", "--color-navy-black"),
        ("#4A90D9", "Glass Blue (Accent)", "--color-glass-blue"),
        ("#8A919A", "Steel (Secondary)", "--color-steel"),
        ("#D1D5DB", "Silver (Body Text)", "--color-silver"),
    ]
    col1_x = MARGIN + 8
    col2_x = MARGIN + CONTENT_W / 2 + 8
    for i, (hex_val, name, var) in enumerate(colors):
        cx = col1_x if i % 2 == 0 else col2_x
        cy_offset = (i // 2) * 38
        draw_color_swatch(c, cx, y - cy_offset, hex_val, name, var)
    y -= (len(colors) // 2) * 38 + 10

    y = draw_subsection(c, y, "Typography")
    y = draw_text(c, MARGIN + 8, y, "Body Font: Inter (400-800 weights) - Clean, modern sans-serif", "Helvetica", 9)
    y = draw_text(c, MARGIN + 8, y, "Technical Font: JetBrains Mono (300-500) - Used for labels, coordinates, technical data", "Helvetica", 9)
    y = draw_text(c, MARGIN + 8, y, "Both fonts are self-hosted (no Google Fonts dependency)", "Helvetica", 8, STEEL)
    y -= 8

    y = draw_subsection(c, y, "Design Direction")
    design_points = [
        "Construction-document / blueprint aesthetic throughout",
        "Zero border-radius on all cards and containers (sharp, precise edges)",
        "No gradients on UI elements (only in glass reflection effects)",
        "Blueprint grid backgrounds on dark sections",
        "Geometric, rectilinear, engineered visual language",
        "Cursor transforms into a crosshair / reticle on interactive elements",
        "Glass reflection and light effects for visual polish",
    ]
    for pt in design_points:
        y = draw_bullet(c, MARGIN + 8, y, pt, size=8)

    y = draw_notes_box(c, y - 4, 80, "CLIENT NOTES — Brand Identity (colors, fonts, logo, overall feel)")

    # =========================================================
    # PAGE 4 — HEADER + HERO SECTION
    # =========================================================
    y = new_page(c, 3, total_sheets)
    y = draw_section_title(c, y, 2, "Navigation & Header")

    y = draw_text(c, MARGIN + 8, y, "Fixed header bar at top of page. Logo on left, navigation links on right.", "Helvetica", 9)
    y = draw_text(c, MARGIN + 8, y, "Logo: Quality Reflections arch icon + company name", "Helvetica", 9)
    y -= 4

    y = draw_subsection(c, y, "Navigation Links (Desktop & Mobile)")
    nav_links = ["Services", "Projects", "Platforms", "Partnership", "Certifications", "Testimonials", "Contact"]
    for link in nav_links:
        y = draw_bullet(c, MARGIN + 8, y, link, size=8.5)

    y = draw_text(c, MARGIN + 8, y, "Mobile: Hamburger menu icon opens a dropdown with same links", "Helvetica", 8, STEEL)
    y = draw_notes_box(c, y - 4, 65, "CLIENT NOTES — Navigation (add/remove links, logo changes)")
    y -= 4

    # Hero section
    y = draw_section_title(c, y, 3, "Hero Section")

    y = draw_subsection(c, y, "Hero Content")
    y = draw_text(c, MARGIN + 8, y, 'Headline: "Precision-Crafted Architectural Glass"', "Helvetica-Bold", 10, NAVY_BLACK)
    y = draw_text(c, MARGIN + 8, y, "Subheadline:", "Helvetica-Bold", 8, NAVY)
    y = draw_text(c, MARGIN + 8, y, "Custom commercial glazing systems engineered to specification. Curtain walls, storefronts,", "Helvetica", 8.5)
    y = draw_text(c, MARGIN + 8, y, "and specialty glass installations for South Texas and beyond.", "Helvetica", 8.5)
    y -= 4

    y = draw_subsection(c, y, "Call-to-Action Buttons")
    y = draw_bullet(c, MARGIN + 8, y, 'Primary: "Request Consultation" (scrolls to contact section)', size=8.5)
    y = draw_bullet(c, MARGIN + 8, y, 'Secondary: "View Portfolio" (scrolls to projects section)', size=8.5)

    y = draw_subsection(c, y, "Animated Stats")
    stats = [("25+", "Years"), ("500+", "Projects"), ("50+", "Systems"), ("100%", "Compliant")]
    stat_x = MARGIN + 8
    for val, label in stats:
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(GLASS_BLUE)
        c.drawString(stat_x, y, val)
        c.setFont("Helvetica", 8)
        c.setFillColor(STEEL)
        c.drawString(stat_x, y - 12, label)
        stat_x += 100

    y -= 28
    y = draw_text(c, MARGIN + 8, y, "Interactive: Scroll-to-assemble curtain wall cross-section animation on desktop (right side)", "Helvetica", 8, STEEL)

    y = draw_notes_box(c, y - 4, 80, "CLIENT NOTES — Hero (headline, stats accuracy, CTA wording)")

    # =========================================================
    # PAGE 5 — SERVICES
    # =========================================================
    y = new_page(c, 4, total_sheets)
    y = draw_section_title(c, y, 4, "Services")

    y = draw_text(c, MARGIN + 8, y, 'Section Heading: "Our Services"', "Helvetica-Bold", 9, NAVY)
    y = draw_text(c, MARGIN + 8, y, "Full-scope commercial glazing from engineering through installation. Every system precision-fit to architectural specifications.", "Helvetica", 8.5, NAVY_BLACK, CONTENT_W - 16)
    y -= 4

    services = [
        ("Curtain Wall Systems", "Featured / Primary Card", "Engineered aluminum and glass curtain wall systems for high-rise and mid-rise commercial construction. Custom profiles, thermal breaks, and structural silicone glazing."),
        ("Storefront Glazing", "Service Card", "Flush-glazed and captured storefront framing for retail, office, and institutional entries."),
        ("Window Systems", "Service Card", "Projected, fixed, and operable window systems with high-performance thermal ratings."),
        ("Entrance Systems", "Service Card", "Balanced doors, automatic operators, and all-glass entrances for high-traffic commercial applications."),
        ("Glass Railings", "Service Card", "Frameless and post-mounted glass railing systems for balconies, atriums, and interior applications."),
        ("Skylight Systems", "Service Card", "Ridge, pyramid, and barrel-vault skylights engineered for daylighting and thermal performance."),
    ]

    card_w = (CONTENT_W - 12) / 2
    for i, (title, tag, body) in enumerate(services):
        col = i % 2
        cx = MARGIN + col * (card_w + 12)
        if col == 0 and i > 0:
            y -= 0  # already accounted for
        y_temp = draw_card(c, cx, y, card_w, title, body, tag)
        if col == 1:
            y = y_temp

    y = draw_notes_box(c, y - 4, 80, "CLIENT NOTES — Services (add/remove services, update descriptions)")

    # =========================================================
    # PAGE 6 — PROJECTS
    # =========================================================
    y = new_page(c, 5, total_sheets)
    y = draw_section_title(c, y, 5, "Featured Projects")

    y = draw_text(c, MARGIN + 8, y, "Horizontal scroll gallery with 5 project cards. Each includes a photo, project type tag, name, and description.", "Helvetica", 8.5, NAVY_BLACK, CONTENT_W - 16)
    y -= 4

    projects = [
        ("Metropolitan Office Tower", "Commercial", "Full curtain wall system, 32 floors of unitized glass and aluminum panels with integrated sunshades."),
        ("Regional Medical Center", "Healthcare", "Storefront and curtain wall systems with blast-resistant glazing and hurricane-rated assemblies."),
        ("University Science Complex", "Education", "Skylights, curtain wall, and specialized lab-grade glazing with integrated ventilation louvers."),
        ("Luxury Retail Pavilion", "Retail", "All-glass storefront with structural silicone glazing and frameless glass entrance system."),
        ("Federal Courthouse", "Civic", "Impact-resistant glazing with custom mullion profiles and blast-mitigation film assemblies."),
    ]

    for title, tag, body in projects:
        y = draw_card(c, MARGIN, y, CONTENT_W, title, body, tag)

    y = draw_notes_box(c, y - 4, 96, "CLIENT NOTES — Projects (replace with real projects? Update names, descriptions, add photos)")

    # =========================================================
    # PAGE 7 — PLATFORMS + PARTNERSHIP
    # =========================================================
    y = new_page(c, 6, total_sheets)
    y = draw_section_title(c, y, 6, "Glazing Platforms")

    y = draw_text(c, MARGIN + 8, y, "Certified and experienced across the industry's leading glazing manufacturers.", "Helvetica", 8.5, NAVY_BLACK, CONTENT_W - 16)
    y -= 4

    platforms = [
        ("Kawneer", "1600/1620 Curtain Wall, Trifab VG"),
        ("YKK AP", "YCW 750 OG, YES 45"),
        ("Oldcastle", "Reliance Series, Envision"),
        ("Viracon", "VNE 63/27, VRE 1-59"),
        ("AGC Glass", "Energy Select, Comfort Select"),
        ("Tubelite", "T14000 Series Storefront"),
    ]

    for name, systems in platforms:
        y = draw_bullet(c, MARGIN + 8, y, f"{name} -- {systems}", "Helvetica", 8.5)

    y = draw_notes_box(c, y - 4, 65, "CLIENT NOTES — Platforms (add/remove manufacturers, update product lines)")
    y -= 4

    # Partnership
    y = draw_section_title(c, y, 7, "Kawneer Partnership")

    y = draw_text(c, MARGIN + 8, y, "KAWNEER -- Authorized Dealer", "Helvetica-Bold", 10, NAVY)
    y = draw_text(c, MARGIN + 8, y, "As an authorized Kawneer dealer, Quality Reflections provides direct access to one of the world's leading architectural aluminum systems manufacturers. From 1600/1620 curtain wall to Trifab storefront and 350/500 entrances, we deliver the full Kawneer product line with factory-direct support and competitive dealer pricing.", "Helvetica", 8.5, NAVY_BLACK, CONTENT_W - 16)
    y -= 4

    benefits = [
        "Direct factory ordering and fulfillment",
        "Full technical engineering support",
        "Competitive dealer pricing tiers",
        "Priority project scheduling",
        "Access to full product catalog",
        "Factory warranty coverage",
    ]
    for b in benefits:
        y = draw_bullet(c, MARGIN + 8, y, b, size=8.5)

    y = draw_notes_box(c, y - 4, 65, "CLIENT NOTES — Partnership (verify dealer status, update benefits)")

    # =========================================================
    # PAGE 8 — CERTIFICATIONS
    # =========================================================
    y = new_page(c, 7, total_sheets)
    y = draw_section_title(c, y, 8, "Certifications")

    y = draw_text(c, MARGIN + 8, y, "Displayed as a horizontal timeline with icon cards.", "Helvetica", 8.5, STEEL)
    y -= 4

    certs = [
        ("OSHA 30-Hour", "Safety Certified Crews"),
        ("NGA Member", "National Glass Assoc."),
        ("BBB A+ Rating", "Accredited Business"),
        ("DOT Licensed", "Commercial Carrier"),
        ("Bonded & Insured", "Full Coverage"),
    ]

    for name, desc in certs:
        c.setFillColor(HexColor("#F1F5F9"))
        c.rect(MARGIN + 8, y - 28, CONTENT_W - 16, 28, fill=1, stroke=0)
        c.setFillColor(GLASS_BLUE)
        c.rect(MARGIN + 8, y - 28, 3, 28, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(NAVY_BLACK)
        c.drawString(MARGIN + 20, y - 12, name)
        c.setFont("Helvetica", 8)
        c.setFillColor(STEEL)
        c.drawString(MARGIN + 20, y - 24, desc)
        y -= 36

    y = draw_notes_box(c, y - 4, 65, "CLIENT NOTES — Certifications (add/remove certifications, verify accuracy)")
    y -= 4

    # Testimonials
    y = draw_section_title(c, y, 9, "Client Testimonials")

    testimonials = [
        (
            "Quality Reflections delivered a curtain wall installation that exceeded our performance specifications. Their shop drawings were precise, coordination with the GC was seamless, and the finished product is architecturally stunning. They are our first call for glazing.",
            "Robert Chen, AIA -- Principal Architect, Chen + Associates"
        ),
        (
            "We have used Quality Reflections on four consecutive projects and they consistently deliver on time and within budget. Their crews are professional, OSHA-compliant, and understand the pace of commercial construction. A reliable partner.",
            "Maria Santos -- VP of Construction, Apex General Contractors"
        ),
        (
            "The skylight system they installed has been leak-free for three years running. Their attention to waterproofing details and thermal movement accommodation shows a level of expertise that's rare in the glazing trade. Highly recommended.",
            "James Holloway -- Facilities Director, Meridian Properties"
        ),
    ]

    for quote, author in testimonials:
        y = draw_testimonial(c, y, quote, author)
        if y < 100:
            y = new_page(c, 7, total_sheets)
            y -= 20

    y = draw_notes_box(c, y - 4, 80, "CLIENT NOTES — Testimonials (replace with real quotes? Update names/companies)")

    # =========================================================
    # PAGE 9 — CAREERS
    # =========================================================
    y = new_page(c, 8, total_sheets)
    y = draw_section_title(c, y, 10, "Careers & Job Applications")

    y = draw_subsection(c, y, "Careers Section (Homepage)")
    y = draw_text(c, MARGIN + 8, y, 'Heading: "BUILD YOUR CAREER WITH US"', "Helvetica-Bold", 9, NAVY)
    y = draw_text(c, MARGIN + 8, y, "Quality Reflections is growing. We are looking for skilled professionals who take pride in precision craftsmanship and want to build a lasting career in the commercial glazing industry.", "Helvetica", 8.5, NAVY_BLACK, CONTENT_W - 16)
    y -= 4

    y = draw_card(c, MARGIN, y, CONTENT_W / 2 - 6, "Full-Time Employees", "Join our team as a permanent employee and grow your career in the commercial glass industry. Benefits: Health, 401(k), PTO, Career Growth.", "Field Positions")
    # Reset y for second card on same row... actually let's stack them
    y = draw_card(c, MARGIN, y, CONTENT_W / 2 - 6, "Office Positions", "Support our operations with administrative, project management, and customer service roles. Benefits: Regular Hours, Modern Office, Team, Full Benefits.", "Office Positions")
    y -= 4

    y = draw_subsection(c, y, "Employee Application Page (/apply-employee)")
    y = draw_text(c, MARGIN + 8, y, "3-step form: Background > Goals > Contact", "Helvetica-Bold", 8.5, NAVY)
    employee_steps = [
        "Step 1: Employment status, experience level, role interests (Glazier, Lead Installer, Foreman, PM, Estimator, Shop, Apprentice)",
        "Step 2: Job priorities (salary, benefits, growth, work-life balance), 5-year goals, start availability",
        "Step 3: Contact info (name, email, phone, city, state, LinkedIn, message)",
    ]
    for step in employee_steps:
        y = draw_bullet(c, MARGIN + 8, y, step, size=8)
    y -= 4

    y = draw_subsection(c, y, "Office Application Page (/apply-office)")
    y = draw_text(c, MARGIN + 8, y, "3-step form: Role > Skills > Contact", "Helvetica-Bold", 8.5, NAVY)
    office_steps = [
        "Step 1: Role type (Admin, Customer Service, Project Coordinator, Accounting, HR, Estimator), experience level",
        "Step 2: Software proficiency (Word, Excel, Outlook, Google, QuickBooks, Adobe, CRM, PM Tools), strengths, bilingual status",
        "Step 3: Contact info (name, email, phone, city, state, availability, start date, resume upload, message)",
    ]
    for step in office_steps:
        y = draw_bullet(c, MARGIN + 8, y, step, size=8)

    y = draw_notes_box(c, y - 4, 80, "CLIENT NOTES — Careers (job titles, benefits accuracy, form fields to add/remove)")

    # =========================================================
    # PAGE 10 — CONTACT + FOOTER
    # =========================================================
    y = new_page(c, 9, total_sheets)
    y = draw_section_title(c, y, 11, "Contact & Footer")

    y = draw_subsection(c, y, "Contact Section")
    y = draw_text(c, MARGIN + 8, y, 'Heading: "Start Your Next Project"', "Helvetica-Bold", 9, NAVY)
    y = draw_text(c, MARGIN + 8, y, "Whether you need a complete curtain wall system or a storefront replacement, our team delivers precision-engineered glazing solutions on schedule and to specification.", "Helvetica", 8.5, NAVY_BLACK, CONTENT_W - 16)
    y -= 4

    y = draw_subsection(c, y, "Contact Information")
    contact_info = [
        ("Company:", "Quality Reflections Glasswork"),
        ("Phone:", "(956) 727-5000"),
        ("Email:", "info@qualityreflections.com"),
        ("Address:", "1200 Industrial Pkwy, Suite 100"),
    ]
    for label, value in contact_info:
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(NAVY)
        c.drawString(MARGIN + 8, y, label)
        c.setFont("Helvetica", 8.5)
        c.setFillColor(NAVY_BLACK)
        c.drawString(MARGIN + 70, y, value)
        y -= 14

    y -= 4
    y = draw_subsection(c, y, "CTA Buttons")
    y = draw_bullet(c, MARGIN + 8, y, '"Request a Consultation" (opens email to info@qualityreflections.com)', size=8.5)
    y = draw_bullet(c, MARGIN + 8, y, '"Call (956) 727-5000" (direct phone link)', size=8.5)

    y = draw_notes_box(c, y - 4, 80, "CLIENT NOTES — Contact (verify phone, email, address, hours to add?)")
    y -= 4

    y = draw_subsection(c, y, "Footer Content")
    y = draw_text(c, MARGIN + 8, y, "Footer Links — Services:", "Helvetica-Bold", 8, NAVY)
    y = draw_text(c, MARGIN + 8, y, "Curtain Walls, Storefronts, Window Systems, Entrances, Skylights, Glass Railings", "Helvetica", 8)
    y = draw_text(c, MARGIN + 8, y, "Footer Links — Company:", "Helvetica-Bold", 8, NAVY)
    y = draw_text(c, MARGIN + 8, y, "About Us, Projects, Certifications, Careers, Contact", "Helvetica", 8)
    y = draw_text(c, MARGIN + 8, y, "Footer Links — Resources:", "Helvetica-Bold", 8, NAVY)
    y = draw_text(c, MARGIN + 8, y, "Product Specs, Case Studies, Technical Data, Warranty Info", "Helvetica", 8)
    y -= 4
    y = draw_text(c, MARGIN + 8, y, "Drawing Title Block: QR-WEB-2026-03, REV 03, Sheet 08 of 08", "Helvetica", 8, STEEL)
    y = draw_text(c, MARGIN + 8, y, "Copyright: (c) 2026 Quality Reflections Glasswork. All rights reserved.", "Helvetica", 8, STEEL)

    y = draw_notes_box(c, y - 4, 65, "CLIENT NOTES — Footer (links to add/remove, copyright year, resources)")

    # =========================================================
    # PAGE 11 — DESIGN ELEMENTS SUMMARY
    # =========================================================
    y = new_page(c, 10, total_sheets)
    y = draw_section_title(c, y, 12, "Interactive & Design Elements")

    y = draw_subsection(c, y, "Animations & Interactivity")
    animations = [
        "Hero: Scroll-driven curtain wall cross-section assembly (9-layer exploded view that assembles as user scrolls)",
        "Stats: Animated counting numbers (25+, 500+, 50+, 100%) triggered on scroll into view",
        "Scroll Reveal: Content sections fade in as they enter the viewport",
        "Glass Cursor: Custom crosshair cursor with mullion grid pattern that follows mouse (desktop only)",
        "Cursor Hairlines: Horizontal/vertical guide lines follow cursor across page",
        "CTA Section: Animated caustic light blobs (glass light refraction effect)",
        "Floating Particles: Subtle floating particles throughout the page",
        "Glass Card Hover: Specular highlight sweep on service/project cards",
    ]
    for anim in animations:
        y = draw_bullet(c, MARGIN + 8, y, anim, size=8)

    y -= 4
    y = draw_subsection(c, y, "Accessibility & Performance")
    acc_items = [
        "All animations respect prefers-reduced-motion user setting",
        "Touch device detection hides cursor-based effects on mobile/tablet",
        "Responsive design: full support for mobile (320px+), tablet, and desktop",
        "Self-hosted fonts (no external dependencies)",
        "Optimized images: automatic WebP/AVIF conversion, responsive srcset, lazy loading",
        "Static-first architecture: JavaScript only shipped where interactivity requires it",
    ]
    for item in acc_items:
        y = draw_bullet(c, MARGIN + 8, y, item, size=8)

    y = draw_notes_box(c, y - 4, 80, "CLIENT NOTES — Design Elements (animations to add/remove, speed, overall feel)")

    # =========================================================
    # PAGE 12 — CONTENT SUMMARY + SIGN-OFF
    # =========================================================
    y = new_page(c, 11, total_sheets)
    y = draw_section_title(c, y, 0, "Content Summary & Sign-Off")

    y = draw_subsection(c, y, "Website Content at a Glance")

    summary = [
        ("Main pages:", "3 (Homepage, Employee Application, Office Application)"),
        ("Homepage sections:", "11 (Header through Footer)"),
        ("Service offerings:", "6"),
        ("Featured projects:", "5"),
        ("Glazing manufacturers:", "6"),
        ("Certifications:", "5"),
        ("Client testimonials:", "3"),
        ("Career listings:", "2 (Employee + Office)"),
        ("Application form steps:", "3 per form"),
        ("Hero statistics:", "4 animated counters"),
        ("Navigation links:", "7"),
    ]

    for label, value in summary:
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(NAVY)
        c.drawString(MARGIN + 8, y, label)
        c.setFont("Helvetica", 9)
        c.setFillColor(NAVY_BLACK)
        c.drawString(MARGIN + 160, y, value)
        y -= 16

    y -= 8
    y = draw_subsection(c, y, "Items Requiring Client Input")
    input_items = [
        "Verify all contact information (phone, email, address)",
        "Confirm service descriptions match current capabilities",
        "Replace placeholder project names/descriptions with real projects (if needed)",
        "Verify testimonial quotes are from real clients with permission to publish",
        "Confirm manufacturer partnerships and product lines are current",
        "Verify certification statuses are up to date",
        "Review stat numbers (25+ years, 500+ projects, etc.) for accuracy",
        "Confirm careers section reflects current open positions",
        "Provide any additional content or sections desired",
    ]
    for item in input_items:
        y = draw_bullet(c, MARGIN + 8, y, item, size=8.5)

    y -= 12
    # Sign-off area
    c.setStrokeColor(NAVY)
    c.setLineWidth(1)
    c.rect(MARGIN, y - 100, CONTENT_W, 100, fill=0, stroke=1)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(NAVY)
    c.drawString(MARGIN + 12, y - 16, "CLIENT APPROVAL")

    c.setFont("Helvetica", 8)
    c.setFillColor(NAVY_BLACK)
    labels_signoff = [
        ("Reviewed By:", MARGIN + 12, y - 38),
        ("Signature:", MARGIN + 12, y - 58),
        ("Date:", MARGIN + 12, y - 78),
        ("Status:", MARGIN + CONTENT_W / 2, y - 78),
    ]
    for lbl, lx, ly in labels_signoff:
        c.drawString(lx, ly, lbl)
        c.setStrokeColor(DIVIDER)
        c.setLineWidth(0.5)
        lbl_w = c.stringWidth(lbl, "Helvetica", 8)
        c.line(lx + lbl_w + 6, ly - 2, lx + 200, ly - 2)

    # Status checkboxes
    c.setFont("Helvetica", 7.5)
    sx = MARGIN + CONTENT_W / 2 + 50
    for status in ["APPROVED", "APPROVED W/ CHANGES", "REVISIONS NEEDED"]:
        c.rect(sx, y - 80, 8, 8, fill=0, stroke=1)
        c.drawString(sx + 12, y - 79, status)
        sx += 120

    # Final footer
    draw_footer(c)
    c.save()
    print(f"PDF generated: {output_path}")
    return output_path


if __name__ == "__main__":
    build_pdf()
