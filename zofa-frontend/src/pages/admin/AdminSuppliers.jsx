import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { CardGridSkeleton } from '../../components/PageSkeleton';

export default function AdminSuppliers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = search ? `?search=${search}` : '';
    api.get(`/suppliers${q}`).then(r => setSuppliers(r.data)).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    if (!user || user.role !== 'Admin') { navigate('/admin/login'); return; }
    load();
  }, [user, navigate, load]);

  const toggleFeature = async (id, current) => {
    await api.patch(`/admin/suppliers/${id}/feature`, !current, { headers: { 'Content-Type': 'application/json' } });
    setSuppliers(suppliers.map(s => s.userId === id ? { ...s, isFeatured: !current } : s));
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="fw-bold mb-0">🏭 Supplier Management</h5>
        <div className="d-flex gap-2">
          <input className="form-control form-control-sm" style={{ width: 220 }}
            placeholder="Search suppliers..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()} />
          <button className="btn btn-sm btn-dark" onClick={load}>Search</button>
        </div>
      </div>

      {loading && suppliers.length === 0 ? (
        <CardGridSkeleton count={6} />
      ) : (
        <div className={`row g-3 ${loading ? 'opacity-50' : ''}`} style={{ transition: 'opacity 0.2s' }}>
          {suppliers.map(s => (
            <div className="col-md-6 col-lg-4" key={s.userId}>
              <div className="card border-0 shadow-sm p-3 h-100">
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                    style={{ width: 44, height: 44, background: '#0f3460', fontSize: '1.1rem' }}>
                    {(s.companyName || s.fullName)[0]}
                  </div>
                  <div className="overflow-hidden">
                    <div className="fw-bold small text-truncate">{s.companyName || s.fullName}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{s.city || 'Pakistan'}</div>
                  </div>
                </div>
                <div className="d-flex gap-1 flex-wrap mb-3">
                  {s.isPremium && <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>⭐ Premium</span>}
                  {s.isFeatured && <span className="badge" style={{ background: '#e94560', fontSize: '0.65rem' }}>Featured</span>}
                  {s.businessType && <span className="badge bg-light text-dark border" style={{ fontSize: '0.65rem' }}>{s.businessType}</span>}
                </div>
                <div className="d-flex gap-2 mt-auto">
                  <div className="form-check form-switch mb-0 me-auto d-flex align-items-center gap-1">
                    <input className="form-check-input" type="checkbox" checked={s.isFeatured}
                      onChange={() => toggleFeature(s.userId, s.isFeatured)} />
                    <label className="form-check-label small text-muted">Featured</label>
                  </div>
                  <a href={`/suppliers/${s.userId}`} target="_blank" rel="noreferrer"
                    className="btn btn-sm btn-outline-secondary">View</a>
                </div>
              </div>
            </div>
          ))}
          {suppliers.length === 0 && <div className="col-12 text-center text-muted py-4">No suppliers found.</div>}
        </div>
      )}
    </div>
  );
}
