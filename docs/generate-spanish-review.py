#!/usr/bin/env python3
"""Generate Spanish content review PDF for Quality Reflections Glasswork website."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from datetime import date

# --- Colors ---
NAVY = HexColor("#012A89")
NAVY_DARK = HexColor("#011B5A")
NAVY_BLACK = HexColor("#010E2F")
GLASS_BLUE = HexColor("#4A90D9")
STEEL = HexColor("#8A919A")
SILVER = HexColor("#D1D5DB")
WHITE = HexColor("#FFFFFF")
LIGHT_BG = HexColor("#F0F2F5")
BORDER_GRAY = HexColor("#C8CDD3")

# --- Output ---
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "QR-Contenido-Web-Espanol.pdf")

# --- Styles ---
styles = {
    "cover_title": ParagraphStyle(
        "cover_title", fontName="Helvetica-Bold", fontSize=28,
        textColor=NAVY, leading=34, alignment=TA_LEFT,
    ),
    "cover_subtitle": ParagraphStyle(
        "cover_subtitle", fontName="Helvetica", fontSize=14,
        textColor=STEEL, leading=20, alignment=TA_LEFT,
    ),
    "cover_meta": ParagraphStyle(
        "cover_meta", fontName="Helvetica", fontSize=10,
        textColor=STEEL, leading=14, alignment=TA_LEFT,
    ),
    "section_header": ParagraphStyle(
        "section_header", fontName="Helvetica-Bold", fontSize=18,
        textColor=NAVY, leading=24, spaceBefore=20, spaceAfter=8,
    ),
    "subsection": ParagraphStyle(
        "subsection", fontName="Helvetica-Bold", fontSize=13,
        textColor=NAVY_DARK, leading=18, spaceBefore=14, spaceAfter=6,
    ),
    "label": ParagraphStyle(
        "label", fontName="Helvetica-Bold", fontSize=9,
        textColor=GLASS_BLUE, leading=12, spaceBefore=8, spaceAfter=2,
    ),
    "body": ParagraphStyle(
        "body", fontName="Helvetica", fontSize=10,
        textColor=NAVY_BLACK, leading=15, spaceBefore=2, spaceAfter=4,
    ),
    "body_italic": ParagraphStyle(
        "body_italic", fontName="Helvetica-Oblique", fontSize=10,
        textColor=STEEL, leading=15, spaceBefore=2, spaceAfter=4,
    ),
    "bullet": ParagraphStyle(
        "bullet", fontName="Helvetica", fontSize=10,
        textColor=NAVY_BLACK, leading=14, leftIndent=18,
        bulletIndent=6, spaceBefore=1, spaceAfter=1,
    ),
    "quote": ParagraphStyle(
        "quote", fontName="Helvetica-Oblique", fontSize=10,
        textColor=NAVY_DARK, leading=15, leftIndent=14, rightIndent=14,
        spaceBefore=6, spaceAfter=2, borderPadding=4,
    ),
    "quote_attr": ParagraphStyle(
        "quote_attr", fontName="Helvetica", fontSize=9,
        textColor=STEEL, leading=12, leftIndent=14, spaceAfter=10,
    ),
    "card_title": ParagraphStyle(
        "card_title", fontName="Helvetica-Bold", fontSize=11,
        textColor=NAVY_DARK, leading=15, spaceBefore=4, spaceAfter=2,
    ),
    "card_body": ParagraphStyle(
        "card_body", fontName="Helvetica", fontSize=9.5,
        textColor=NAVY_BLACK, leading=14, spaceBefore=1, spaceAfter=2,
    ),
    "table_header": ParagraphStyle(
        "table_header", fontName="Helvetica-Bold", fontSize=9,
        textColor=WHITE, leading=12, alignment=TA_LEFT,
    ),
    "table_cell": ParagraphStyle(
        "table_cell", fontName="Helvetica", fontSize=9,
        textColor=NAVY_BLACK, leading=12, alignment=TA_LEFT,
    ),
    "footer": ParagraphStyle(
        "footer", fontName="Helvetica", fontSize=7.5,
        textColor=STEEL, leading=10, alignment=TA_CENTER,
    ),
    "page_label": ParagraphStyle(
        "page_label", fontName="Helvetica", fontSize=7.5,
        textColor=STEEL, leading=10, alignment=TA_RIGHT,
    ),
}


def header_line():
    return HRFlowable(
        width="100%", thickness=1.5, color=NAVY,
        spaceBefore=2, spaceAfter=10,
    )


def thin_line():
    return HRFlowable(
        width="100%", thickness=0.5, color=BORDER_GRAY,
        spaceBefore=6, spaceAfter=6,
    )


def section(title):
    return KeepTogether([
        Paragraph(title, styles["section_header"]),
        header_line(),
    ])


def sub(title):
    return Paragraph(title, styles["subsection"])


def label(text):
    return Paragraph(text, styles["label"])


def body(text):
    return Paragraph(text, styles["body"])


def italic(text):
    return Paragraph(text, styles["body_italic"])


def bullet(text):
    return Paragraph(f"\u2022  {text}", styles["bullet"])


def quote(text, attribution):
    return KeepTogether([
        Paragraph(f"\u201c{text}\u201d", styles["quote"]),
        Paragraph(f"\u2014 {attribution}", styles["quote_attr"]),
    ])


def card(title, desc, bullets=None):
    items = [
        Paragraph(title, styles["card_title"]),
        Paragraph(desc, styles["card_body"]),
    ]
    if bullets:
        for b in bullets:
            items.append(Paragraph(f"\u2022  {b}", styles["bullet"]))
    items.append(Spacer(1, 4))
    return KeepTogether(items)


def make_table(headers, rows, col_widths=None):
    """Create a styled table."""
    w = col_widths or [None] * len(headers)
    header_row = [Paragraph(h, styles["table_header"]) for h in headers]
    data_rows = []
    for row in rows:
        data_rows.append([Paragraph(str(c), styles["table_cell"]) for c in row])
    data = [header_row] + data_rows

    t = Table(data, colWidths=w, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER_GRAY),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def add_page_number(canvas_obj, doc):
    canvas_obj.saveState()
    canvas_obj.setFont("Helvetica", 7.5)
    canvas_obj.setFillColor(STEEL)
    canvas_obj.drawString(
        doc.leftMargin, 0.5 * inch,
        "Quality Reflections Glasswork \u2014 Revisi\u00f3n de Contenido Web (Espa\u00f1ol)"
    )
    canvas_obj.drawRightString(
        letter[0] - doc.rightMargin, 0.5 * inch,
        f"P\u00e1gina {doc.page}"
    )
    # Top rule
    canvas_obj.setStrokeColor(BORDER_GRAY)
    canvas_obj.setLineWidth(0.5)
    canvas_obj.line(
        doc.leftMargin, letter[1] - 0.55 * inch,
        letter[0] - doc.rightMargin, letter[1] - 0.55 * inch
    )
    canvas_obj.restoreState()


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_FILE,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.8 * inch,
        bottomMargin=0.8 * inch,
        title="Quality Reflections \u2014 Contenido Web en Espa\u00f1ol",
        author="Quality Reflections Glasswork",
        subject="Revisi\u00f3n de contenido del sitio web traducido al espa\u00f1ol",
    )

    story = []
    usable = doc.width

    # =========================================================================
    # COVER PAGE
    # =========================================================================
    story.append(Spacer(1, 1.5 * inch))
    story.append(Paragraph("QUALITY REFLECTIONS GLASSWORK", styles["cover_title"]))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="40%", thickness=3, color=NAVY, spaceAfter=12))
    story.append(Paragraph(
        "Revisi\u00f3n de Contenido del Sitio Web",
        styles["cover_subtitle"]
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "Traducci\u00f3n al Espa\u00f1ol",
        ParagraphStyle("accent", fontName="Helvetica-Bold", fontSize=14,
                        textColor=GLASS_BLUE, leading=20)
    ))
    story.append(Spacer(1, 1.2 * inch))

    meta_data = [
        ["Documento:", "QR-WEB-2026-ES"],
        ["Revisi\u00f3n:", "REV 01"],
        ["Fecha:", date.today().strftime("%d de %B de %Y").replace(
            "January", "enero").replace("February", "febrero").replace(
            "March", "marzo").replace("April", "abril").replace(
            "May", "mayo").replace("June", "junio").replace(
            "July", "julio").replace("August", "agosto").replace(
            "September", "septiembre").replace("October", "octubre").replace(
            "November", "noviembre").replace("December", "diciembre")],
        ["Preparado por:", "QR Digital"],
    ]
    for row in meta_data:
        story.append(Paragraph(
            f"<b>{row[0]}</b>  {row[1]}", styles["cover_meta"]
        ))
        story.append(Spacer(1, 2))

    story.append(Spacer(1, 1 * inch))
    story.append(Paragraph(
        "Este documento contiene todo el contenido del sitio web de Quality Reflections "
        "traducido al espa\u00f1ol para su revisi\u00f3n y aprobaci\u00f3n.",
        styles["body_italic"]
    ))

    story.append(PageBreak())

    # =========================================================================
    # TABLE OF CONTENTS
    # =========================================================================
    story.append(section("TABLA DE CONTENIDOS"))
    toc_items = [
        "1. Encabezado y Navegaci\u00f3n",
        "2. Secci\u00f3n Principal (Hero)",
        "3. Servicios",
        "4. Proyectos Destacados",
        "5. Plataformas de Acristalamiento",
        "6. Asociaci\u00f3n Comercial",
        "7. Certificaciones",
        "8. Testimonios de Clientes",
        "9. Carreras / \u00danete a Nuestro Equipo",
        "10. Contacto",
        "11. Pie de P\u00e1gina",
        "12. P\u00e1gina de Solicitud \u2014 Empleados",
        "13. P\u00e1gina de Solicitud \u2014 Oficina",
    ]
    for item in toc_items:
        story.append(body(item))
    story.append(PageBreak())

    # =========================================================================
    # 1. HEADER & NAVIGATION
    # =========================================================================
    story.append(section("1. ENCABEZADO Y NAVEGACI\u00d3N"))

    story.append(label("LOGOTIPO / MARCA"))
    story.append(body("Quality Reflections"))

    story.append(label("ENLACES DE NAVEGACI\u00d3N"))
    nav_items = [
        ("Services", "Servicios"),
        ("Projects", "Proyectos"),
        ("Platforms", "Plataformas"),
        ("Partnership", "Asociaci\u00f3n"),
        ("Certifications", "Certificaciones"),
        ("Testimonials", "Testimonios"),
        ("Contact", "Contacto"),
    ]
    story.append(make_table(
        ["Ingl\u00e9s (actual)", "Espa\u00f1ol (propuesto)"],
        nav_items,
        col_widths=[usable * 0.5, usable * 0.5],
    ))
    story.append(Spacer(1, 6))
    story.append(italic(
        "Nota: El nombre de la empresa \u201cQuality Reflections\u201d se mantiene en ingl\u00e9s "
        "como nombre comercial registrado."
    ))

    story.append(PageBreak())

    # =========================================================================
    # 2. HERO SECTION
    # =========================================================================
    story.append(section("2. SECCI\u00d3N PRINCIPAL (HERO)"))

    story.append(label("ETIQUETA T\u00c9CNICA"))
    story.append(body("L\u00e1mina 01 de 08"))

    story.append(label("T\u00cdTULO PRINCIPAL (H1)"))
    story.append(Paragraph(
        "<b>Vidrio Arquitect\u00f3nico</b><br/>"
        "<font color='#4A90D9'><b>de Precisi\u00f3n</b></font>",
        ParagraphStyle("hero_h1", fontName="Helvetica-Bold", fontSize=16,
                        textColor=NAVY, leading=22, spaceBefore=4, spaceAfter=6)
    ))

    story.append(label("TEXTO DE APOYO"))
    story.append(body(
        "Sistemas de acristalamiento comercial dise\u00f1ados a medida y fabricados "
        "seg\u00fan especificaciones. Muros cortina, escaparates e instalaciones de "
        "vidrio especializado para el sur de Texas y m\u00e1s all\u00e1."
    ))

    story.append(label("BOTONES DE ACCI\u00d3N (CTA)"))
    story.append(bullet("Solicitar Consulta"))
    story.append(bullet("Ver Portafolio"))

    story.append(label("TARJETAS DE ESTAD\u00cdSTICAS"))
    story.append(make_table(
        ["Valor", "Etiqueta (EN)", "Etiqueta (ES)"],
        [
            ["25+", "Years", "A\u00f1os"],
            ["500+", "Projects", "Proyectos"],
            ["50+", "Systems", "Sistemas"],
            ["100%", "Compliant", "Cumplimiento"],
        ],
        col_widths=[usable * 0.2, usable * 0.4, usable * 0.4],
    ))

    story.append(PageBreak())

    # =========================================================================
    # 3. SERVICES
    # =========================================================================
    story.append(section("3. SERVICIOS"))

    story.append(label("T\u00cdTULO DE SECCI\u00d3N (H2)"))
    story.append(body("Nuestros Servicios"))

    story.append(label("TEXTO DE APOYO"))
    story.append(body(
        "Acristalamiento comercial de alcance completo, desde la ingenier\u00eda hasta "
        "la instalaci\u00f3n. Cada sistema ajustado con precisi\u00f3n a las "
        "especificaciones arquitect\u00f3nicas."
    ))

    story.append(Spacer(1, 6))
    story.append(sub("Tarjetas de Servicios"))

    # Featured service
    story.append(label("SERVICIO DESTACADO"))
    story.append(card(
        "Sistemas de Muro Cortina",
        "Sistemas de muro cortina de aluminio y vidrio dise\u00f1ados para "
        "construcci\u00f3n comercial de gran y mediana altura. Perfiles personalizados, "
        "rupturas t\u00e9rmicas y acristalamiento de silicona estructural para cumplir "
        "con cualquier intenci\u00f3n de dise\u00f1o y especificaci\u00f3n de rendimiento.",
    ))

    services = [
        ("Acristalamiento de Escaparates",
         "Enmarcado de escaparates con acristalamiento al ras y capturado para "
         "entradas comerciales, de oficinas e institucionales."),
        ("Sistemas de Ventanas",
         "Sistemas de ventanas proyectados, fijos y operables con clasificaciones "
         "t\u00e9rmicas de alto rendimiento."),
        ("Sistemas de Entrada",
         "Puertas balanceadas, operadores autom\u00e1ticos y entradas completamente "
         "de vidrio para aplicaciones comerciales de alto tr\u00e1fico."),
        ("Barandillas de Vidrio",
         "Sistemas de barandillas de vidrio sin marco y con poste para balcones, "
         "atrios y aplicaciones interiores."),
        ("Sistemas de Tragaluces",
         "Tragaluces de cumbrera, pir\u00e1mide y b\u00f3veda de ca\u00f1\u00f3n "
         "dise\u00f1ados para iluminaci\u00f3n natural y rendimiento t\u00e9rmico."),
    ]
    for title, desc in services:
        story.append(card(title, desc))

    story.append(PageBreak())

    # =========================================================================
    # 4. PROJECTS
    # =========================================================================
    story.append(section("4. PROYECTOS DESTACADOS"))

    story.append(label("T\u00cdTULO DE SECCI\u00d3N (H2)"))
    story.append(body("Proyectos Destacados"))

    story.append(label("INDICACI\u00d3N M\u00d3VIL"))
    story.append(body("Desliza para explorar"))

    story.append(Spacer(1, 6))
    story.append(make_table(
        ["Categor\u00eda", "T\u00edtulo", "Descripci\u00f3n"],
        [
            ["Comercial", "Torre de Oficinas Metropolitana",
             "Sistema completo de muro cortina, 32 pisos de paneles unitizados de "
             "vidrio y aluminio con parasoles integrados."],
            ["Salud", "Centro M\u00e9dico Regional",
             "Sistemas de escaparate y muro cortina con acristalamiento resistente a "
             "explosiones y ensamblajes con clasificaci\u00f3n contra huracanes."],
            ["Educaci\u00f3n", "Complejo de Ciencias Universitario",
             "Tragaluces, muro cortina y acristalamiento especializado para "
             "laboratorios con louvers de ventilaci\u00f3n integrados."],
            ["Comercio", "Pabell\u00f3n de Comercio de Lujo",
             "Escaparate completamente de vidrio con acristalamiento de silicona "
             "estructural y sistema de entrada de vidrio sin marco."],
            ["C\u00edvico", "Palacio de Justicia Federal",
             "Acristalamiento resistente a impactos con perfiles de parteluz "
             "personalizados y ensamblajes de pel\u00edcula de mitigaci\u00f3n de explosiones."],
        ],
        col_widths=[usable * 0.15, usable * 0.25, usable * 0.60],
    ))

    story.append(PageBreak())

    # =========================================================================
    # 5. PLATFORMS
    # =========================================================================
    story.append(section("5. PLATAFORMAS DE ACRISTALAMIENTO"))

    story.append(label("T\u00cdTULO DE SECCI\u00d3N (H2)"))
    story.append(body("Plataformas de Acristalamiento"))

    story.append(label("TEXTO DE APOYO"))
    story.append(body(
        "Certificados y experimentados en las principales plataformas de "
        "fabricantes de acristalamiento de la industria."
    ))

    story.append(Spacer(1, 6))
    story.append(make_table(
        ["Fabricante", "L\u00ednea de Productos"],
        [
            ["Kawneer", "Muro Cortina 1600/1620, Trifab VG"],
            ["YKK AP", "YCW 750 OG, YES 45"],
            ["Oldcastle", "Serie Reliance, Envision"],
            ["Viracon", "VNE 63/27, VRE 1-59"],
            ["AGC Glass", "Energy Select, Comfort Select"],
            ["Tubelite", "Serie T14000 Escaparate"],
        ],
        col_widths=[usable * 0.35, usable * 0.65],
    ))

    story.append(Spacer(1, 8))
    story.append(italic(
        "Nota: Los nombres de fabricantes y l\u00edneas de productos se mantienen en "
        "ingl\u00e9s ya que son marcas registradas."
    ))

    story.append(PageBreak())

    # =========================================================================
    # 6. PARTNERSHIP
    # =========================================================================
    story.append(section("6. ASOCIACI\u00d3N COMERCIAL"))

    story.append(label("T\u00cdTULO DE SECCI\u00d3N (H2)"))
    story.append(body("Asociaci\u00f3n"))

    story.append(label("INSIGNIA"))
    story.append(body("Distribuidor Autorizado"))

    story.append(label("T\u00cdTULO DE TARJETA (H3)"))
    story.append(body("Distribuidor Autorizado de Kawneer"))

    story.append(label("DESCRIPCI\u00d3N"))
    story.append(body(
        "Como distribuidor autorizado de Kawneer, Quality Reflections brinda acceso "
        "directo a uno de los fabricantes l\u00edderes mundiales de sistemas de aluminio "
        "arquitect\u00f3nico. Desde el muro cortina 1600/1620 hasta el escaparate Trifab "
        "y las entradas 350/500, ofrecemos la l\u00ednea completa de productos Kawneer "
        "con soporte directo de f\u00e1brica y precios competitivos de distribuidor."
    ))

    story.append(label("BENEFICIOS"))
    benefits = [
        "Pedidos directos de f\u00e1brica y cumplimiento",
        "Soporte completo de ingenier\u00eda t\u00e9cnica",
        "Niveles de precios competitivos para distribuidores",
        "Programaci\u00f3n prioritaria de proyectos",
        "Acceso al cat\u00e1logo completo de productos",
        "Cobertura de garant\u00eda de f\u00e1brica",
    ]
    for b in benefits:
        story.append(bullet(b))

    story.append(PageBreak())

    # =========================================================================
    # 7. CERTIFICATIONS
    # =========================================================================
    story.append(section("7. CERTIFICACIONES"))

    story.append(label("T\u00cdTULO DE SECCI\u00d3N (H2)"))
    story.append(body("Certificaciones"))

    story.append(Spacer(1, 6))
    story.append(make_table(
        ["Certificaci\u00f3n", "Subt\u00edtulo (EN)", "Subt\u00edtulo (ES)"],
        [
            ["OSHA 30-Hour", "Safety Certified Crews",
             "Cuadrillas Certificadas en Seguridad"],
            ["NGA Member", "National Glass Assoc.",
             "Asoc. Nacional del Vidrio"],
            ["BBB A+ Rating", "Accredited Business",
             "Negocio Acreditado"],
            ["DOT Licensed", "Commercial Carrier",
             "Transportista Comercial"],
            ["Bonded & Insured", "Full Coverage",
             "Cobertura Completa"],
        ],
        col_widths=[usable * 0.25, usable * 0.35, usable * 0.40],
    ))

    story.append(Spacer(1, 8))
    story.append(italic(
        "Nota: Los nombres de certificaciones (OSHA, NGA, BBB, DOT) se mantienen "
        "en ingl\u00e9s ya que son acr\u00f3nimos oficiales de organizaciones estadounidenses."
    ))

    story.append(PageBreak())

    # =========================================================================
    # 8. TESTIMONIALS
    # =========================================================================
    story.append(section("8. TESTIMONIOS DE CLIENTES"))

    story.append(label("T\u00cdTULO DE SECCI\u00d3N (H2)"))
    story.append(body("Testimonios de Clientes"))

    story.append(Spacer(1, 8))

    story.append(quote(
        "Quality Reflections realiz\u00f3 una instalaci\u00f3n de muro cortina que "
        "super\u00f3 nuestras especificaciones de rendimiento. Sus planos de taller "
        "fueron precisos, la coordinaci\u00f3n con el contratista general fue impecable, "
        "y el producto terminado es arquitect\u00f3nicamente impresionante. Son nuestra "
        "primera opci\u00f3n para acristalamiento.",
        "Robert Chen, AIA / Arquitecto Principal, Chen + Associates"
    ))

    story.append(quote(
        "Hemos utilizado a Quality Reflections en cuatro proyectos consecutivos y "
        "consistentemente entregan a tiempo y dentro del presupuesto. Sus cuadrillas "
        "son profesionales, cumplen con OSHA, y entienden el ritmo de la construcci\u00f3n "
        "comercial. Un socio confiable.",
        "Mar\u00eda Santos / VP de Construcci\u00f3n, Apex General Contractors"
    ))

    story.append(quote(
        "El sistema de tragaluz que instalaron no ha tenido filtraciones durante tres "
        "a\u00f1os consecutivos. Su atenci\u00f3n a los detalles de impermeabilizaci\u00f3n "
        "y la acomodaci\u00f3n del movimiento t\u00e9rmico demuestra un nivel de experiencia "
        "que es raro en el oficio del acristalamiento. Altamente recomendado.",
        "James Holloway / Director de Instalaciones, Meridian Properties"
    ))

    story.append(PageBreak())

    # =========================================================================
    # 9. CAREERS
    # =========================================================================
    story.append(section("9. CARRERAS / \u00daNETE A NUESTRO EQUIPO"))

    story.append(label("ETIQUETA"))
    story.append(body("\u00danete a Nuestro Equipo"))

    story.append(label("T\u00cdTULO DE SECCI\u00d3N (H2)"))
    story.append(body("CONSTRUYE TU CARRERA CON NOSOTROS"))

    story.append(label("TEXTO DE APOYO"))
    story.append(body(
        "Quality Reflections est\u00e1 creciendo. Buscamos profesionales capacitados "
        "que se enorgullezcan de la artesan\u00eda de precisi\u00f3n y quieran construir "
        "una carrera duradera en la industria del acristalamiento comercial."
    ))

    story.append(Spacer(1, 6))
    story.append(sub("Tarjeta 1 \u2014 Empleados de Tiempo Completo"))
    story.append(card(
        "Empleados de Tiempo Completo",
        "\u00danete a nuestro equipo como empleado permanente y desarrolla tu carrera "
        "en la industria del vidrio comercial.",
        [
            "Paquete de beneficios",
            "Avance profesional",
            "Capacitaci\u00f3n y desarrollo",
        ]
    ))
    story.append(body("<b>Bot\u00f3n:</b> Aplicar Ahora"))

    story.append(Spacer(1, 6))
    story.append(sub("Tarjeta 2 \u2014 Posiciones de Oficina"))
    story.append(card(
        "Posiciones de Oficina",
        "Apoya nuestras operaciones con roles administrativos, de gesti\u00f3n de "
        "proyectos y servicio al cliente.",
        [
            "Ambiente profesional",
            "Oportunidades de crecimiento",
            "Salario competitivo",
        ]
    ))
    story.append(body("<b>Bot\u00f3n:</b> Aplicar Ahora"))

    story.append(PageBreak())

    # =========================================================================
    # 10. CONTACT
    # =========================================================================
    story.append(section("10. CONTACTO"))

    story.append(label("INSIGNIA"))
    story.append(body("Rev 03 | Solicitud de Cotizaci\u00f3n"))

    story.append(label("T\u00cdTULO (H2)"))
    story.append(body("Comience Su Pr\u00f3ximo Proyecto"))

    story.append(label("DESCRIPCI\u00d3N"))
    story.append(body(
        "Ya sea que necesite un sistema completo de muro cortina o un reemplazo de "
        "escaparate, nuestro equipo ofrece soluciones de acristalamiento de "
        "precisi\u00f3n a tiempo y seg\u00fan especificaciones. Hablemos de su "
        "pr\u00f3ximo proyecto."
    ))

    story.append(label("BOTONES DE ACCI\u00d3N"))
    story.append(bullet("Solicitar una Consulta"))
    story.append(bullet("Llamar al (956) 727-5000"))

    story.append(label("BLOQUE DE INFORMACI\u00d3N DE CONTACTO"))
    contact_info = [
        ("Empresa:", "Quality Reflections Glasswork"),
        ("Tel\u00e9fono:", "(956) 727-5000"),
        ("Correo:", "info@qualityreflections.com"),
        ("Direcci\u00f3n:", "1200 Industrial Pkwy, Suite 100"),
    ]
    for lbl, val in contact_info:
        story.append(body(f"<b>{lbl}</b> {val}"))

    story.append(PageBreak())

    # =========================================================================
    # 11. FOOTER
    # =========================================================================
    story.append(section("11. PIE DE P\u00c1GINA"))

    story.append(label("MARCA"))
    story.append(body("Quality Reflections / Glasswork"))

    story.append(label("COLUMNAS DE ENLACES"))
    story.append(Spacer(1, 4))

    story.append(sub("Servicios"))
    footer_services = [
        "Muros Cortina", "Escaparates", "Sistemas de Ventanas",
        "Entradas", "Tragaluces", "Barandillas de Vidrio"
    ]
    for s in footer_services:
        story.append(bullet(s))

    story.append(sub("Empresa"))
    footer_company = [
        "Sobre Nosotros", "Proyectos", "Certificaciones",
        "Carreras", "Contacto"
    ]
    for c in footer_company:
        story.append(bullet(c))

    story.append(sub("Recursos"))
    footer_resources = [
        "Especificaciones de Productos", "Casos de Estudio",
        "Datos T\u00e9cnicos", "Informaci\u00f3n de Garant\u00eda"
    ]
    for r in footer_resources:
        story.append(bullet(r))

    story.append(Spacer(1, 6))
    story.append(label("BARRA INFERIOR"))
    story.append(body(
        "\u00a9 2026 Quality Reflections Glasswork. Todos los derechos reservados."
    ))
    story.append(bullet("Pol\u00edtica de Privacidad"))
    story.append(bullet("T\u00e9rminos de Servicio"))

    story.append(PageBreak())

    # =========================================================================
    # 12. APPLY - EMPLOYEE
    # =========================================================================
    story.append(section("12. P\u00c1GINA DE SOLICITUD \u2014 EMPLEADOS"))

    story.append(label("T\u00cdTULO DE P\u00c1GINA"))
    story.append(body("Empleo de Tiempo Completo | Quality Reflections Glasswork"))

    story.append(label("T\u00cdTULO HERO (H1)"))
    story.append(body("EMPLEO DE TIEMPO COMPLETO"))

    story.append(label("TEXTO DE APOYO"))
    story.append(body(
        "Construye tu carrera con un equipo que valora la excelencia, la integridad "
        "y el crecimiento profesional."
    ))

    story.append(Spacer(1, 6))
    story.append(sub("Barra de Beneficios"))
    story.append(make_table(
        ["Beneficio", "Detalle"],
        [
            ["Beneficios de Salud", "M\u00e9dico, dental y visi\u00f3n"],
            ["Jubilaci\u00f3n 401(k)", "Contribuci\u00f3n de la empresa disponible"],
            ["Tiempo Libre Pagado", "Vacaciones y d\u00edas festivos"],
            ["Crecimiento Profesional", "Capacitaci\u00f3n y avance"],
        ],
        col_widths=[usable * 0.4, usable * 0.6],
    ))

    story.append(Spacer(1, 6))
    story.append(sub("Secci\u00f3n del Formulario"))

    story.append(label("T\u00cdTULO (H2)"))
    story.append(body("CONOZCAMOS M\u00c1S SOBRE TI"))

    story.append(label("TEXTO DE APOYO"))
    story.append(body(
        "Ay\u00fadanos a entender tus metas profesionales y lo que buscas."
    ))

    story.append(label("PASOS DE PROGRESO"))
    story.append(body("1. Antecedentes / 2. Metas / 3. Contacto"))

    story.append(thin_line())
    story.append(sub("Paso 1 \u2014 Antecedentes"))

    story.append(label("ESTADO DE EMPLEO ACTUAL"))
    emp_status = [
        "Actualmente Empleado / Buscando nuevas oportunidades",
        "Actualmente Desempleado / Buscando trabajo activamente",
        "Aut\u00f3nomo / Contratista / Quiere la estabilidad de tiempo completo",
        "Estudiante / Reci\u00e9n Graduado / Comenzando mi carrera",
    ]
    for e in emp_status:
        story.append(bullet(e))

    story.append(label("NIVEL DE EXPERIENCIA EN LA INDUSTRIA"))
    exp_levels = [
        "Nivel Inicial (0-1 a\u00f1os) / Nuevo en la industria, con ganas de aprender",
        "Intermedio (2-5 a\u00f1os) / Base s\u00f3lida, habilidades en crecimiento",
        "Experimentado (5-10 a\u00f1os) / Profesional capacitado",
        "Experto (10+ a\u00f1os) / Veterano de la industria, listo para liderar",
    ]
    for e in exp_levels:
        story.append(bullet(e))

    story.append(label("ROLES DE INTER\u00c9S"))
    roles = [
        "Vidriero", "Instalador L\u00edder", "Capataz", "Gerente de Proyecto",
        "Estimador", "Fabricaci\u00f3n en Taller", "Aprendiz", "Otro"
    ]
    story.append(body(" / ".join(roles)))

    story.append(thin_line())
    story.append(sub("Paso 2 \u2014 Metas"))

    story.append(label("\u00bfQU\u00c9 ES LO M\u00c1S IMPORTANTE EN UN TRABAJO? (SELECCIONA 3)"))
    priorities = [
        "Salario Competitivo / Los mejores pagos por mis habilidades",
        "Paquete de Beneficios / Salud, jubilaci\u00f3n, tiempo libre",
        "Crecimiento Profesional / Oportunidades de avance",
        "Equilibrio Vida-Trabajo / Horario predecible",
        "Gran Equipo / Ambiente de trabajo positivo",
        "Capacitaci\u00f3n y Desarrollo / Aprender nuevas habilidades",
    ]
    for p in priorities:
        story.append(bullet(p))

    story.append(label("\u00bfD\u00d3NDE TE VES EN 5 A\u00d1OS?"))
    goals = [
        "Dominar Mi Oficio / Ser el mejor en lo que hago",
        "Liderar un Equipo / Supervisar y guiar a otros",
        "Pasar a Gerencia / Gesti\u00f3n de proyectos u operaciones",
        "Rol Estable a Largo Plazo / Trabajo confiable con un gran equipo",
    ]
    for g in goals:
        story.append(bullet(g))

    story.append(label("\u00bfQU\u00c9 TAN PRONTO PUEDES EMPEZAR?"))
    start_dates = [
        "Inmediatamente / Listo para comenzar ahora",
        "2 Semanas de Aviso / Necesito terminar mi rol actual",
        "1 Mes / Necesito tiempo para la transici\u00f3n",
        "Flexible / Abierto a discusi\u00f3n",
    ]
    for s in start_dates:
        story.append(bullet(s))

    story.append(thin_line())
    story.append(sub("Paso 3 \u2014 Contacto"))

    story.append(label("CAMPOS DEL FORMULARIO"))
    fields_emp = [
        "Nombre Completo *",
        "Correo Electr\u00f3nico *",
        "N\u00famero de Tel\u00e9fono *",
        "Ciudad",
        "Estado (predeterminado: Texas)",
        "Perfil de LinkedIn (opcional)",
        "Cu\u00e9ntanos sobre ti \u2014 Comparte tu trayectoria, logros y lo que "
        "te entusiasma de unirte a Quality Reflections...",
    ]
    for f in fields_emp:
        story.append(bullet(f))

    story.append(label("BOTONES DE NAVEGACI\u00d3N"))
    story.append(body("Continuar / Atr\u00e1s / Enviar Solicitud"))

    story.append(label("PANTALLA DE \u00c9XITO"))
    story.append(body("<b>SOLICITUD ENVIADA</b>"))
    story.append(body(
        "Gracias por tu inter\u00e9s en unirte a Quality Reflections. Nuestro equipo "
        "de Recursos Humanos revisar\u00e1 tu solicitud y se comunicar\u00e1 contigo "
        "dentro de 3-5 d\u00edas h\u00e1biles."
    ))
    story.append(body("<b>Bot\u00f3n:</b> Volver al Inicio"))

    story.append(PageBreak())

    # =========================================================================
    # 13. APPLY - OFFICE
    # =========================================================================
    story.append(section("13. P\u00c1GINA DE SOLICITUD \u2014 OFICINA"))

    story.append(label("T\u00cdTULO DE P\u00c1GINA"))
    story.append(body("Posiciones de Oficina | Quality Reflections Glasswork"))

    story.append(label("T\u00cdTULO HERO (H1)"))
    story.append(body("POSICIONES DE OFICINA"))

    story.append(label("TEXTO DE APOYO"))
    story.append(body(
        "Apoya nuestras operaciones con excelencia administrativa, coordinaci\u00f3n "
        "de proyectos y servicio al cliente."
    ))

    story.append(Spacer(1, 6))
    story.append(sub("Barra de Beneficios"))
    story.append(make_table(
        ["Beneficio", "Detalle"],
        [
            ["Horario Regular", "Horario de lunes a viernes"],
            ["Oficina Moderna", "Espacio de trabajo c\u00f3modo"],
            ["Ambiente de Equipo", "Cultura colaborativa"],
            ["Beneficios Completos", "Salud, tiempo libre y m\u00e1s"],
        ],
        col_widths=[usable * 0.4, usable * 0.6],
    ))

    story.append(Spacer(1, 6))
    story.append(sub("Secci\u00f3n del Formulario"))

    story.append(label("T\u00cdTULO (H2)"))
    story.append(body("ENCUENTRA TU ROL"))

    story.append(label("TEXTO DE APOYO"))
    story.append(body(
        "Cu\u00e9ntanos sobre tus habilidades e intereses para que podamos "
        "encontrarte la oportunidad adecuada."
    ))

    story.append(label("PASOS DE PROGRESO"))
    story.append(body("1. Rol / 2. Habilidades / 3. Contacto"))

    story.append(thin_line())
    story.append(sub("Paso 1 \u2014 Rol"))

    story.append(label("\u00bfQU\u00c9 TIPO DE ROL DE OFICINA TE INTERESA?"))
    office_roles = [
        "Asistente Administrativo / Programaci\u00f3n, archivo, correspondencia",
        "Servicio al Cliente / Comunicaci\u00f3n con clientes, cotizaciones, soporte",
        "Coordinador de Proyectos / Programaci\u00f3n de cuadrillas, seguimiento de proyectos",
        "Contabilidad / Tenedur\u00eda / Facturaci\u00f3n, n\u00f3mina, registros financieros",
        "Recursos Humanos / Contrataci\u00f3n, incorporaci\u00f3n, relaciones laborales",
        "Estimador / Soporte de Ventas / Preparaci\u00f3n de cotizaciones, asistencia en licitaciones",
    ]
    for r in office_roles:
        story.append(bullet(r))

    story.append(label("NIVEL DE EXPERIENCIA EN OFICINA"))
    office_exp = [
        "Nivel Inicial (0-1 a\u00f1os) / Nuevo en trabajo de oficina, aprendo r\u00e1pido",
        "Algo de Experiencia (1-3 a\u00f1os) / Familiarizado con ambientes de oficina",
        "Experimentado (3-5 a\u00f1os) / S\u00f3lida trayectoria profesional",
        "Senior (5+ a\u00f1os) / Amplia experiencia, listo para liderar",
    ]
    for e in office_exp:
        story.append(bullet(e))

    story.append(thin_line())
    story.append(sub("Paso 2 \u2014 Habilidades"))

    story.append(label("DOMINIO DE SOFTWARE (SELECCIONA TODOS LOS QUE APLIQUEN)"))
    story.append(body(
        "Microsoft Word / Microsoft Excel / Microsoft Outlook / Google Workspace / "
        "QuickBooks / Adobe Suite / Software CRM / Herramientas de Gesti\u00f3n de Proyectos"
    ))

    story.append(label("HABILIDADES M\u00c1S FUERTES (SELECCIONA 3)"))
    strengths = [
        "Organizaci\u00f3n / Mantengo todo en orden",
        "Comunicaci\u00f3n / Clara y profesional",
        "Resoluci\u00f3n de Problemas / Encuentro soluciones r\u00e1pidamente",
        "Atenci\u00f3n al Detalle / La precisi\u00f3n importa",
        "Multitareas / Manejo m\u00faltiples prioridades",
        "Enfoque al Cliente / La satisfacci\u00f3n del cliente es primero",
    ]
    for s in strengths:
        story.append(bullet(s))

    story.append(label("\u00bfERES BILING\u00dcE?"))
    lang_options = [
        "Ingl\u00e9s y Espa\u00f1ol / Fluido en ambos",
        "Solo Ingl\u00e9s / Idioma principal",
        "Espa\u00f1ol Principal / Aprendiendo ingl\u00e9s",
        "Otros Idiomas / Especificar en comentarios",
    ]
    for l in lang_options:
        story.append(bullet(l))

    story.append(thin_line())
    story.append(sub("Paso 3 \u2014 Contacto"))

    story.append(label("CAMPOS DEL FORMULARIO"))
    fields_office = [
        "Nombre Completo *",
        "Correo Electr\u00f3nico *",
        "N\u00famero de Tel\u00e9fono *",
        "Ciudad",
        "Estado (predeterminado: Texas)",
        "Tu disponibilidad: Tiempo Completo (40 hrs/semana) / Medio Tiempo "
        "(20-30 hrs/semana) / Flexible / Cualquiera",
        "\u00bfCu\u00e1ndo puedes empezar?: Inmediatamente / Dentro de 1 semana / "
        "Dentro de 2 semanas / Dentro de 1 mes / Flexible",
        "Subir Curr\u00edculum (PDF, DOC, DOCX \u2014 m\u00e1x 5MB)",
        "Cu\u00e9ntanos sobre ti y tus metas profesionales...",
    ]
    for f in fields_office:
        story.append(bullet(f))

    story.append(label("ZONA DE CARGA"))
    story.append(body(
        "Arrastra y suelta tu curr\u00edculum o busca archivos / "
        "PDF, DOC o DOCX hasta 5MB"
    ))

    story.append(label("BOTONES DE NAVEGACI\u00d3N"))
    story.append(body("Continuar / Atr\u00e1s / Enviar Solicitud"))

    story.append(label("PANTALLA DE \u00c9XITO"))
    story.append(body("<b>SOLICITUD ENVIADA</b>"))
    story.append(body(
        "Gracias por tu inter\u00e9s en unirte a Quality Reflections. Nuestro equipo "
        "revisar\u00e1 tu solicitud y se comunicar\u00e1 contigo dentro de 3-5 "
        "d\u00edas h\u00e1biles."
    ))
    story.append(body("<b>Bot\u00f3n:</b> Volver al Inicio"))

    # =========================================================================
    # BUILD
    # =========================================================================
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"PDF generated: {OUTPUT_FILE}")


if __name__ == "__main__":
    build_pdf()
