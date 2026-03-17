import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, apiUpload } from '../api';
import ServiceBadges from '../components/ServiceBadges';

interface Photo {
  id: number;
  path: string;
  label: string;
  serviceTags: string[];
  displayOrder: number;
}

interface ProjectData {
  id?: number;
  title: string;
  category: string;
  description: string;
  location: string;
  year: string;
  sqft: string;
  duration: string;
  value: string;
  services: string[];
  coverImage: string;
  gridCoord: string;
  status: string;
  photos?: Photo[];
}

const EMPTY: ProjectData = {
  title: '', category: '', description: '', location: '',
  year: '', sqft: '', duration: '', value: '',
  services: [], coverImage: '', gridCoord: '', status: 'draft',
};

export default function ProjectEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [data, setData] = useState<ProjectData>(EMPTY);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isNew) {
      api(`/api/projects/${id}`).then((proj: any) => {
        setData({ ...proj, services: typeof proj.services === 'string' ? JSON.parse(proj.services) : proj.services || [] });
        setPhotos((proj.photos || []).map((p: any) => ({ ...p, serviceTags: typeof p.serviceTags === 'string' ? JSON.parse(p.serviceTags) : p.serviceTags || [] })));
      });
    }
  }, [id, isNew]);

  function update(field: keyof ProjectData, value: any) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const result = await api<{ id: number }>('/api/projects', { method: 'POST', body: JSON.stringify(data) });
        navigate(`/projects/${result.id}`);
      } else {
        await api(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
      }
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  }

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || isNew) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('photos', f));
    try {
      const newPhotos = await apiUpload<Photo[]>(`/api/projects/${id}/photos`, formData);
      setPhotos(prev => [...prev, ...newPhotos]);
    } catch (err: any) { alert(err.message); } finally { setUploading(false); e.target.value = ''; }
  }

  async function handleDeletePhoto(photoId: number) {
    if (!confirm('Delete this photo?')) return;
    await api(`/api/projects/${id}/photos/${photoId}`, { method: 'DELETE' });
    setPhotos(prev => prev.filter(p => p.id !== photoId));
  }

  async function handleDelete() {
    if (!confirm(`Delete "${data.title}"? This cannot be undone.`)) return;
    await api(`/api/projects/${id}`, { method: 'DELETE' });
    navigate('/projects');
  }

  const inputStyle = { background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' };
  const labelStyle = { color: 'var(--steel)' };

  return (
    <form onSubmit={handleSave}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm uppercase tracking-wider" style={{ color: 'var(--silver)' }}>{isNew ? 'New Project' : `Edit: ${data.title}`}</h2>
        <div className="flex gap-2">
          {!isNew && <button type="button" onClick={handleDelete} className="font-mono text-xs px-4 py-2" style={{ color: '#ef4444', border: '1px solid #ef4444' }}>Delete</button>}
          <button type="submit" disabled={saving} className="font-mono text-xs px-4 py-2 text-white uppercase" style={{ background: 'var(--glass-blue)' }}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <label className="block mb-4">
            <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>Title</span>
            <input type="text" value={data.title} onChange={e => update('title', e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={inputStyle} />
          </label>
          <label className="block mb-4">
            <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>Category</span>
            <select value={data.category} onChange={e => update('category', e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={inputStyle}>
              <option value="">Select category...</option>
              <option value="Commercial">Commercial</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Retail">Retail</option>
              <option value="Civic">Civic</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Industrial">Industrial</option>
              <option value="Residential">Residential</option>
              <option value="Mixed-Use">Mixed-Use</option>
              <option value="Religious">Religious</option>
            </select>
          </label>
          <label className="block mb-4">
            <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>Description</span>
            <textarea value={data.description} onChange={e => update('description', e.target.value)} rows={4} className="block w-full mt-1 px-3 py-2 text-sm" style={{ ...inputStyle, resize: 'vertical' }} />
          </label>
          <label className="block mb-4">
            <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>Grid Coordinate</span>
            <input type="text" value={data.gridCoord} onChange={e => update('gridCoord', e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={inputStyle} />
          </label>
          <div className="mb-4">
            <span className="font-mono text-xs uppercase tracking-wider block mb-2" style={labelStyle}>Status</span>
            <select value={data.status} onChange={e => update('status', e.target.value)} className="px-3 py-2 text-sm" style={inputStyle}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
        <div className="p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <label className="block mb-4">
            <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>Location</span>
            <input type="text" value={data.location} onChange={e => update('location', e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={inputStyle} />
          </label>
          <label className="block mb-4">
            <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>Year</span>
            <input type="text" value={data.year} onChange={e => update('year', e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={inputStyle} />
          </label>
          <label className="block mb-4">
            <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>Square Footage</span>
            <input type="text" value={data.sqft} onChange={e => update('sqft', e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={inputStyle} />
          </label>
          <label className="block mb-4">
            <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>Duration</span>
            <input type="text" value={data.duration} onChange={e => update('duration', e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={inputStyle} />
          </label>
          <label className="block mb-4">
            <span className="font-mono text-xs uppercase tracking-wider" style={labelStyle}>Value</span>
            <input type="text" value={data.value} onChange={e => update('value', e.target.value)} className="block w-full mt-1 px-3 py-2 text-sm" style={inputStyle} />
          </label>
        </div>
      </div>
      <div className="mt-6 p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span className="font-mono text-xs uppercase tracking-wider block mb-3" style={{ color: 'var(--steel)' }}>Services</span>
        <ServiceBadges selected={data.services} onChange={s => update('services', s)} />
      </div>
      {!isNew && (
        <div className="mt-6 p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--steel)' }}>Photos ({photos.length})</span>
            <label className="font-mono text-xs px-4 py-2 text-white uppercase cursor-pointer" style={{ background: 'var(--glass-blue)' }}>
              {uploading ? 'Uploading...' : '+ Upload'}
              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => (
              <div key={photo.id} style={{ border: '1px solid var(--border)' }}>
                <img src={photo.path} alt={photo.label} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <input type="text" value={photo.label} onChange={e => { const newLabel = e.target.value; setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, label: newLabel } : p)); api(`/api/projects/${id}/photos/${photo.id}`, { method: 'PUT', body: JSON.stringify({ label: newLabel }) }); }} placeholder="Label" className="w-full text-xs px-2 py-1 mb-2" style={{ background: 'var(--navy-black)', border: '1px solid var(--border)', color: 'var(--silver)' }} />
                  <ServiceBadges selected={photo.serviceTags} onChange={tags => { setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, serviceTags: tags } : p)); api(`/api/projects/${id}/photos/${photo.id}`, { method: 'PUT', body: JSON.stringify({ serviceTags: tags }) }); }} />
                  <button type="button" onClick={() => handleDeletePhoto(photo.id)} className="text-xs mt-2" style={{ color: '#ef4444' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          {photos.length === 0 && <p className="text-center py-8 text-sm" style={{ color: 'var(--steel)' }}>No photos yet. Upload some above.</p>}
        </div>
      )}
    </form>
  );
}
