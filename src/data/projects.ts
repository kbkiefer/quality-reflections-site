import officeTower from '../assets/images/project-office-tower.png';
import medicalCenter from '../assets/images/project-medical-center.png';
import university from '../assets/images/project-university.png';
import retailPavilion from '../assets/images/project-retail-pavilion.png';
import courthouse from '../assets/images/project-courthouse.png';

export const SERVICE_LABELS: Record<string, string> = {
  'curtain-wall': 'Curtain Wall',
  'storefront': 'Storefront',
  'window': 'Windows',
  'entrance': 'Entrances',
  'railing': 'Railings',
  'skylight': 'Skylights',
};

export const SERVICE_DESCS: Record<string, string> = {
  'curtain-wall': 'Non-structural exterior cladding system spanning multiple floors with unitized aluminum and glass panels.',
  'storefront': 'Ground-level glazing system framed between structural supports, designed for high-traffic commercial entrances.',
  'window': 'Punched openings with thermally broken aluminum frames, operable and fixed configurations.',
  'entrance': 'Balanced or automatic door assemblies with tempered glass panels and heavy-duty hardware.',
  'railing': 'Structural glass guardrails with stainless steel standoff fittings and laminated safety glass.',
  'skylight': 'Overhead glazing systems engineered for snow loads, thermal performance, and water management.',
};

export interface ProjectPhoto {
  label: string;
  services: string[];
}

export interface Project {
  id: string;
  slug: string;
  image: ImageMetadata;
  alt: string;
  coord: string;
  category: string;
  title: string;
  desc: string;
  location: string;
  year: string;
  sqft: string;
  services: string[];
  photos: ProjectPhoto[];
  delay: string;
}

export const projects: Project[] = [
  {
    id: 'office-tower', slug: 'office-tower', image: officeTower,
    alt: 'Metropolitan Office Tower - 32-story curtain wall glazing system',
    coord: 'D2', category: 'Commercial', title: 'Metropolitan Office Tower',
    desc: 'Full curtain wall system, 32 floors of unitized glass and aluminum panels with integrated sunshades.',
    location: 'San Antonio, TX', year: '2023', sqft: '48,000 sq ft glazing',
    services: ['curtain-wall', 'window', 'entrance'], delay: '0',
    photos: [
      { label: 'Full building exterior', services: ['curtain-wall', 'window', 'entrance'] },
      { label: 'Curtain wall detail — upper floors', services: ['curtain-wall'] },
      { label: 'Typical floor window units', services: ['curtain-wall', 'window'] },
      { label: 'Ground-level entrance lobby', services: ['entrance'] },
      { label: 'Mullion and sunshade closeup', services: ['curtain-wall'] },
    ],
  },
  {
    id: 'medical-center', slug: 'medical-center', image: medicalCenter,
    alt: 'Regional Medical Center - blast-resistant storefront and curtain wall systems',
    coord: 'D3', category: 'Healthcare', title: 'Regional Medical Center',
    desc: 'Storefront and curtain wall systems with blast-resistant glazing and hurricane-rated assemblies.',
    location: 'Laredo, TX', year: '2022', sqft: '22,000 sq ft glazing',
    services: ['curtain-wall', 'storefront', 'window'], delay: '100',
    photos: [
      { label: 'Full building exterior', services: ['curtain-wall', 'storefront', 'window'] },
      { label: 'Blast-resistant curtain wall', services: ['curtain-wall'] },
      { label: 'Main entrance storefront', services: ['storefront'] },
      { label: 'Patient room window units', services: ['window'] },
      { label: 'Hurricane-rated assembly detail', services: ['curtain-wall', 'window'] },
    ],
  },
  {
    id: 'university', slug: 'university', image: university,
    alt: 'University Science Complex - skylights and specialized lab-grade glazing',
    coord: 'D4', category: 'Education', title: 'University Science Complex',
    desc: 'Skylights, curtain wall, and specialized lab-grade glazing with integrated ventilation louvers.',
    location: 'College Station, TX', year: '2023', sqft: '31,000 sq ft glazing',
    services: ['skylight', 'curtain-wall', 'window'], delay: '200',
    photos: [
      { label: 'Full building exterior', services: ['skylight', 'curtain-wall', 'window'] },
      { label: 'Atrium skylight from below', services: ['skylight'] },
      { label: 'Lab wing curtain wall', services: ['curtain-wall'] },
      { label: 'Operable lab windows with louvers', services: ['window'] },
      { label: 'Skylight ridge detail', services: ['skylight', 'curtain-wall'] },
    ],
  },
  {
    id: 'retail-pavilion', slug: 'retail-pavilion', image: retailPavilion,
    alt: 'Luxury Retail Pavilion - structural silicone glazing and frameless entrance',
    coord: 'D5', category: 'Retail', title: 'Luxury Retail Pavilion',
    desc: 'All-glass storefront with structural silicone glazing and frameless glass entrance system.',
    location: 'McAllen, TX', year: '2024', sqft: '8,500 sq ft glazing',
    services: ['storefront', 'entrance', 'railing'], delay: '300',
    photos: [
      { label: 'Full pavilion exterior', services: ['storefront', 'entrance', 'railing'] },
      { label: 'Structural silicone storefront', services: ['storefront'] },
      { label: 'Frameless glass entrance', services: ['entrance'] },
      { label: 'Interior glass railing — mezzanine', services: ['railing'] },
      { label: 'Corner detail — storefront and entrance', services: ['storefront', 'entrance'] },
    ],
  },
  {
    id: 'courthouse', slug: 'courthouse', image: courthouse,
    alt: 'Federal Courthouse - impact-resistant glazing with custom mullion profiles',
    coord: 'D6', category: 'Civic', title: 'Federal Courthouse',
    desc: 'Impact-resistant glazing with custom mullion profiles and blast-mitigation film assemblies.',
    location: 'Corpus Christi, TX', year: '2024', sqft: '36,000 sq ft glazing',
    services: ['curtain-wall', 'window', 'entrance'], delay: '400',
    photos: [
      { label: 'Full building exterior', services: ['curtain-wall', 'window', 'entrance'] },
      { label: 'Impact-resistant curtain wall', services: ['curtain-wall'] },
      { label: 'Courtroom window units', services: ['window'] },
      { label: 'Secure entrance vestibule', services: ['entrance'] },
      { label: 'Custom mullion profile closeup', services: ['curtain-wall', 'window'] },
    ],
  },
];
