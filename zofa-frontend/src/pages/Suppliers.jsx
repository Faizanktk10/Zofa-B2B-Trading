import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import SEO from '../components/SEO';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (city) q.set('city', city);
    api.get(`/suppliers?${q}`).then(r => setSuppliers(r.data)).finally(() => setLoading(false));
  }, [search, city]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="container py-4">
      <SEO title="Find Suppliers" description="Browse verified Pakistani suppliers for scrap, textile, agriculture, machinery, chemicals and more on Zofa B2B Trading." />
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-bold mb-1">Supplier Marketplace</h4>
          <p className="text-muted small mb-0">Discover verified B2B suppliers by city, category, and business type.</p>
        </div>
        <span className="badge text-bg-light border">{suppliers.length} suppliers</span>
      </div>

      <div className="card border-0 shadow-sm p-3 p-md-4 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-5">
            <label className="form-label small fw-semibold mb-1">Search</label>
            <input className="form-control" placeholder="Supplier or company name"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold mb-1">City</label>
            <input className="form-control" placeholder="City"
              value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold mb-1">Type</label>
            <select className="form-select" value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
              <option value="">All</option>
              {[...new Set(suppliers.map((s) => s.businessType).filter(Boolean))].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-2 d-grid">
            <button className="btn fw-semibold" style={{ background: '#e94560', color: '#fff' }} onClick={load}>Apply</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: '#e94560' }} /></div>
      ) : (
        <div className="row g-3">
          {suppliers
            .filter((s) => !businessType || s.businessType === businessType)
            .map(s => (
            <div className="col-md-6 col-lg-4" key={s.userId}>
              <Link to={`/suppliers/${s.userId}`} className="text-decoration-none">
                <div className="card border-0 shadow-sm h-100 p-3 supplier-market-card"
                  style={{ transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                      style={{ width: 52, height: 52, background: '#0f3460', fontSize: '1.2rem', flexShrink: 0 }}>
                      {(s.companyName || s.fullName)[0]}
                    </div>
                    <div>
                      <div className="fw-bold text-dark">{s.companyName || s.fullName}</div>
                      <div className="text-muted small">{s.city || 'Pakistan'}</div>
                    </div>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    {s.isPremium && <span className="badge bg-warning text-dark">⭐ Premium</span>}
                    {s.isFeatured && <span className="badge" style={{ background: '#e94560' }}>Featured</span>}
                    {s.businessType && <span className="badge bg-light text-dark border">{s.businessType}</span>}
                  </div>
                  <div className="mt-3 pt-3 border-top">
                    <div className="d-flex flex-wrap gap-2">
                      <span className="badge text-bg-light border">Verified Profile</span>
                      <span className="badge text-bg-light border">Quick Response</span>
                      <span className="badge text-bg-light border">{s.city || 'Pakistan'}</span>
                    </div>
                  </div>
                  {s.description && (
                    <p className="text-muted small mt-2 mb-0"
                      style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {s.description}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          ))}
          {suppliers.filter((s) => !businessType || s.businessType === businessType).length === 0 && (
            <div className="col-12 text-center text-muted py-5">
              <div style={{ fontSize: '3rem' }}>🏭</div>
              <p>No suppliers found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
