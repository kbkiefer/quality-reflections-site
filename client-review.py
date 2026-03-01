"""
Generate a client review PDF for Quality Reflections Glasswork website.
Covers current content, placeholder flags, and open questions.
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

# Brand colors
NAVY = HexColor("#012A89")
NAVY_DARK = HexColor("#011B5A")
NAVY_BLACK = HexColor("#010E2F")
GLASS_BLUE = HexColor("#4A90D9")
STEEL = HexColor("#8A919A")
WHITE = HexColor("#FFFFFF")
LIGHT_BG = HexColor("#F5F7FA")
PLACEHOLDER_BG = HexColor("#FFF3CD")
PLACEHOLDER_BORDER = HexColor("#FFCC02")
GREEN_BG = HexColor("#D4EDDA")
GREEN_BORDER = HexColor("#28A745")

# Styles
title_style = ParagraphStyle(
    "Title", fontName="Helvetica-Bold", fontSize=22,
    textColor=NAVY, spaceAfter=4, leading=26
)
subtitle_style = ParagraphStyle(
    "Subtitle", fontName="Helvetica", fontSize=11,
    textColor=STEEL, spaceAfter=20, leading=14
)
h1_style = ParagraphStyle(
    "H1", fontName="Helvetica-Bold", fontSize=16,
    textColor=NAVY, spaceBefore=16, spaceAfter=8, leading=20
)
h2_style = ParagraphStyle(
    "H2", fontName="Helvetica-Bold", fontSize=13,
    textColor=NAVY_DARK, spaceBefore=12, spaceAfter=6, leading=16
)
h3_style = ParagraphStyle(
    "H3", fontName="Helvetica-Bold", fontSize=11,
    textColor=NAVY_DARK, spaceBefore=8, spaceAfter=4, leading=14
)
body_style = ParagraphStyle(
    "Body", fontName="Helvetica", fontSize=10,
    textColor=NAVY_BLACK, spaceAfter=6, leading=14
)
small_style = ParagraphStyle(
    "Small", fontName="Helvetica", fontSize=9,
    textColor=STEEL, spaceAfter=4, leading=12
)
label_style = ParagraphStyle(
    "Label", fontName="Helvetica-Bold", fontSize=9,
    textColor=GLASS_BLUE, spaceAfter=2, leading=12
)
question_style = ParagraphStyle(
    "Question", fontName="Helvetica", fontSize=10,
    textColor=NAVY_BLACK, spaceAfter=2, leading=14,
    leftIndent=16, bulletIndent=4
)
answer_line_style = ParagraphStyle(
    "AnswerLine", fontName="Helvetica", fontSize=10,
    textColor=STEEL, spaceAfter=10, leading=14,
    leftIndent=16
)
status_confirmed = ParagraphStyle(
    "StatusOK", fontName="Helvetica-Bold", fontSize=8,
    textColor=GREEN_BORDER, leading=10
)
status_placeholder = ParagraphStyle(
    "StatusPlaceholder", fontName="Helvetica-Bold", fontSize=8,
    textColor=PLACEHOLDER_BORDER, leading=10
)
status_new = ParagraphStyle(
    "StatusNew", fontName="Helvetica-Bold", fontSize=8,
    textColor=HexColor("#007BFF"), leading=10
)
footer_style = ParagraphStyle(
    "Footer", fontName="Helvetica", fontSize=8,
    textColor=STEEL, alignment=TA_CENTER
)


def hr():
    return HRFlowable(width="100%", thickness=0.5, color=HexColor("#D1D5DB"),
                       spaceBefore=8, spaceAfter=8)

def thin_hr():
    return HRFlowable(width="100%", thickness=0.25, color=HexColor("#E5E7EB"),
                       spaceBefore=4, spaceAfter=4)

def status_badge(text, style):
    return Paragraph(f"[{text}]", style)

def question_block(q, lines=2):
    """Question with blank lines for handwritten answers."""
    elements = [Paragraph(f"\u2022 {q}", question_style)]
    for _ in range(lines):
        elements.append(Paragraph("_______________________________________________", answer_line_style))
    return elements

def section_block(title, status, status_style, content_items):
    """A section with title, status badge, and content."""
    elements = []
    # Title row with status
    title_text = f"{title}  "
    elements.append(Paragraph(title_text, h2_style))
    elements.append(status_badge(status, status_style))
    elements.append(Spacer(1, 4))
    for item in content_items:
        elements.append(item)
    elements.append(Spacer(1, 6))
    return elements


def build_pdf():
    doc = SimpleDocTemplate(
        "/Users/kbkiefer/Documents/Projects/Quality Reflections/quality-reflections-site/QR-Client-Review.pdf",
        pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )

    story = []

    # ── COVER / HEADER ──────────────────────────────────────────
    story.append(Spacer(1, 30))
    story.append(Paragraph("Quality Reflections Glasswork", title_style))
    story.append(Paragraph("Website Review Document", ParagraphStyle(
        "TitleSub", fontName="Helvetica", fontSize=14,
        textColor=GLASS_BLUE, spaceAfter=4, leading=18
    )))
    story.append(Paragraph("Prepared for client review  |  March 2026", subtitle_style))
    story.append(hr())

    story.append(Paragraph(
        "This document walks through every section of the website as it currently stands. "
        "Each section shows the content that's live, flags anything that's placeholder, "
        "and lists questions that need your input to finalize. "
        "Write your answers directly on this document or discuss in our review meeting.",
        body_style
    ))
    story.append(Spacer(1, 6))

    # Legend
    legend_data = [
        [Paragraph("<b>CONFIRMED</b>", status_confirmed),
         Paragraph("Content is built and appears correct", small_style)],
        [Paragraph("<b>NEEDS REVIEW</b>", status_placeholder),
         Paragraph("Placeholder or unverified content — needs your input", small_style)],
        [Paragraph("<b>PLANNED</b>", status_new),
         Paragraph("New feature to be built — needs requirements", small_style)],
    ]
    legend_table = Table(legend_data, colWidths=[1.2*inch, 5*inch])
    legend_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(legend_table)
    story.append(Spacer(1, 12))
    story.append(hr())

    # ══════════════════════════════════════════════════════════════
    # SECTION 1: HERO
    # ══════════════════════════════════════════════════════════════
    story.append(Paragraph("1. Hero Section", h1_style))
    story.append(status_badge("NEEDS REVIEW", status_placeholder))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Headline:</b> \"Precision-Crafted Architectural Glass\"", body_style))
    story.append(Paragraph(
        "<b>Subtext:</b> \"Custom commercial glazing systems engineered to specification. "
        "Curtain walls, storefronts, and specialty glass installations for South Texas and beyond.\"",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>Stats displayed:</b>", label_style))
    stats_data = [
        ["25+", "Years", "500+", "Projects", "50+", "Systems", "100%", "Compliant"],
    ]
    stats_table = Table(stats_data, colWidths=[0.6*inch, 1.1*inch, 0.6*inch, 1.1*inch, 0.6*inch, 1.1*inch, 0.6*inch, 1.1*inch])
    stats_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (6, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (6, 0), NAVY),
        ('TEXTCOLOR', (1, 0), (7, 0), STEEL),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
    ]))
    story.append(stats_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>Buttons:</b> \"Request Consultation\" (links to contact) | \"View Portfolio\" (links to projects)", body_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Questions:", h3_style))
    for q in question_block("Is the headline and subtext accurate? Any changes?"):
        story.append(q)
    for q in question_block("Are the stats correct? (25+ years in business, 500+ projects completed, 50+ glazing systems installed, 100% code compliant)"):
        story.append(q)
    for q in question_block("What does \"Systems\" mean here — unique system types installed, or something else?"):
        story.append(q)

    story.append(hr())

    # ══════════════════════════════════════════════════════════════
    # SECTION 2: SERVICES
    # ══════════════════════════════════════════════════════════════
    story.append(Paragraph("2. Services Section", h1_style))
    story.append(status_badge("NEEDS REVIEW", status_placeholder))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Section heading:</b> \"Our Services\" — \"Full-scope commercial glazing from engineering through installation.\"", body_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>Services listed (6 total):</b>", label_style))
    services = [
        ("Curtain Wall Systems (Featured)", "Engineered aluminum and glass curtain wall systems for high-rise and mid-rise commercial construction. Custom profiles, thermal breaks, and structural silicone glazing."),
        ("Storefront Glazing", "Flush-glazed and captured storefront framing for retail, office, and institutional entries."),
        ("Window Systems", "Projected, fixed, and operable window systems with high-performance thermal ratings."),
        ("Entrance Systems", "Balanced doors, automatic operators, and all-glass entrances for high-traffic commercial applications."),
        ("Glass Railings", "Frameless and post-mounted glass railing systems for balconies, atriums, and interior applications."),
        ("Skylight Systems", "Ridge, pyramid, and barrel-vault skylights engineered for daylighting and thermal performance."),
    ]
    for name, desc in services:
        story.append(Paragraph(f"\u2022 <b>{name}</b> — {desc}", body_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Questions:", h3_style))
    for q in question_block("Are all 6 services accurate? Any to add or remove?"):
        story.append(q)
    for q in question_block("Are the descriptions correct for each service?"):
        story.append(q)
    for q in question_block("Is \"Curtain Wall Systems\" still the primary/featured service?"):
        story.append(q)
    for q in question_block("Any additional specialty services? (e.g., aluminum composite panels, hurricane glazing, blast-resistant systems)"):
        story.append(q)

    story.append(hr())

    # ══════════════════════════════════════════════════════════════
    # SECTION 3: PROJECTS
    # ══════════════════════════════════════════════════════════════
    story.append(PageBreak())
    story.append(Paragraph("3. Featured Projects Section", h1_style))
    story.append(status_badge("NEEDS REVIEW — PLACEHOLDER NAMES & PHOTOS", status_placeholder))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "The project names and descriptions below are <b>placeholders</b>. "
        "We need real project names, descriptions, categories, and photos from Quality Reflections.",
        ParagraphStyle("Warning", fontName="Helvetica-Bold", fontSize=10,
                       textColor=HexColor("#856404"), spaceAfter=8, leading=14,
                       backColor=PLACEHOLDER_BG, borderPadding=6)
    ))

    story.append(Paragraph("<b>Current placeholder projects (5):</b>", label_style))
    projects = [
        ("Metropolitan Office Tower", "Commercial", "Full curtain wall system, 32 floors of unitized glass and aluminum panels with integrated sunshades."),
        ("Regional Medical Center", "Healthcare", "Storefront and curtain wall systems with blast-resistant glazing and hurricane-rated assemblies."),
        ("University Science Complex", "Education", "Skylights, curtain wall, and specialized lab-grade glazing with integrated ventilation louvers."),
        ("Luxury Retail Pavilion", "Retail", "All-glass storefront with structural silicone glazing and frameless glass entrance system."),
        ("Federal Courthouse", "Civic", "Impact-resistant glazing with custom mullion profiles and blast-mitigation film assemblies."),
    ]
    for name, cat, desc in projects:
        story.append(Paragraph(f"\u2022 <b>{name}</b> [{cat}] — {desc}", body_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Questions:", h3_style))
    for q in question_block("Please list 5-8 real completed projects with:", lines=1):
        story.append(q)
    story.append(Paragraph("      - Project name (building/facility name)", small_style))
    story.append(Paragraph("      - Category (Commercial, Healthcare, Education, Civic, Retail, Industrial, etc.)", small_style))
    story.append(Paragraph("      - 1-2 sentence description of the glazing work performed", small_style))
    story.append(Paragraph("      - Location (city)", small_style))
    story.append(Spacer(1, 4))
    for q in question_block("Can you provide project photos? (exterior shots showing the glass/curtain wall work)"):
        story.append(q)
    for q in question_block("Should each project link to a detail page, or just show the card?"):
        story.append(q)

    story.append(hr())

    # ══════════════════════════════════════════════════════════════
    # SECTION 4: GLAZING PLATFORMS
    # ══════════════════════════════════════════════════════════════
    story.append(Paragraph("4. Glazing Platforms (Manufacturers)", h1_style))
    story.append(status_badge("NEEDS REVIEW", status_placeholder))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Section heading:</b> \"Glazing Platforms\" — \"Certified and experienced across the industry's leading glazing manufacturers.\"", body_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>Manufacturers listed (6):</b>", label_style))
    platforms = [
        ("Kawneer", "1600/1620 Curtain Wall, Trifab VG"),
        ("YKK AP", "YCW 750 OG, YES 45"),
        ("Oldcastle", "Reliance Series, Envision"),
        ("Viracon", "VNE 63/27, VRE 1-59"),
        ("AGC Glass", "Energy Select, Comfort Select"),
        ("Tubelite", "T14000 Series Storefront"),
    ]
    for name, products in platforms:
        story.append(Paragraph(f"\u2022 <b>{name}</b> — {products}", body_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Questions:", h3_style))
    for q in question_block("Are all 6 manufacturers correct? Any to add or remove?"):
        story.append(q)
    for q in question_block("Are the specific product lines listed under each manufacturer accurate?"):
        story.append(q)
    for q in question_block("Do you have logos from these manufacturers we can use on the site?"):
        story.append(q)

    story.append(hr())

    # ══════════════════════════════════════════════════════════════
    # SECTION 5: KAWNEER PARTNERSHIP
    # ══════════════════════════════════════════════════════════════
    story.append(Paragraph("5. Kawneer Partnership Section", h1_style))
    story.append(status_badge("NEEDS REVIEW", status_placeholder))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Heading:</b> \"Kawneer Authorized Dealer\"", body_style))
    story.append(Paragraph(
        "<b>Description:</b> \"As an authorized Kawneer dealer, Quality Reflections provides direct access "
        "to one of the world's leading architectural aluminum systems manufacturers. From 1600/1620 curtain wall "
        "to Trifab storefront and 350/500 entrances, we deliver the full Kawneer product line with "
        "factory-direct support and competitive dealer pricing.\"",
        body_style
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph("<b>Benefits listed:</b>", label_style))
    benefits = [
        "Direct factory ordering and fulfillment",
        "Full technical engineering support",
        "Competitive dealer pricing tiers",
        "Priority project scheduling",
        "Access to full product catalog",
        "Factory warranty coverage",
    ]
    for b in benefits:
        story.append(Paragraph(f"\u2022 {b}", body_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Questions:", h3_style))
    for q in question_block("Is Quality Reflections currently an authorized Kawneer dealer?"):
        story.append(q)
    for q in question_block("Are all 6 benefits accurate?"):
        story.append(q)
    for q in question_block("Are the Kawneer product lines correct? (1600/1620 curtain wall, Trifab storefront, 350/500 entrances)"):
        story.append(q)
    for q in question_block("Any other manufacturer partnerships to highlight similarly?"):
        story.append(q)

    story.append(hr())

    # ══════════════════════════════════════════════════════════════
    # SECTION 6: CERTIFICATIONS
    # ══════════════════════════════════════════════════════════════
    story.append(PageBreak())
    story.append(Paragraph("6. Certifications Section", h1_style))
    story.append(status_badge("NEEDS REVIEW", status_placeholder))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Certifications listed (5):</b>", label_style))
    certs = [
        ("OSHA 30-Hour", "Safety Certified Crews"),
        ("NGA Member", "National Glass Association"),
        ("BBB A+ Rating", "Accredited Business"),
        ("DOT Licensed", "Commercial Carrier"),
        ("Bonded & Insured", "Full Coverage"),
    ]
    for name, desc in certs:
        story.append(Paragraph(f"\u2022 <b>{name}</b> — {desc}", body_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Questions:", h3_style))
    for q in question_block("Are all 5 certifications current and accurate?"):
        story.append(q)
    for q in question_block("Any additional certifications or licenses to add? (e.g., state contractor license, IGCC certified, etc.)"):
        story.append(q)
    for q in question_block("Do you have certificate images/PDFs we can reference?"):
        story.append(q)

    story.append(hr())

    # ══════════════════════════════════════════════════════════════
    # SECTION 7: TESTIMONIALS
    # ══════════════════════════════════════════════════════════════
    story.append(Paragraph("7. Testimonials Section", h1_style))
    story.append(status_badge("NEEDS REVIEW — PLACEHOLDER TESTIMONIALS", status_placeholder))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "The testimonials below are <b>placeholders</b>. We need real client quotes or permission to keep these.",
        ParagraphStyle("Warning2", fontName="Helvetica-Bold", fontSize=10,
                       textColor=HexColor("#856404"), spaceAfter=8, leading=14,
                       backColor=PLACEHOLDER_BG, borderPadding=6)
    ))

    testimonials = [
        ("Robert Chen, AIA", "Principal Architect, Chen + Associates",
         "Quality Reflections delivered a curtain wall installation that exceeded our performance specifications. Their shop drawings were precise, coordination with the GC was seamless, and the finished product is architecturally stunning. They are our first call for glazing."),
        ("Maria Santos", "VP of Construction, Apex General Contractors",
         "We have used Quality Reflections on four consecutive projects and they consistently deliver on time and within budget. Their crews are professional, OSHA-compliant, and understand the pace of commercial construction. A reliable partner."),
        ("James Holloway", "Facilities Director, Meridian Properties",
         "The skylight system they installed has been leak-free for three years running. Their attention to waterproofing details and thermal movement accommodation shows a level of expertise that's rare in the glazing trade. Highly recommended."),
    ]
    for name, role, quote in testimonials:
        story.append(Paragraph(f"<b>{name}</b> — {role}", body_style))
        story.append(Paragraph(f"<i>\"{quote}\"</i>", small_style))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Questions:", h3_style))
    for q in question_block("Can you provide 3-5 real client testimonials? We need:", lines=1):
        story.append(q)
    story.append(Paragraph("      - Client name and title", small_style))
    story.append(Paragraph("      - Company name", small_style))
    story.append(Paragraph("      - Quote (2-3 sentences)", small_style))
    story.append(Paragraph("      - Permission to publish on the website", small_style))
    story.append(Spacer(1, 4))
    for q in question_block("Would you prefer to use Google Reviews or a review widget instead?"):
        story.append(q)

    story.append(hr())

    # ══════════════════════════════════════════════════════════════
    # SECTION 8: CONTACT / CTA
    # ══════════════════════════════════════════════════════════════
    story.append(Paragraph("8. Contact Section", h1_style))
    story.append(status_badge("NEEDS REVIEW", status_placeholder))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Heading:</b> \"Start Your Next Project\"", body_style))
    story.append(Paragraph("<b>Buttons:</b> \"Request a Consultation\" (opens email) | \"Call (956) 727-5000\"", body_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>Contact info displayed:</b>", label_style))
    contact = [
        ("Company", "Quality Reflections Glasswork"),
        ("Phone", "(956) 727-5000"),
        ("Email", "info@qualityreflections.com"),
        ("Address", "1200 Industrial Pkwy, Suite 100"),
    ]
    contact_data = [[Paragraph(f"<b>{k}</b>", small_style), Paragraph(v, body_style)] for k, v in contact]
    contact_table = Table(contact_data, colWidths=[1.2*inch, 4.5*inch])
    contact_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('LINEBELOW', (0, 0), (-1, -2), 0.25, HexColor("#E5E7EB")),
    ]))
    story.append(contact_table)

    story.append(Spacer(1, 8))
    story.append(Paragraph("Questions:", h3_style))
    for q in question_block("Is the phone number (956) 727-5000 correct?"):
        story.append(q)
    for q in question_block("Is the email info@qualityreflections.com correct?"):
        story.append(q)
    for q in question_block("What is the correct full street address? (Currently shows \"1200 Industrial Pkwy, Suite 100\")"):
        story.append(q)
    for q in question_block("City/State/ZIP for the address?"):
        story.append(q)
    for q in question_block("Should the \"Request Consultation\" button open an email, or should we build a contact form on the page?"):
        story.append(q)
    for q in question_block("Do you want a Google Maps embed showing the office location?"):
        story.append(q)

    story.append(hr())

    # ══════════════════════════════════════════════════════════════
    # SECTION 9: CAREERS / JOBS (NEW FEATURE)
    # ══════════════════════════════════════════════════════════════
    story.append(PageBreak())
    story.append(Paragraph("9. Careers Section (New — To Be Built)", h1_style))
    story.append(status_badge("PLANNED — NEW FEATURE", status_new))
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "A new section for job applications — both <b>field positions</b> (glaziers, installers, laborers) "
        "and <b>office positions</b> (estimators, project managers, admin). "
        "This will allow visitors to see open positions and apply directly through the website.",
        body_style
    ))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Questions:", h3_style))

    for q in question_block("What field positions do you typically hire for? (e.g., glazier, installer, laborer, foreman, lead installer)"):
        story.append(q)
    for q in question_block("What office positions do you typically hire for? (e.g., estimator, project manager, office admin, accountant)"):
        story.append(q)
    for q in question_block("Do you want to list specific open positions, or a general \"We're always looking for talent\" with an application form?"):
        story.append(q)
    for q in question_block("What information should the application form collect?", lines=1):
        story.append(q)
    story.append(Paragraph("      Suggestions: Name, phone, email, position type (field/office),", small_style))
    story.append(Paragraph("      resume upload, years of experience, certifications, availability", small_style))
    story.append(Spacer(1, 4))
    for q in question_block("Should applications be emailed to a specific address, or do you use a hiring platform (Indeed, etc.)?"):
        story.append(q)
    for q in question_block("Any requirements to mention? (e.g., valid driver's license, OSHA certification, bilingual preferred, drug testing)"):
        story.append(q)
    for q in question_block("Do you want to list benefits? (e.g., competitive pay, health insurance, paid time off, training provided)"):
        story.append(q)
    for q in question_block("Should this be a separate page (/careers) or a section on the main page?"):
        story.append(q)

    story.append(hr())

    # ══════════════════════════════════════════════════════════════
    # SECTION 10: FOOTER & NAVIGATION
    # ══════════════════════════════════════════════════════════════
    story.append(Paragraph("10. Footer & Navigation", h1_style))
    story.append(status_badge("NEEDS REVIEW", status_placeholder))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Navigation links (header + footer):</b> Services, Projects, Platforms, Partnership, Certifications, Testimonials, Contact", body_style))
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>Footer links that currently go nowhere:</b>", label_style))
    dead_links = ["About Us", "Careers", "Product Specs", "Case Studies", "Technical Data", "Warranty Info", "Privacy Policy", "Terms of Service"]
    for link in dead_links:
        story.append(Paragraph(f"\u2022 {link} (no page exists)", body_style))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Questions:", h3_style))
    for q in question_block("Which of these footer links do you actually want? (We can remove any that aren't needed)"):
        story.append(q)
    for q in question_block("Do you need an \"About Us\" page? If so, what should it include? (company history, team, mission, etc.)"):
        story.append(q)
    for q in question_block("Do you have product spec sheets, case studies, or warranty documents to link to?"):
        story.append(q)
    for q in question_block("Do you need a Privacy Policy and Terms of Service page?"):
        story.append(q)

    story.append(hr())

    # ══════════════════════════════════════════════════════════════
    # SECTION 11: GENERAL / BUSINESS INFO
    # ══════════════════════════════════════════════════════════════
    story.append(Paragraph("11. General Business Information", h1_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Questions:", h3_style))
    for q in question_block("What domain will the website be hosted on? (e.g., qualityreflections.com)"):
        story.append(q)
    for q in question_block("Do you have social media profiles to link? (Facebook, LinkedIn, Instagram)"):
        story.append(q)
    for q in question_block("Is the arch/pyramid logo on the website the official company logo?"):
        story.append(q)
    for q in question_block("Do you have a higher-resolution logo file? (SVG, AI, or high-res PNG)"):
        story.append(q)
    for q in question_block("What is the company's service area? (Currently says \"South Texas and beyond\")"):
        story.append(q)
    for q in question_block("Do you want Google Analytics or any other tracking on the site?"):
        story.append(q)
    for q in question_block("Any SEO keywords important to you? (e.g., \"commercial glazing Laredo\", \"curtain wall contractor Texas\")"):
        story.append(q)
    for q in question_block("Target launch date?"):
        story.append(q)

    story.append(hr())
    story.append(Spacer(1, 20))

    # ── SIGN-OFF ─────────────────────────────────────────────────
    story.append(Paragraph("Notes / Additional Requests", h1_style))
    story.append(Spacer(1, 8))
    for _ in range(12):
        story.append(Paragraph("____________________________________________________________________________", answer_line_style))

    story.append(Spacer(1, 30))
    story.append(thin_hr())
    story.append(Paragraph(
        "Quality Reflections Glasswork  |  Website Review Document  |  Prepared by ShalaWorks  |  March 2026",
        footer_style
    ))

    doc.build(story)
    print("PDF generated: QR-Client-Review.pdf")


if __name__ == "__main__":
    build_pdf()
