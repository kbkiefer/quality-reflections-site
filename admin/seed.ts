import db from './server/db.js';
import { hashPassword } from './server/auth.js';

// --- Seed admin user ---
const username = process.argv[2] || 'kevin@shalaworks.com';
const password = process.argv[3] || '12345';
const displayName = process.argv[4] || 'Kevin';

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
if (existing) {
  console.log(`User "${username}" already exists, skipping.`);
} else {
  const passwordHash = hashPassword(password);
  const result = db.prepare(
    'INSERT INTO users (username, passwordHash, displayName) VALUES (?, ?, ?)'
  ).run(username, passwordHash, displayName);
  console.log(`Created admin user "${username}" (id: ${result.lastInsertRowid})`);
}

// --- Seed featured projects ---
const projectCount = (db.prepare('SELECT COUNT(*) as c FROM projects').get() as any).c;
if (projectCount > 0) {
  console.log(`Projects already exist (${projectCount}), skipping project seed.`);
} else {
  const projects = [
    {
      slug: 'office-tower', title: 'Metropolitan Office Tower', category: 'Commercial',
      description: 'Full curtain wall system, 32 floors of unitized glass and aluminum panels with integrated sunshades.',
      location: 'San Antonio, TX', year: '2023', sqft: '48,000', duration: '', value: '',
      services: ['curtain-wall', 'window', 'entrance'], gridCoord: 'D2',
      photos: [
        { label: 'Full building exterior', services: ['curtain-wall', 'window', 'entrance'] },
        { label: 'Curtain wall detail — upper floors', services: ['curtain-wall'] },
        { label: 'Typical floor window units', services: ['curtain-wall', 'window'] },
        { label: 'Ground-level entrance lobby', services: ['entrance'] },
        { label: 'Mullion and sunshade closeup', services: ['curtain-wall'] },
      ],
    },
    {
      slug: 'medical-center', title: 'Regional Medical Center', category: 'Healthcare',
      description: 'Storefront and curtain wall systems with blast-resistant glazing and hurricane-rated assemblies.',
      location: 'Laredo, TX', year: '2022', sqft: '22,000', duration: '', value: '',
      services: ['curtain-wall', 'storefront', 'window'], gridCoord: 'D3',
      photos: [
        { label: 'Full building exterior', services: ['curtain-wall', 'storefront', 'window'] },
        { label: 'Blast-resistant curtain wall', services: ['curtain-wall'] },
        { label: 'Main entrance storefront', services: ['storefront'] },
        { label: 'Patient room window units', services: ['window'] },
        { label: 'Hurricane-rated assembly detail', services: ['curtain-wall', 'window'] },
      ],
    },
    {
      slug: 'university', title: 'University Science Complex', category: 'Education',
      description: 'Skylights, curtain wall, and specialized lab-grade glazing with integrated ventilation louvers.',
      location: 'College Station, TX', year: '2023', sqft: '31,000', duration: '', value: '',
      services: ['skylight', 'curtain-wall', 'window'], gridCoord: 'D4',
      photos: [
        { label: 'Full building exterior', services: ['skylight', 'curtain-wall', 'window'] },
        { label: 'Atrium skylight from below', services: ['skylight'] },
        { label: 'Lab wing curtain wall', services: ['curtain-wall'] },
        { label: 'Operable lab windows with louvers', services: ['window'] },
        { label: 'Skylight ridge detail', services: ['skylight', 'curtain-wall'] },
      ],
    },
    {
      slug: 'retail-pavilion', title: 'Luxury Retail Pavilion', category: 'Retail',
      description: 'All-glass storefront with structural silicone glazing and frameless glass entrance system.',
      location: 'McAllen, TX', year: '2024', sqft: '8,500', duration: '', value: '',
      services: ['storefront', 'entrance', 'railing'], gridCoord: 'D5',
      photos: [
        { label: 'Full pavilion exterior', services: ['storefront', 'entrance', 'railing'] },
        { label: 'Structural silicone storefront', services: ['storefront'] },
        { label: 'Frameless glass entrance', services: ['entrance'] },
        { label: 'Interior glass railing — mezzanine', services: ['railing'] },
        { label: 'Corner detail — storefront and entrance', services: ['storefront', 'entrance'] },
      ],
    },
    {
      slug: 'courthouse', title: 'Federal Courthouse', category: 'Civic',
      description: 'Impact-resistant glazing with custom mullion profiles and blast-mitigation film assemblies.',
      location: 'Corpus Christi, TX', year: '2024', sqft: '36,000', duration: '', value: '',
      services: ['curtain-wall', 'window', 'entrance'], gridCoord: 'D6',
      photos: [
        { label: 'Full building exterior', services: ['curtain-wall', 'window', 'entrance'] },
        { label: 'Impact-resistant curtain wall', services: ['curtain-wall'] },
        { label: 'Courtroom window units', services: ['window'] },
        { label: 'Secure entrance vestibule', services: ['entrance'] },
        { label: 'Custom mullion profile closeup', services: ['curtain-wall', 'window'] },
      ],
    },
  ];

  const insertProject = db.prepare(
    `INSERT INTO projects (slug, title, category, description, location, year, sqft, duration, value, services, gridCoord, displayOrder, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
  );
  const insertPhoto = db.prepare(
    `INSERT INTO project_photos (projectId, path, label, serviceTags, displayOrder) VALUES (?, '', ?, ?, ?)`
  );

  const seedAll = db.transaction(() => {
    projects.forEach((p, idx) => {
      const result = insertProject.run(
        p.slug, p.title, p.category, p.description, p.location,
        p.year, p.sqft, p.duration, p.value,
        JSON.stringify(p.services), p.gridCoord, idx + 1
      );
      const projectId = result.lastInsertRowid;
      p.photos.forEach((photo, photoIdx) => {
        insertPhoto.run(projectId, photo.label, JSON.stringify(photo.services), photoIdx + 1);
      });
      console.log(`  Seeded project: ${p.title} (${p.photos.length} photos)`);
    });
  });

  seedAll();
  console.log(`Seeded ${projects.length} featured projects.`);
}

// --- Seed site content ---
const contentCount = (db.prepare('SELECT COUNT(*) as c FROM site_content').get() as any).c;
if (contentCount > 0) {
  console.log(`Site content already exists (${contentCount} keys), skipping content seed.`);
} else {
  const insertContent = db.prepare('INSERT INTO site_content (key, value) VALUES (?, ?)');

  const siteContent: Record<string, any> = {
    settings: {
      companyName: "Quality Reflections Glasswork",
      companyNameShort: "Quality Reflections",
      companyNameLine2: "Glassworks",
      phone: "(956) 727-5000",
      phoneLink: "+19567275000",
      email: "info@qualityreflections.com",
      address: "1200 Industrial Pkwy, Suite 100",
      copyrightYear: "2026"
    },
    hero: {
      headlineLine1: "Precision-Crafted",
      headlineLine2: "Architectural Glass",
      badge: "Full-Service Glazing Partner",
      body: "One call. We handle engineering, procurement, fabrication coordination, installation, and warranty — so you can focus on building.",
      turnkeyItems: ["Engineering & Shop Drawings", "Material Procurement", "Certified Installation", "Warranty & Support"],
      ctaPrimaryLabel: "Request Consultation",
      ctaPrimaryLink: "#contact",
      ctaSecondaryLabel: "View Portfolio",
      ctaSecondaryLink: "#projects",
      stats: [
        { value: 20, suffix: "+", label: "Years Experience" },
        { value: 2000, suffix: "+", label: "Projects Completed" }
      ],
      logoMarquee: [
        { path: "/logos/kawneer.svg", alt: "Kawneer" },
        { path: "/logos/ykk-ap.png", alt: "YKK AP" },
        { path: "/logos/oldcastle.png", alt: "Oldcastle" },
        { path: "/logos/viracon.svg", alt: "Viracon" },
        { path: "/logos/agc.png", alt: "AGC Glass" },
        { path: "/logos/tubelite.png", alt: "Tubelite" },
        { path: "/logos/efco.svg", alt: "EFCO" },
        { path: "/logos/stanley.svg", alt: "Stanley" },
        { path: "/logos/ppg.svg", alt: "PPG" },
        { path: "/logos/guardian.png", alt: "Guardian" },
        { path: "/logos/arcadia.png", alt: "Arcadia" },
        { path: "/logos/atlas.png", alt: "Atlas" }
      ]
    },
    services: {
      heading: "Our Services",
      subtext: "Full-scope commercial glazing from engineering through installation. Every system precision-fit to architectural specifications.",
      items: [
        { type: "curtain-wall", title: "Curtain Wall Systems", description: "Engineered aluminum and glass curtain wall systems for high-rise and mid-rise commercial construction. Custom profiles, thermal breaks, and structural silicone glazing.", shortLabel: "Curtain Wall", techDescription: "Non-structural exterior cladding system spanning multiple floors with unitized aluminum and glass panels." },
        { type: "storefront", title: "Storefront Glazing", description: "Flush-glazed and captured storefront framing for retail, office, and institutional entries.", shortLabel: "Storefront", techDescription: "Ground-level glazing system framed between structural supports, designed for high-traffic commercial entrances." },
        { type: "window", title: "Window Systems", description: "Projected, fixed, and operable window systems with high-performance thermal ratings.", shortLabel: "Windows", techDescription: "Punched openings with thermally broken aluminum frames, operable and fixed configurations." },
        { type: "entrance", title: "Entrance Systems", description: "Balanced doors, automatic operators, and all-glass entrances for high-traffic commercial applications.", shortLabel: "Entrances", techDescription: "Balanced or automatic door assemblies with tempered glass panels and heavy-duty hardware." },
        { type: "railing", title: "Glass Railings", description: "Frameless and post-mounted glass railing systems for balconies, atriums, and interior applications.", shortLabel: "Railings", techDescription: "Structural glass guardrails with stainless steel standoff fittings and laminated safety glass." },
        { type: "skylight", title: "Skylight Systems", description: "Ridge, pyramid, and barrel-vault skylights engineered for daylighting and thermal performance.", shortLabel: "Skylights", techDescription: "Overhead glazing systems engineered for snow loads, thermal performance, and water management." }
      ]
    },
    platforms: {
      heading: "Glazing Platforms",
      subtext: "Certified and experienced across the industry's leading glazing manufacturers.",
      items: [
        { name: "Kawneer", logoPath: "/logos/kawneer.svg", displayMode: "logo", products: "1600/1620 Curtain Wall, Trifab VG" },
        { name: "YKK AP", logoPath: "", displayMode: "text", products: "YCW 750 OG, YES 45" },
        { name: "Oldcastle", logoPath: "/logos/oldcastle.png", displayMode: "logo", products: "Reliance Series, Envision" },
        { name: "Viracon", logoPath: "", displayMode: "text", products: "VRE 1-59" },
        { name: "AGC Glass", logoPath: "/logos/agc.png", displayMode: "logo", products: "Energy Select, Comfort Select" },
        { name: "Tubelite", logoPath: "/logos/tubelite.png", displayMode: "logo", products: "T14000 Series Storefront" }
      ]
    },
    partnership: {
      heading: "Partnership",
      partnerName: "Kawneer Co.",
      logoPath: "/logos/kawneer.svg",
      badgeText: "Authorized Dealer",
      cardHeading: "Kawneer Authorized Dealer",
      description: "As an authorized Kawneer dealer, Quality Reflections provides direct access to one of the world's leading architectural aluminum systems manufacturers. From 1600/1620 curtain wall to Trifab storefront and 350/500 entrances, we deliver the full Kawneer product line with factory-direct support and competitive dealer pricing.",
      bulletPoints: [
        "Direct factory ordering and fulfillment",
        "Full technical engineering support",
        "Competitive dealer pricing tiers",
        "Priority project scheduling",
        "Access to full product catalog",
        "Factory warranty coverage"
      ]
    },
    certifications: {
      heading: "Certifications",
      items: [
        { title: "OSHA 30-Hour", subtitle: "Safety Certified Crews", logoPath: "/logos/osha.svg" },
        { title: "NGA Member", subtitle: "National Glass Assoc.", logoPath: "/logos/nga.png" },
        { title: "BBB A+ Rating", subtitle: "Accredited Business", logoPath: "/logos/bbb.svg" },
        { title: "DOT Licensed", subtitle: "Commercial Carrier", logoPath: "/logos/dot-seal.svg" },
        { title: "Bonded & Insured", subtitle: "Full Coverage", logoPath: "/logos/bonded-insured.svg" }
      ]
    },
    testimonials: {
      heading: "Client Testimonials",
      items: [
        { quote: "Your real client testimonial goes here. A quote from an architect, GC, or project manager about working with Quality Reflections on a commercial glazing project.", name: "Client Name, Title", company: "Company Name" },
        { quote: "A second real testimonial goes here. Ideally from a different type of client to show range, such as a facilities director, property manager, or developer.", name: "Client Name, Title", company: "Company Name" },
        { quote: "A third real testimonial goes here. Great for a long-term repeat client or someone who can speak to warranty, service, or post-install support.", name: "Client Name, Title", company: "Company Name" }
      ]
    },
    careers: {
      superLabel: "Join Our Team",
      heading: "BUILD YOUR CAREER WITH US",
      body: "Quality Reflections is growing. We are looking for skilled professionals who take pride in precision craftsmanship and want to build a lasting career in the commercial glazing industry.",
      cards: [
        { categoryTag: "Field", title: "Full-Time Employees", description: "Join our team as a permanent employee and grow your career in the commercial glass industry.", perks: ["Benefits package", "Career advancement", "Training & development"], ctaLabel: "Apply Now", ctaLink: "/apply-employee" },
        { categoryTag: "Office", title: "Office Positions", description: "Support our operations with administrative, project management, and customer service roles.", perks: ["Professional environment", "Growth opportunities", "Competitive salary"], ctaLabel: "Apply Now", ctaLink: "/apply-office" }
      ]
    },
    contact: {
      badge: "Rev 03 | Request for Quote",
      headingLine1: "Start Your",
      headingLine2: "Next Project",
      body: "Whether you need a complete curtain wall system or a storefront replacement, our team delivers precision-engineered glazing solutions on schedule and to specification. Let's discuss your next project.",
      ctaPrimaryLabel: "Request a Consultation",
      ctaSecondaryLabel: "Call (956) 727-5000"
    }
  };

  const seedContent = db.transaction(() => {
    for (const [key, value] of Object.entries(siteContent)) {
      insertContent.run(key, JSON.stringify(value));
      console.log(`  Seeded content: ${key}`);
    }
  });

  seedContent();
  console.log(`Seeded ${Object.keys(siteContent).length} site content sections.`);
}
