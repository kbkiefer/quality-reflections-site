#!/usr/bin/env python3
"""
Quality Reflections Glasswork — Client Questionnaire & Action Items
Companion document to the Website Content Review PDF.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas
import textwrap

# Brand colors
NAVY = HexColor("#012A89")
NAVY_DARK = HexColor("#011B5A")
NAVY_BLACK = HexColor("#010E2F")
GLASS_BLUE = HexColor("#4A90D9")
STEEL = HexColor("#8A919A")
SILVER = HexColor("#D1D5DB")
LIGHT_BG = HexColor("#F8F9FA")
WHITE = white
INPUT_BG = HexColor("#FAFAFA")
INPUT_BORDER = HexColor("#D1D5DB")
DIVIDER = HexColor("#E2E8F0")
CHECK_BG = HexColor("#F0F7FF")
PRIORITY_HIGH = HexColor("#DC2626")
PRIORITY_MED = HexColor("#D97706")
PRIORITY_LOW = HexColor("#059669")

WIDTH, HEIGHT = letter
MARGIN = 0.75 * inch
CONTENT_W = WIDTH - 2 * MARGIN
page_count = [0]


def draw_header_bar(c, y):
    c.setFillColor(NAVY_BLACK)
    c.rect(0, y, WIDTH, 28, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(MARGIN, y + 10, "QUALITY REFLECTIONS GLASSWORK")
    c.setFont("Helvetica", 7)
    c.setFillColor(GLASS_BLUE)
    c.drawRightString(WIDTH - MARGIN, y + 10, "CLIENT QUESTIONNAIRE & ACTION ITEMS")


def draw_footer(c):
    y = 30
    c.setStrokeColor(DIVIDER)
    c.setLineWidth(0.5)
    c.line(MARGIN, y + 15, WIDTH - MARGIN, y + 15)
    c.setFont("Helvetica", 6)
    c.setFillColor(STEEL)
    c.drawString(MARGIN, y, "QR-CLIENT-QUESTIONNAIRE-2026-03  |  CONFIDENTIAL")
    c.drawRightString(WIDTH - MARGIN, y, f"Page {page_count[0]}")


def new_page(c):
    if page_count[0] > 0:
        draw_footer(c)
        c.showPage()
    page_count[0] += 1
    draw_header_bar(c, HEIGHT - 28)
    return HEIGHT - 28 - 20


def draw_section_header(c, y, number, title, subtitle=None):
    # Number circle
    c.setFillColor(NAVY)
    c.circle(MARGIN + 12, y - 6, 12, fill=1, stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(MARGIN + 12, y - 10, str(number))
    # Title
    c.setFillColor(NAVY_BLACK)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MARGIN + 30, y - 12, title.upper())
    # Underline
    c.setStrokeColor(GLASS_BLUE)
    c.setLineWidth(2)
    c.line(MARGIN, y - 18, WIDTH - MARGIN, y - 18)
    y -= 26
    if subtitle:
        c.setFont("Helvetica", 8.5)
        c.setFillColor(STEEL)
        c.drawString(MARGIN, y, subtitle)
        y -= 14
    return y


def draw_text_input(c, y, label, height=20, hint=None):
    """Draw a labeled text input field."""
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(NAVY_BLACK)
    c.drawString(MARGIN + 4, y, label)
    if hint:
        lw = c.stringWidth(label, "Helvetica-Bold", 8)
        c.setFont("Helvetica", 7)
        c.setFillColor(STEEL)
        c.drawString(MARGIN + 8 + lw, y, f"  ({hint})")
    y -= 4
    # Input box
    c.setFillColor(INPUT_BG)
    c.rect(MARGIN, y - height, CONTENT_W, height, fill=1, stroke=0)
    c.setStrokeColor(INPUT_BORDER)
    c.setLineWidth(0.5)
    c.rect(MARGIN, y - height, CONTENT_W, height, fill=0, stroke=1)
    return y - height - 10


def draw_textarea(c, y, label, lines=4, hint=None):
    """Draw a multi-line text area."""
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(NAVY_BLACK)
    c.drawString(MARGIN + 4, y, label)
    if hint:
        lw = c.stringWidth(label, "Helvetica-Bold", 8)
        c.setFont("Helvetica", 7)
        c.setFillColor(STEEL)
        c.drawString(MARGIN + 8 + lw, y, f"  ({hint})")
    y -= 4
    height = lines * 16 + 8
    c.setFillColor(INPUT_BG)
    c.rect(MARGIN, y - height, CONTENT_W, height, fill=1, stroke=0)
    c.setStrokeColor(INPUT_BORDER)
    c.setLineWidth(0.5)
    c.rect(MARGIN, y - height, CONTENT_W, height, fill=0, stroke=1)
    # Lines inside
    c.setStrokeColor(HexColor("#EDEFF2"))
    c.setLineWidth(0.3)
    ly = y - 20
    for _ in range(lines - 1):
        c.line(MARGIN + 6, ly, MARGIN + CONTENT_W - 6, ly)
        ly -= 16
    return y - height - 10


def draw_checkbox_row(c, y, label, options, columns=2):
    """Draw a row of checkbox options."""
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(NAVY_BLACK)
    c.drawString(MARGIN + 4, y, label)
    y -= 14
    col_w = CONTENT_W / columns
    for i, opt in enumerate(options):
        col = i % columns
        row = i // columns
        cx = MARGIN + col * col_w + 4
        cy = y - row * 16
        # Checkbox
        c.setStrokeColor(INPUT_BORDER)
        c.setLineWidth(0.5)
        c.rect(cx, cy - 2, 10, 10, fill=0, stroke=1)
        c.setFont("Helvetica", 8)
        c.setFillColor(NAVY_BLACK)
        c.drawString(cx + 14, cy, opt)
    total_rows = (len(options) + columns - 1) // columns
    return y - total_rows * 16 - 8


def draw_yes_no(c, y, question, note=None):
    """Draw a yes/no question with checkbox."""
    c.setFont("Helvetica", 8.5)
    c.setFillColor(NAVY_BLACK)
    c.drawString(MARGIN + 4, y, question)
    # Yes/No boxes
    rx = WIDTH - MARGIN - 80
    c.setStrokeColor(INPUT_BORDER)
    c.setLineWidth(0.5)
    c.rect(rx, y - 2, 10, 10, fill=0, stroke=1)
    c.setFont("Helvetica", 7.5)
    c.drawString(rx + 13, y, "YES")
    c.rect(rx + 40, y - 2, 10, 10, fill=0, stroke=1)
    c.drawString(rx + 53, y, "NO")
    y -= 14
    if note:
        c.setFont("Helvetica", 7)
        c.setFillColor(STEEL)
        c.drawString(MARGIN + 16, y, note)
        y -= 12
    return y


def draw_checklist_item(c, y, text, has_line=False):
    """Draw a checklist item with checkbox."""
    c.setStrokeColor(INPUT_BORDER)
    c.setLineWidth(0.5)
    c.rect(MARGIN + 4, y - 2, 10, 10, fill=0, stroke=1)
    c.setFont("Helvetica", 8.5)
    c.setFillColor(NAVY_BLACK)
    chars = int((CONTENT_W - 30) / 4.2)
    lines = textwrap.wrap(text, width=chars)
    for i, line in enumerate(lines):
        c.drawString(MARGIN + 20, y - i * 12, line)
    y -= len(lines) * 12
    if has_line:
        c.setStrokeColor(HexColor("#EDEFF2"))
        c.setLineWidth(0.3)
        line_x = MARGIN + 20
        c.line(line_x, y, line_x + CONTENT_W - 40, y)
        y -= 4
    return y - 4


def draw_priority_legend(c, y):
    """Draw the priority legend."""
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(STEEL)
    c.drawString(MARGIN + 4, y, "PRIORITY:")
    px = MARGIN + 60
    for color, label in [(PRIORITY_HIGH, "HIGH"), (PRIORITY_MED, "MEDIUM"), (PRIORITY_LOW, "LOW / LATER")]:
        c.setFillColor(color)
        c.rect(px, y - 2, 8, 8, fill=1, stroke=0)
        c.setFont("Helvetica", 7)
        c.setFillColor(NAVY_BLACK)
        c.drawString(px + 12, y, label)
        px += 70
    return y - 16


def draw_priority_item(c, y, text, subtext=None):
    """Draw an item with priority circle options."""
    # Three priority circles
    px = MARGIN + 4
    for color in [PRIORITY_HIGH, PRIORITY_MED, PRIORITY_LOW]:
        c.setStrokeColor(color)
        c.setLineWidth(1)
        c.circle(px + 5, y + 2, 5, fill=0, stroke=1)
        px += 18
    # Text
    c.setFont("Helvetica", 8.5)
    c.setFillColor(NAVY_BLACK)
    c.drawString(MARGIN + 62, y, text)
    y -= 12
    if subtext:
        c.setFont("Helvetica", 7)
        c.setFillColor(STEEL)
        c.drawString(MARGIN + 62, y, subtext)
        y -= 12
    return y - 2


def draw_table_row(c, y, col1, col2, header=False):
    """Draw a two-column table row."""
    row_h = 18
    c1_w = CONTENT_W * 0.45
    c2_w = CONTENT_W * 0.55
    if header:
        c.setFillColor(HexColor("#F1F5F9"))
        c.rect(MARGIN, y - row_h, CONTENT_W, row_h, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(NAVY)
    else:
        c.setFont("Helvetica", 8)
        c.setFillColor(NAVY_BLACK)
    c.drawString(MARGIN + 6, y - 12, col1)
    c.drawString(MARGIN + c1_w + 6, y - 12, col2)
    c.setStrokeColor(DIVIDER)
    c.setLineWidth(0.3)
    c.line(MARGIN, y - row_h, MARGIN + CONTENT_W, y - row_h)
    c.line(MARGIN + c1_w, y, MARGIN + c1_w, y - row_h)
    return y - row_h


def build_pdf():
    import os
    output_path = os.path.join(os.path.dirname(__file__), "QR-Client-Questionnaire-2026-03.pdf")
    c = canvas.Canvas(output_path, pagesize=letter)
    c.setTitle("Quality Reflections - Client Questionnaire & Action Items")
    c.setAuthor("Quality Reflections Glasswork")

    # =========================================================
    # COVER PAGE
    # =========================================================
    page_count[0] += 1
    c.setFillColor(NAVY_BLACK)
    c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)

    # Blueprint grid
    c.setStrokeColor(HexColor("#0A1E4A"))
    c.setLineWidth(0.3)
    for gx in range(0, int(WIDTH), 40):
        c.line(gx, 0, gx, HEIGHT)
    for gy in range(0, int(HEIGHT), 40):
        c.line(0, gy, WIDTH, gy)

    cy = HEIGHT / 2 + 60

    c.setStrokeColor(GLASS_BLUE)
    c.setLineWidth(2)
    c.line(WIDTH / 2 - 60, cy + 20, WIDTH / 2 + 60, cy + 20)

    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(WIDTH / 2, cy - 10, "QUALITY REFLECTIONS")
    c.setFont("Helvetica", 13)
    c.setFillColor(GLASS_BLUE)
    c.drawCentredString(WIDTH / 2, cy - 28, "G L A S S W O R K")

    c.setStrokeColor(HexColor("#1A3A7A"))
    c.setLineWidth(0.5)
    c.line(WIDTH / 2 - 140, cy - 55, WIDTH / 2 + 140, cy - 55)

    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(WHITE)
    c.drawCentredString(WIDTH / 2, cy - 80, "CLIENT QUESTIONNAIRE")
    c.setFont("Helvetica", 10)
    c.drawCentredString(WIDTH / 2, cy - 96, "& ACTION ITEMS")

    c.setFont("Helvetica", 9)
    c.setFillColor(STEEL)
    c.drawCentredString(WIDTH / 2, cy - 120, "Companion to Website Content Review  |  March 2026")

    # Instructions box
    bx = MARGIN + 30
    bw = CONTENT_W - 60
    by = cy - 170
    bh = 100
    c.setStrokeColor(HexColor("#1A3A7A"))
    c.setLineWidth(0.5)
    c.rect(bx, by, bw, bh, fill=0, stroke=1)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(GLASS_BLUE)
    c.drawCentredString(WIDTH / 2, by + bh - 16, "HOW TO USE THIS DOCUMENT")
    c.setFont("Helvetica", 8)
    c.setFillColor(SILVER)
    instructions = [
        "1.  Review the Website Content Review PDF first to see current site content.",
        "2.  Use this questionnaire to provide decisions, assets, and feedback.",
        "3.  Fill in text fields, check boxes, and circle priorities as needed.",
        "4.  Return both documents to your web team to begin revisions.",
        "5.  Items marked HIGH priority will be addressed first.",
    ]
    iy = by + bh - 32
    for inst in instructions:
        c.drawCentredString(WIDTH / 2, iy, inst)
        iy -= 13

    # Title block
    block_y = 70
    block_h = 40
    c.setStrokeColor(HexColor("#1A3A7A"))
    c.rect(MARGIN, block_y, CONTENT_W, block_h, fill=0, stroke=1)
    cols = 4
    col_w = CONTENT_W / cols
    for i in range(1, cols):
        c.line(MARGIN + col_w * i, block_y, MARGIN + col_w * i, block_y + block_h)
    labels = ["DOCUMENT", "DATE", "CLIENT", "STATUS"]
    values = ["QR-QUESTIONNAIRE", "2026-03-01", "________________", "FOR COMPLETION"]
    for i, (label, value) in enumerate(zip(labels, values)):
        lx = MARGIN + col_w * i + 8
        c.setFont("Helvetica", 6)
        c.setFillColor(STEEL)
        c.drawString(lx, block_y + block_h - 12, label)
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(WHITE)
        c.drawString(lx, block_y + 10, value)

    # =========================================================
    # PAGE 2 — BUSINESS INFORMATION
    # =========================================================
    y = new_page(c)
    y = draw_section_header(c, y, 1, "Business Information",
                            "Please verify or update the following. This information appears on the website.")
    y -= 4

    y = draw_text_input(c, y, "Legal Business Name", hint="as it should appear on the website")
    y = draw_text_input(c, y, "Phone Number", hint="primary business line")
    y = draw_text_input(c, y, "Email Address", hint="for website inquiries & form submissions")
    y = draw_text_input(c, y, "Physical Address", hint="street, suite, city, state, zip")

    y = draw_yes_no(c, y, "Is the current address correct? (1200 Industrial Pkwy, Suite 100)")
    y = draw_yes_no(c, y, "Is the phone number correct? ((956) 727-5000)")
    y = draw_yes_no(c, y, "Is the email correct? (info@qualityreflections.com)")
    y -= 4

    y = draw_text_input(c, y, "Business Hours", hint="e.g., Mon-Fri 7am-5pm, Sat by appt")
    y = draw_text_input(c, y, "Service Area", hint="e.g., Laredo, South Texas, statewide, etc.")
    y = draw_text_input(c, y, "Years in Business", hint="website currently shows 25+")

    y = draw_textarea(c, y, "Anything else about the business to add or correct?", 3)

    # =========================================================
    # PAGE 3 — SERVICES VERIFICATION
    # =========================================================
    y = new_page(c)
    y = draw_section_header(c, y, 2, "Services Verification",
                            "The website lists 6 services. Check the ones you want to KEEP, and note any changes.")
    y -= 4

    services = [
        ("Curtain Wall Systems", "High-rise/mid-rise aluminum & glass systems"),
        ("Storefront Glazing", "Retail, office, institutional entries"),
        ("Window Systems", "Projected, fixed, operable windows"),
        ("Entrance Systems", "Balanced doors, automatic operators, all-glass entrances"),
        ("Glass Railings", "Frameless/post-mounted for balconies, atriums, interiors"),
        ("Skylight Systems", "Ridge, pyramid, barrel-vault skylights"),
    ]

    for name, desc in services:
        c.setStrokeColor(INPUT_BORDER)
        c.setLineWidth(0.5)
        c.rect(MARGIN + 4, y - 2, 10, 10, fill=0, stroke=1)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(NAVY_BLACK)
        c.drawString(MARGIN + 20, y, name)
        c.setFont("Helvetica", 7.5)
        c.setFillColor(STEEL)
        c.drawString(MARGIN + 20, y - 12, desc)
        y -= 28

    y = draw_textarea(c, y, "Services to ADD (not currently listed)", 3,
                      "e.g., aluminum composite panels, shower enclosures, mirrors, etc.")

    y = draw_textarea(c, y, "Services to REMOVE or descriptions to change", 3)

    y = draw_textarea(c, y, "Which service is your biggest revenue driver? (we can feature it more prominently)", 2)

    # =========================================================
    # PAGE 4 — PROJECTS / PORTFOLIO
    # =========================================================
    y = new_page(c)
    y = draw_section_header(c, y, 3, "Projects & Portfolio",
                            "The website shows 5 featured projects. Help us replace placeholders with your real work.")
    y -= 4

    y = draw_yes_no(c, y, "Do you have professional photos of completed projects?",
                    "High-quality photos make the biggest impact on potential clients.")
    y = draw_yes_no(c, y, "Can you provide 5-10 project names with descriptions?")
    y = draw_yes_no(c, y, "Do you want to include the client/GC name on project cards?")
    y -= 4

    y = draw_textarea(c, y, "List your TOP projects to feature (name, type, location, brief description)", 6,
                      "e.g., Webb County Courthouse - Civic - Laredo, TX - Full curtain wall replacement, 4 stories")

    y = draw_textarea(c, y, "Project categories to include", 2,
                      "Current: Commercial, Healthcare, Education, Retail, Civic. Add or change?")

    y = draw_textarea(c, y, "Do you have any project case studies, before/after photos, or spec sheets to share?", 2)

    # =========================================================
    # PAGE 5 — MANUFACTURERS & CERTIFICATIONS
    # =========================================================
    y = new_page(c)
    y = draw_section_header(c, y, 4, "Manufacturers & Certifications",
                            "Verify your current partnerships and credentials.")
    y -= 4

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(NAVY)
    c.drawString(MARGIN + 4, y, "MANUFACTURER PARTNERSHIPS")
    y -= 14

    manufacturers = [
        "Kawneer (1600/1620 Curtain Wall, Trifab VG)",
        "YKK AP (YCW 750 OG, YES 45)",
        "Oldcastle (Reliance Series, Envision)",
        "Viracon (VNE 63/27, VRE 1-59)",
        "AGC Glass (Energy Select, Comfort Select)",
        "Tubelite (T14000 Series Storefront)",
    ]
    for mfr in manufacturers:
        y = draw_checklist_item(c, y, mfr)

    y = draw_textarea(c, y, "Manufacturers to ADD or REMOVE, product lines to update", 3)
    y -= 4

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(NAVY)
    c.drawString(MARGIN + 4, y, "CERTIFICATIONS & CREDENTIALS")
    y -= 14

    certs = [
        "OSHA 30-Hour (Safety Certified Crews)",
        "NGA Member (National Glass Association)",
        "BBB A+ Rating (Accredited Business)",
        "DOT Licensed (Commercial Carrier)",
        "Bonded & Insured (Full Coverage)",
    ]
    for cert in certs:
        y = draw_checklist_item(c, y, cert)

    y = draw_textarea(c, y, "Certifications to ADD or REMOVE, any expired or upcoming?", 3)

    y = draw_yes_no(c, y, "Is the Kawneer Authorized Dealer status still active?")
    y = draw_yes_no(c, y, "Do you have certification logos/badges we can display?")

    # =========================================================
    # PAGE 6 — TESTIMONIALS & SOCIAL PROOF
    # =========================================================
    y = new_page(c)
    y = draw_section_header(c, y, 5, "Testimonials & Social Proof",
                            "The website shows 3 client testimonials. Real quotes build trust with GCs.")
    y -= 4

    y = draw_yes_no(c, y, "Are the current testimonial quotes from real clients?",
                    "If placeholder, we need real quotes with permission to publish.")
    y = draw_yes_no(c, y, "Do you have Google Reviews or BBB reviews we can reference?")
    y = draw_yes_no(c, y, "Can we contact past clients for quotes?")
    y -= 4

    y = draw_textarea(c, y, "Client testimonial #1 (quote, person's name, title, company)", 4)
    y = draw_textarea(c, y, "Client testimonial #2", 4)
    y = draw_textarea(c, y, "Client testimonial #3", 4)

    # =========================================================
    # PAGE 7 — STATISTICS & NUMBERS
    # =========================================================
    y = new_page(c)
    y = draw_section_header(c, y, 6, "Statistics & Numbers",
                            "These animated numbers appear prominently in the hero section. They must be accurate.")
    y -= 4

    y = draw_table_row(c, y, "CURRENT VALUE ON WEBSITE", "YOUR VERIFIED NUMBER", header=True)
    stats_verify = [
        ("25+ Years in business", ""),
        ("500+ Projects completed", ""),
        ("50+ Glazing systems installed", ""),
        ("100% Code compliant", ""),
    ]
    for current, _ in stats_verify:
        y = draw_table_row(c, y, current, "_______________________________")

    y -= 10
    y = draw_textarea(c, y, "Other impressive numbers to feature?", 3,
                      "e.g., sq ft of glass installed, states served, crew size, fleet size, etc.")

    y -= 4
    y = draw_section_header(c, y, 7, "Careers & Hiring",
                            "The website has a careers section with application forms.")
    y -= 4

    y = draw_yes_no(c, y, "Are you currently hiring for field positions (glaziers, installers, foremen)?")
    y = draw_yes_no(c, y, "Are you currently hiring for office positions?")
    y = draw_yes_no(c, y, "Do you want applications emailed to a specific address?")
    y = draw_text_input(c, y, "Application email address", hint="where should form submissions be sent?")
    y = draw_textarea(c, y, "Job titles or positions to add/remove from the forms?", 2)
    y = draw_textarea(c, y, "Benefits to highlight (current: Health, 401k, PTO, Career Growth)", 2)

    # =========================================================
    # PAGE 8 — BRANDING & ASSETS
    # =========================================================
    y = new_page(c)
    y = draw_section_header(c, y, 8, "Branding & Assets Needed",
                            "Help us make the website truly yours. Check what you can provide.")
    y -= 4

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(NAVY)
    c.drawString(MARGIN + 4, y, "ASSETS YOU CAN PROVIDE (check all that apply)")
    y -= 14

    assets = [
        "Company logo (vector/SVG format preferred, PNG also works)",
        "Project photos (high-resolution, exterior and interior shots)",
        "Team / crew photos",
        "Equipment / fleet photos",
        "Certification badges or logos (OSHA, NGA, BBB, etc.)",
        "Partner/manufacturer logos (Kawneer, YKK AP, etc.)",
        "Existing brochures or marketing materials",
        "Business cards (for color/font reference)",
    ]
    for asset in assets:
        y = draw_checklist_item(c, y, asset)

    y -= 4
    y = draw_yes_no(c, y, "Do you have existing brand guidelines (colors, fonts, logo usage)?")
    y = draw_yes_no(c, y, "Are you happy with the current navy/blue color scheme?")
    y = draw_yes_no(c, y, "Do you like the blueprint/construction-document design direction?")
    y -= 4
    y = draw_textarea(c, y, "Any branding preferences or dislikes?", 3,
                      "e.g., want warmer colors, prefer a different feel, love/hate the grid lines, etc.")

    y = draw_textarea(c, y, "Websites you admire (competitors or otherwise) — we'll use for design inspiration", 3)

    # =========================================================
    # PAGE 9 — DOMAIN, HOSTING & TECHNICAL
    # =========================================================
    y = new_page(c)
    y = draw_section_header(c, y, 9, "Domain, Hosting & Technical",
                            "Important decisions about where the website lives and how people find it.")
    y -= 4

    y = draw_text_input(c, y, "Current domain name", hint="e.g., qualityreflections.com")
    y = draw_yes_no(c, y, "Do you already own a domain name?")
    y = draw_yes_no(c, y, "Do you have a current website live anywhere?")
    y = draw_text_input(c, y, "Current hosting provider", hint="if known — GoDaddy, Bluehost, etc.")
    y -= 4

    y = draw_yes_no(c, y, "Do you have a Google Business Profile?",
                    "Critical for local search. If not, we recommend setting one up.")
    y = draw_yes_no(c, y, "Do you have business social media accounts?",
                    "Facebook, Instagram, LinkedIn — we can link from the website.")
    y -= 4

    y = draw_text_input(c, y, "Google Business Profile URL", hint="if you have one")
    y = draw_text_input(c, y, "Facebook page URL")
    y = draw_text_input(c, y, "Instagram handle")
    y = draw_text_input(c, y, "LinkedIn company page URL")

    y -= 4
    y = draw_yes_no(c, y, "Do you want a custom email (e.g., info@qualityreflections.com)?")
    y = draw_yes_no(c, y, "Do you need email forwarding or mailbox setup?")

    # =========================================================
    # PAGE 10 — PRIORITY RANKING
    # =========================================================
    y = new_page(c)
    y = draw_section_header(c, y, 10, "Priority Ranking",
                            "Circle priority for each item. HIGH = needed for launch. MEDIUM = soon after. LOW = later.")
    y -= 4

    y = draw_priority_legend(c, y)
    y -= 4

    priorities = [
        ("Verify & update contact information", "Phone, email, address, hours"),
        ("Replace placeholder project photos with real ones", "Need 5-10 high-res project photos"),
        ("Replace placeholder testimonials with real client quotes", "Need 3+ real quotes with permission"),
        ("Verify service descriptions match actual offerings", "Add/remove/edit services"),
        ("Verify stats are accurate (years, projects, etc.)", "Numbers in the hero section"),
        ("Update manufacturer partnerships & product lines", "Kawneer, YKK AP, etc."),
        ("Verify certifications are current", "OSHA, NGA, BBB, DOT, Bonded"),
        ("Set up form submission backend", "Where do applications & inquiries go?"),
        ("Provide company logo files", "Vector/SVG preferred"),
        ("Set up domain & hosting", "If not already done"),
        ("Create Google Business Profile", "Essential for local SEO"),
        ("Add About Us page content", "Company history, team, mission"),
        ("Add Privacy Policy & Terms of Service", "Legal requirement"),
        ("Connect social media accounts", "Facebook, Instagram, LinkedIn"),
        ("Add more pages (Case Studies, Product Specs, etc.)", "Footer links to pages that don't exist yet"),
        ("SEO optimization (keywords, meta descriptions)", "Help you rank in local search"),
    ]

    for text, subtext in priorities:
        if y < 80:
            y = new_page(c)
            y -= 10
            y = draw_priority_legend(c, y)
            y -= 4
        y = draw_priority_item(c, y, text, subtext)

    # =========================================================
    # PAGE 11 — ADDITIONAL PAGES & CONTENT
    # =========================================================
    y = new_page(c)
    y = draw_section_header(c, y, 11, "Additional Pages & Content",
                            "The footer links to pages that don't exist yet. Which do you want?")
    y -= 4

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(NAVY)
    c.drawString(MARGIN + 4, y, "CHECK PAGES YOU WANT (we'll build these as next steps)")
    y -= 14

    pages = [
        ("About Us", "Company history, team members, mission statement, values"),
        ("Individual Service Pages", "Dedicated page for each service with details, photos, specs"),
        ("Case Studies", "Detailed project write-ups with before/after, specs, challenges solved"),
        ("Product Specifications", "Technical data sheets for glazing systems you install"),
        ("Technical Data Library", "Downloadable specs, CAD details, installation guides"),
        ("Warranty Information", "Warranty terms, coverage details, claim process"),
        ("Privacy Policy", "Legal requirement — we can generate a standard one"),
        ("Terms of Service", "Legal terms for website use"),
        ("Gallery / Photo Portfolio", "Larger photo gallery beyond the 5 featured projects"),
        ("FAQ Page", "Common questions from GCs and project managers"),
        ("Blog / News", "Project updates, industry news, company announcements"),
        ("Quote Request Form", "Detailed RFQ form beyond the simple contact section"),
    ]

    for name, desc in pages:
        c.setStrokeColor(INPUT_BORDER)
        c.setLineWidth(0.5)
        c.rect(MARGIN + 4, y - 2, 10, 10, fill=0, stroke=1)
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(NAVY_BLACK)
        c.drawString(MARGIN + 20, y, name)
        c.setFont("Helvetica", 7)
        c.setFillColor(STEEL)
        c.drawString(MARGIN + 20, y - 12, desc)
        y -= 26
        if y < 70:
            y = new_page(c)
            y -= 10

    y = draw_textarea(c, y, "Other pages or features you'd like?", 3)

    # =========================================================
    # PAGE 12 — OPEN QUESTIONS + SIGN-OFF
    # =========================================================
    y = new_page(c)
    y = draw_section_header(c, y, 12, "Open Questions & Final Notes",
                            "Anything else on your mind? Use this space freely.")
    y -= 4

    y = draw_textarea(c, y, "What is the #1 thing you want visitors to do on your website?", 3,
                      "e.g., call you, submit a quote request, view your portfolio, apply for a job")

    y = draw_textarea(c, y, "Who is your ideal client? (type of GC, project size, location)", 3)

    y = draw_textarea(c, y, "What sets Quality Reflections apart from competitors?", 3,
                      "This helps us write better headlines and copy")

    y = draw_textarea(c, y, "Any concerns, questions, or ideas not covered above?", 4)

    y -= 8
    # Sign-off
    c.setStrokeColor(NAVY)
    c.setLineWidth(1)
    c.rect(MARGIN, y - 90, CONTENT_W, 90, fill=0, stroke=1)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(NAVY)
    c.drawString(MARGIN + 12, y - 14, "COMPLETED BY")

    c.setFont("Helvetica", 8)
    c.setFillColor(NAVY_BLACK)
    fields = [
        ("Name:", MARGIN + 12, y - 34),
        ("Date:", MARGIN + 12, y - 54),
        ("Phone:", MARGIN + CONTENT_W / 2, y - 34),
        ("Email:", MARGIN + CONTENT_W / 2, y - 54),
    ]
    for lbl, lx, ly in fields:
        c.drawString(lx, ly, lbl)
        lbl_w = c.stringWidth(lbl, "Helvetica", 8)
        c.setStrokeColor(DIVIDER)
        c.setLineWidth(0.5)
        end_x = lx + 200 if lx < WIDTH / 2 else WIDTH - MARGIN - 12
        c.line(lx + lbl_w + 6, ly - 2, end_x, ly - 2)

    c.setFont("Helvetica", 7)
    c.setFillColor(STEEL)
    c.drawCentredString(WIDTH / 2, y - 80, "Please return this document along with the Website Content Review to your web team.")

    # Final footer
    draw_footer(c)
    c.save()
    print(f"PDF generated: {output_path}")
    return output_path


if __name__ == "__main__":
    build_pdf()
