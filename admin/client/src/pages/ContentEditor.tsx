import { useState, useEffect, useRef, FormEvent, CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import { api, apiUpload } from '../api';

const SECTION_TITLES: Record<string, string> = {
  hero: 'Hero Section',
  services: 'Services',
  platforms: 'Platforms',
  partnership: 'Partnership',
  certifications: 'Certifications',
  testimonials: 'Testimonials',
  careers: 'Careers',
  contact: 'Contact Section',
};

const inputStyle: CSSProperties = { background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' };
const labelStyle: CSSProperties = { color: 'var(--steel)' };
const panelStyle: CSSProperties = { background: 'var(--surface)', border: '1px solid var(--border)' };

interface FormProps {
  data: any;
  update: (field: string, value: any) => void;
}

function Field({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <label className="block mb-4">
      <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>{label}</span>
      {textarea ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3} className="block w-full mt-1 px-3 py-2 text-sm" style={{ ...inputStyle, resize: 'vertical' }} />
      ) : (
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={inputStyle} />
      )}
    </label>
  );
}

function ListHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>{title}</span>
      <button type="button" onClick={onAdd} className="font-mono text-xs px-3 py-1 text-white uppercase" style={{ background: 'var(--glass-blue)' }}>+ Add</button>
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="font-mono text-xs mt-2" style={{ color: '#ef4444' }}>Remove</button>;
}

