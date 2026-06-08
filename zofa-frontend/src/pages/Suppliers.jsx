import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import SEO from '../components/SEO';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (s = search, c = city) => {
    setLoading(true);
    const q = new URLSearchParams();
    if (s) q.set('search', s);
    if (c) q.set('city', c);
    api.get(`/suppliers?${q}`)
      .then(r => setSuppliers(r.data || []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false));
  };

  // Optional: preload category filter from URL (?category=slug)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categorySlug = params.get('category');

    if (!categorySlug) {
      load('', '');
      return;
    }

    // Map slug -> visible businessType used by backend
    const slugToBusinessType = {
      scrap: 'Scrap',
      textile: 'Textile',
      agriculture: 'Agriculture',
      machinery: 'Machinery',
      packaging: 'Packaging',
      'raw-materials': 'Raw Materials',
      chemicals: 'Chemicals',
      electronics: 'Electronics',
    };

    const mappedType = slugToBusinessType[categorySlug];
    if (mappedType) {
      setBusinessType(mappedType);
    }

    load('', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleApply = () => load(search, city);

  const handleClear = () => {
    setSearch('');
    setCity('');
    setBusinessType('');
    load('', '');
  };

  const filtered = businessType
    ? suppliers.filter(s => s.businessType === businessType)
    : suppliers;

  const businessTypes = [...new Set(suppliers.map(s => s.businessType).filter(Boolean))];


  return (
    <div className="container py-4">
      <SEO title="Find Suppliers" description="Browse verified Pakistani suppliers for scrap, textile, agriculture, machinery, chemicals and more on Zofa B2B Trading." />
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h4 className="fw-bold mb-1">Supplier Marketplace</h4>
          <p className="text-muted small mb-0">Discover verified B2B suppliers by city, category, and business type.</p>
        </div>
        <span className="badge text-bg-light border">{filtered.length} suppliers</span>
      </div>

      <div className="card border-0 shadow-sm p-3 p-md-4 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold mb-1">Search</label>
            <input className="form-control" placeholder="Supplier or company name"
              value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApply()} />
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label small fw-semibold mb-1">City</label>
            <input className="form-control" placeholder="City"
              value={city} onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleApply()} />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold mb-1">Type</label>
            <select className="form-select" value={businessType} onChange={e => setBusinessType(e.target.value)}>
              <option value="">All</option>
              {businessTypes.map(type => <option key={type}>{type}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3 d-flex gap-2">
            <button className="btn fw-semibold flex-fill" style={{ background: '#e94560', color: '#fff' }}
              onClick={handleApply}>Search</button>
            <button className="btn btn-outline-secondary" onClick={handleClear}>✕</button>
          </div>
        </div>
      </div>

      {loading && suppliers.length === 0 ? (
        <div className="row g-3">
          {[1,2,3,4,5,6].map(i => (
            <div className="col-md-6 col-lg-4" key={i}>
              <div className="card border-0 shadow-sm h-100 p-3">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="rounded-circle bg-light" style={{ width: 52, height: 52, flexShrink: 0 }} />
                  <div className="flex-grow-1">
                    <div className="bg-light rounded mb-1" style={{ height: 14, width: '60%' }} />
                    <div className="bg-light rounded" style={{ height: 12, width: '40%' }} />
                  </div>
                </div>
                <div className="bg-light rounded" style={{ height: 12, width: '80%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`row g-3 ${loading ? 'opacity-50' : ''}`} style={{ transition: 'opacity 0.2s' }}>
          {filtered.map(s => (
            <div className="col-md-6 col-lg-4" key={s.userId}>
              <Link to={`/suppliers/${s.userId}`} className="text-decoration-none">
                <div className="card border-0 shadow-sm h-100 p-3 supplier-market-card"
                  style={{ transition: 'transform 0.15s' }}
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
                  <div className="d-flex gap-2 flex-wrap mb-2">
                    {s.isPremium && <span className="badge bg-warning text-dark">⭐ Premium</span>}
                    {s.isFeatured && <span className="badge" style={{ background: '#e94560' }}>Featured</span>}
                    {s.businessType && <span className="badge bg-light text-dark border">{s.businessType}</span>}
                  </div>
                  {s.description && (
                    <p className="text-muted small mb-0"
                      style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {s.description}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-12 text-center text-muted py-5">
              <div style={{ fontSize: '3rem' }}>🏭</div>
              <p>No suppliers found. Try different filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
