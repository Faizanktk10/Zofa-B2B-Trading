import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FormSkeleton } from '../components/PageSkeleton';

const PROVINCES = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Sukkur'];
const BUSINESS_TYPES = ['Manufacturer', 'Trader', 'Distributor', 'Exporter', 'Importer', 'Wholesaler', 'Retailer', 'Service Provider'];

export default function EditProfile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    phone: '', city: '', province: '', companyName: '',
    businessType: '', yearsInBusiness: 0, description: '', mainProducts: '', website: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/users/me').then(r => {
      const d = r.data;
      setForm({
        phone: d.phone || '',
        city: d.city || '',
        province: d.province || '',
        companyName: d.companyName || '',
        businessType: d.businessType || '',
        yearsInBusiness: d.yearsInBusiness || 0,
        description: d.description || '',
        mainProducts: d.mainProducts || '',
        website: d.website || ''
      });
      if (d.logoUrl) setLogoPreview(d.logoUrl);
    }).finally(() => setLoading(false));
  }, [user, navigate]);

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setLogoPreview(base64);
      setLogoUploading(true);
      try {
        await api.post('/upload/logo', { base64Data: base64 });
      } catch {
        setMsg('❌ Logo upload failed. Check Cloudinary config.');
      } finally {
        setLogoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.put('/users/me', { ...form, yearsInBusiness: parseInt(form.yearsInBusiness) || 0 });
      setMsg('✅ Profile updated successfully!');
      // Update local user name/company
      const updated = { ...user, companyName: form.companyName };
      login({ ...updated, token: localStorage.getItem('token') });
    } catch {
      setMsg('❌ Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FormSkeleton />;

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="position-relative">
                {logoPreview ? (
                  <img src={logoPreview} alt="logo" className="rounded-circle"
                    style={{ width: 56, height: 56, objectFit: 'cover', border: '2px solid #e94560' }} />
                ) : (
                  <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                    style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', fontSize: '1.4rem' }}>
                    {user.fullName[0]}
                  </div>
                )}
                {user.role === 'Supplier' && (
                  <label className="position-absolute bottom-0 end-0 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: 20, height: 20, background: '#e94560', cursor: 'pointer' }}>
                    <span style={{ color: '#fff', fontSize: '0.6rem' }}>✏</span>
                    <input type="file" accept="image/*" className="d-none" onChange={handleLogoChange} />
                  </label>
                )}
              </div>
              <div>
                <h5 className="fw-bold mb-0">{user.fullName}</h5>
                <span className={`badge ${user.role === 'Buyer' ? 'bg-primary' : 'bg-success'}`}>{user.role}</span>
                {user.plan === 'Premium' && <span className="badge bg-warning text-dark ms-1">⭐ Premium</span>}
                {logoUploading && <span className="badge bg-secondary ms-1">Uploading...</span>}
              </div>
            </div>

            {msg && (
              <div className={`alert py-2 mb-3 ${msg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Phone</label>
                  <input className="form-control" placeholder="+92-300-0000000" value={form.phone} onChange={set('phone')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Company Name</label>
                  <input className="form-control" value={form.companyName} onChange={set('companyName')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">City</label>
                  <select className="form-select" value={form.city} onChange={set('city')}>
                    <option value="">Select City</option>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Province</label>
                  <select className="form-select" value={form.province} onChange={set('province')}>
                    <option value="">Select Province</option>
                    {PROVINCES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>

                {/* Supplier-only fields */}
                {user.role === 'Supplier' && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Business Type</label>
                      <select className="form-select" value={form.businessType} onChange={set('businessType')}>
                        <option value="">Select Type</option>
                        {BUSINESS_TYPES.map(b => <option key={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Years in Business</label>
                      <input type="number" className="form-control" min="0" max="100"
                        value={form.yearsInBusiness} onChange={set('yearsInBusiness')} />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Main Products</label>
                      <input className="form-control" placeholder="e.g. Cotton Yarn, Scrap Metal, Sugar (comma-separated)"
                        value={form.mainProducts} onChange={set('mainProducts')} />
                      <div className="form-text">Separate multiple products with commas</div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Company Description</label>
                      <textarea className="form-control" rows={4}
                        placeholder="Describe your business, products, and capabilities..."
                        value={form.description} onChange={set('description')} />
                    </div>
                  </>
                )}

                <div className="col-12 d-flex gap-2">
                  <button type="submit" className="btn fw-semibold px-4" disabled={saving}
                    style={{ background: '#e94560', color: '#fff' }}>
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button type="button" className="btn btn-light px-4"
                    onClick={() => navigate(user.role === 'Buyer' ? '/dashboard/buyer' : '/dashboard/supplier')}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