// ─── Logo Field (thumbnail + upload + picker) ───
function LogoField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [logos, setLogos] = useState<{ filename: string; path: string }[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<{ filename: string; path: string }[]>('/api/content/logos/list').then(setLogos).catch(() => {});
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const result = await apiUpload<{ filename: string; path: string }>('/api/content/logos/upload', fd);
      onChange(result.path);
      setLogos(prev => prev.some(l => l.filename === result.filename) ? prev : [...prev, result]);
    } catch (err: any) { alert(err.message); }
    finally { setUploading(false); }
  }

  return (
    <label className="block mb-4">
      <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>{label}</span>
      <div className="flex items-center gap-3 mt-1">
        {value && (
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)' }}>
            <img src={value} alt="" className="max-w-full max-h-full object-contain" style={{ filter: 'brightness(0) invert(1)', opacity: 0.7 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className="flex-1 px-3 py-2 text-sm" style={inputStyle} />
        <button type="button" onClick={() => setShowPicker(!showPicker)} className="font-mono text-xs px-2 py-2 whitespace-nowrap" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--steel)' }}>
          {showPicker ? 'Close' : 'Pick'}
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="font-mono text-xs px-2 py-2 whitespace-nowrap" style={{ background: 'var(--glass-blue)', color: '#fff' }}>
          {uploading ? '...' : 'Upload'}
        </button>
        <input ref={fileRef} type="file" accept=".svg,.png,.jpg,.jpeg,.webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
      </div>
      {showPicker && (
        <div className="mt-2 p-3 grid grid-cols-4 sm:grid-cols-6 gap-2" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)' }}>
          {logos.length === 0 && <span className="col-span-full font-mono text-xs" style={{ color: 'var(--steel)' }}>No logos found</span>}
          {logos.map(logo => (
            <button key={logo.filename} type="button" onClick={() => { onChange(logo.path); setShowPicker(false); }}
              className="p-2 flex flex-col items-center gap-1 hover:opacity-100 transition-opacity"
              style={{ border: value === logo.path ? '1px solid var(--glass-blue)' : '1px solid var(--border)', opacity: value === logo.path ? 1 : 0.6 }}>
              <img src={logo.path} alt={logo.filename} className="w-8 h-8 object-contain" style={{ filter: 'brightness(0) invert(1)' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="font-mono text-[9px] truncate w-full text-center" style={{ color: 'var(--steel)' }}>{logo.filename}</span>
            </button>
          ))}
        </div>
      )}
    </label>
  );
}

// ─── Hero ───
function HeroForm({ data, update }: FormProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="p-6" style={panelStyle}>
        <span className="font-mono text-xs uppercase tracking-wider block mb-4" style={labelStyle}>Headline & Copy</span>
        <Field label="Headline Line 1" value={data.headlineLine1} onChange={v => update('headlineLine1', v)} />
        <Field label="Headline Line 2" value={data.headlineLine2} onChange={v => update('headlineLine2', v)} />
        <Field label="Badge Text" value={data.badge} onChange={v => update('badge', v)} />
        <Field label="Body Text" value={data.body} onChange={v => update('body', v)} textarea />
      </div>
      <div className="p-6" style={panelStyle}>
        <span className="font-mono text-xs uppercase tracking-wider block mb-4" style={labelStyle}>CTAs</span>
        <Field label="Primary CTA Label" value={data.ctaPrimaryLabel} onChange={v => update('ctaPrimaryLabel', v)} />
        <Field label="Primary CTA Link" value={data.ctaPrimaryLink} onChange={v => update('ctaPrimaryLink', v)} />
        <Field label="Secondary CTA Label" value={data.ctaSecondaryLabel} onChange={v => update('ctaSecondaryLabel', v)} />
        <Field label="Secondary CTA Link" value={data.ctaSecondaryLink} onChange={v => update('ctaSecondaryLink', v)} />
      </div>
    </div>
  );
}

// ─── Services ───
function ServicesForm({ data, update }: FormProps) {
  const items = data.items || [];
  return (
    <div className="space-y-6">
      <div className="p-6" style={panelStyle}>
        <Field label="Section Heading" value={data.heading} onChange={v => update('heading', v)} />
        <Field label="Subtext" value={data.subtext} onChange={v => update('subtext', v)} textarea />
      </div>
      <div className="p-6" style={panelStyle}>
        <ListHeader title={`Services (${items.length})`} onAdd={() => update('items', [...items, { type: '', title: '', description: '', shortLabel: '', techDescription: '' }])} />
        {items.map((item: any, i: number) => (
          <div key={i} className="mb-6 p-4" style={{ border: '1px solid var(--border)' }}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Type Key" value={item.type} onChange={v => { const a = [...items]; a[i] = { ...a[i], type: v }; update('items', a); }} />
              <Field label="Short Label" value={item.shortLabel} onChange={v => { const a = [...items]; a[i] = { ...a[i], shortLabel: v }; update('items', a); }} />
            </div>
            <Field label="Title" value={item.title} onChange={v => { const a = [...items]; a[i] = { ...a[i], title: v }; update('items', a); }} />
            <Field label="Description" value={item.description} onChange={v => { const a = [...items]; a[i] = { ...a[i], description: v }; update('items', a); }} textarea />
            <Field label="Tech Description" value={item.techDescription} onChange={v => { const a = [...items]; a[i] = { ...a[i], techDescription: v }; update('items', a); }} textarea />
            <RemoveBtn onClick={() => update('items', items.filter((_: any, j: number) => j !== i))} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Platforms ───
function PlatformsForm({ data, update }: FormProps) {
  const items = data.items || [];
  return (
    <div className="space-y-6">
      <div className="p-6" style={panelStyle}>
        <Field label="Section Heading" value={data.heading} onChange={v => update('heading', v)} />
        <Field label="Subtext" value={data.subtext} onChange={v => update('subtext', v)} textarea />
      </div>
      <div className="p-6" style={panelStyle}>
        <ListHeader title={`Platforms (${items.length})`} onAdd={() => update('items', [...items, { name: '', logoPath: '', displayMode: 'text', products: '' }])} />
        {items.map((item: any, i: number) => (
          <div key={i} className="mb-4 p-4" style={{ border: '1px solid var(--border)' }}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" value={item.name} onChange={v => { const a = [...items]; a[i] = { ...a[i], name: v }; update('items', a); }} />
              <LogoField label="Logo" value={item.logoPath} onChange={v => { const a = [...items]; a[i] = { ...a[i], logoPath: v }; update('items', a); }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block mb-4">
                <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>Display Mode</span>
                <select value={item.displayMode} onChange={e => { const a = [...items]; a[i] = { ...a[i], displayMode: e.target.value }; update('items', a); }} className="block w-full mt-1 px-3 py-2 text-sm" style={inputStyle}>
                  <option value="logo">Logo</option>
                  <option value="text">Text Only</option>
                </select>
              </label>
              <Field label="Products" value={item.products} onChange={v => { const a = [...items]; a[i] = { ...a[i], products: v }; update('items', a); }} />
            </div>
            <RemoveBtn onClick={() => update('items', items.filter((_: any, j: number) => j !== i))} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Partnership ───
function PartnershipForm({ data, update }: FormProps) {
  const bulletPoints = data.bulletPoints || [];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6" style={panelStyle}>
          <Field label="Section Heading" value={data.heading} onChange={v => update('heading', v)} />
          <Field label="Partner Name" value={data.partnerName} onChange={v => update('partnerName', v)} />
          <LogoField label="Logo" value={data.logoPath} onChange={v => update('logoPath', v)} />
          <Field label="Badge Text" value={data.badgeText} onChange={v => update('badgeText', v)} />
        </div>
        <div className="p-6" style={panelStyle}>
          <Field label="Card Heading" value={data.cardHeading} onChange={v => update('cardHeading', v)} />
          <Field label="Description" value={data.description} onChange={v => update('description', v)} textarea />
        </div>
      </div>
      <div className="p-6" style={panelStyle}>
        <ListHeader title={`Bullet Points (${bulletPoints.length})`} onAdd={() => update('bulletPoints', [...bulletPoints, ''])} />
        {bulletPoints.map((bp: string, i: number) => (
          <div key={i} className="flex gap-2 mb-2">
            <input type="text" value={bp} onChange={e => { const a = [...bulletPoints]; a[i] = e.target.value; update('bulletPoints', a); }} className="flex-1 px-3 py-2 text-sm" style={inputStyle} />
            <button type="button" onClick={() => update('bulletPoints', bulletPoints.filter((_: any, j: number) => j !== i))} className="font-mono text-xs px-2" style={{ color: '#ef4444' }}>x</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Certifications ───
function CertificationsForm({ data, update }: FormProps) {
  const items = data.items || [];
  return (
    <div className="space-y-6">
      <div className="p-6" style={panelStyle}>
        <Field label="Section Heading" value={data.heading} onChange={v => update('heading', v)} />
      </div>
      <div className="p-6" style={panelStyle}>
        <ListHeader title={`Certifications (${items.length})`} onAdd={() => update('items', [...items, { title: '', subtitle: '', logoPath: '' }])} />
        {items.map((item: any, i: number) => (
          <div key={i} className="mb-4 p-4 grid grid-cols-3 gap-4" style={{ border: '1px solid var(--border)' }}>
            <Field label="Title" value={item.title} onChange={v => { const a = [...items]; a[i] = { ...a[i], title: v }; update('items', a); }} />
            <Field label="Subtitle" value={item.subtitle} onChange={v => { const a = [...items]; a[i] = { ...a[i], subtitle: v }; update('items', a); }} />
            <div>
              <LogoField label="Logo" value={item.logoPath} onChange={v => { const a = [...items]; a[i] = { ...a[i], logoPath: v }; update('items', a); }} />
              <RemoveBtn onClick={() => update('items', items.filter((_: any, j: number) => j !== i))} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Testimonials ───
function TestimonialsForm({ data, update }: FormProps) {
  const items = data.items || [];
  return (
    <div className="space-y-6">
      <div className="p-6" style={panelStyle}>
        <Field label="Section Heading" value={data.heading} onChange={v => update('heading', v)} />
      </div>
      <div className="p-6" style={panelStyle}>
        <ListHeader title={`Testimonials (${items.length})`} onAdd={() => update('items', [...items, { quote: '', name: '', company: '' }])} />
        {items.map((item: any, i: number) => (
          <div key={i} className="mb-6 p-4" style={{ border: '1px solid var(--border)' }}>
            <Field label="Quote" value={item.quote} onChange={v => { const a = [...items]; a[i] = { ...a[i], quote: v }; update('items', a); }} textarea />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name & Title" value={item.name} onChange={v => { const a = [...items]; a[i] = { ...a[i], name: v }; update('items', a); }} />
              <Field label="Company" value={item.company} onChange={v => { const a = [...items]; a[i] = { ...a[i], company: v }; update('items', a); }} />
            </div>
            <RemoveBtn onClick={() => update('items', items.filter((_: any, j: number) => j !== i))} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Careers ───
function CareersForm({ data, update }: FormProps) {
  const cards = data.cards || [];
  return (
    <div className="space-y-6">
      <div className="p-6" style={panelStyle}>
        <Field label="Super Label" value={data.superLabel} onChange={v => update('superLabel', v)} />
        <Field label="Heading" value={data.heading} onChange={v => update('heading', v)} />
        <Field label="Body" value={data.body} onChange={v => update('body', v)} textarea />
      </div>
      <div className="p-6" style={panelStyle}>
        <ListHeader title={`Career Cards (${cards.length})`} onAdd={() => update('cards', [...cards, { categoryTag: '', title: '', description: '', perks: ['', '', ''], ctaLabel: 'Apply Now', ctaLink: '' }])} />
        {cards.map((card: any, i: number) => (
          <div key={i} className="mb-6 p-4" style={{ border: '1px solid var(--border)' }}>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Category Tag" value={card.categoryTag} onChange={v => { const a = [...cards]; a[i] = { ...a[i], categoryTag: v }; update('cards', a); }} />
              <Field label="Title" value={card.title} onChange={v => { const a = [...cards]; a[i] = { ...a[i], title: v }; update('cards', a); }} />
            </div>
            <Field label="Description" value={card.description} onChange={v => { const a = [...cards]; a[i] = { ...a[i], description: v }; update('cards', a); }} textarea />
            <span className="font-mono text-xs uppercase tracking-wider block mb-2" style={labelStyle}>Perks</span>
            {(card.perks || []).map((perk: string, pi: number) => (
              <div key={pi} className="flex gap-2 mb-2">
                <input type="text" value={perk} onChange={e => { const a = [...cards]; const perks = [...(a[i].perks || [])]; perks[pi] = e.target.value; a[i] = { ...a[i], perks }; update('cards', a); }} className="flex-1 px-3 py-2 text-sm" style={inputStyle} />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Field label="CTA Label" value={card.ctaLabel} onChange={v => { const a = [...cards]; a[i] = { ...a[i], ctaLabel: v }; update('cards', a); }} />
              <Field label="CTA Link" value={card.ctaLink} onChange={v => { const a = [...cards]; a[i] = { ...a[i], ctaLink: v }; update('cards', a); }} />
            </div>
            <RemoveBtn onClick={() => update('cards', cards.filter((_: any, j: number) => j !== i))} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Contact ───
function ContactForm({ data, update }: FormProps) {
  return (
    <div className="p-6" style={panelStyle}>
      <Field label="Badge Text" value={data.badge} onChange={v => update('badge', v)} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Heading Line 1" value={data.headingLine1} onChange={v => update('headingLine1', v)} />
        <Field label="Heading Line 2" value={data.headingLine2} onChange={v => update('headingLine2', v)} />
      </div>
      <Field label="Body Text" value={data.body} onChange={v => update('body', v)} textarea />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Primary CTA Label" value={data.ctaPrimaryLabel} onChange={v => update('ctaPrimaryLabel', v)} />
        <Field label="Secondary CTA Label" value={data.ctaSecondaryLabel} onChange={v => update('ctaSecondaryLabel', v)} />
      </div>
      <p className="font-mono text-xs mt-4" style={{ color: 'var(--steel)' }}>Phone, email, and address are pulled from Site Settings.</p>
    </div>
  );
}

// ─── Main Editor ───
export default function ContentEditor() {
  const { section } = useParams<{ section: string }>();
  const [data, setData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!section) return;
    setLoaded(false);
    api(`/api/content/${section}`).then(d => { setData(d); setLoaded(true); });
  }, [section]);

  function update(field: string, value: any) {
    setData((prev: any) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api(`/api/content/${section}`, { method: 'PUT', body: JSON.stringify(data) });
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  }

  if (!loaded) return <div style={{ color: 'var(--steel)' }}>Loading...</div>;

  const formProps: FormProps = { data, update };

  return (
    <form onSubmit={handleSave}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>
          {SECTION_TITLES[section || ''] || section}
        </h2>
        <button type="submit" disabled={saving} className="font-mono text-xs px-4 py-2 text-white uppercase" style={{ background: 'var(--glass-blue)' }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      {section === 'hero' && <HeroForm {...formProps} />}
      {section === 'services' && <ServicesForm {...formProps} />}
      {section === 'platforms' && <PlatformsForm {...formProps} />}
      {section === 'partnership' && <PartnershipForm {...formProps} />}
      {section === 'certifications' && <CertificationsForm {...formProps} />}
      {section === 'testimonials' && <TestimonialsForm {...formProps} />}
      {section === 'careers' && <CareersForm {...formProps} />}
      {section === 'contact' && <ContactForm {...formProps} />}
    </form>
  );
}
