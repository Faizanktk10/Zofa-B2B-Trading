import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import SEO from '../components/SEO';

export default function RFQList() {
  const [params, setParams] = useSearchParams();
  const [rfqs, setRfqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const search = params.get('search') || '';
  const categoryId = params.get('categoryId') || '';
  const city = params.get('city') || '';

  const [filters, setFilters] = useState({ search, categoryId, city });

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data));
  }, []);

  const fetchRFQs = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({ page, pageSize: 18 });
    if (filters.search) q.set('search', filters.search);
    if (filters.categoryId) q.set('categoryId', filters.categoryId);
    if (filters.city) q.set('city', filters.city);
    api.get(`/rfqs?${q}`).then(r => {
      setRfqs(r.data.items);
      setTotal(r.data.total);
    }).finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => {
    fetchRFQs();
  }, [fetchRFQs]);

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    setParams(filters);
  };

  return (
    <div className="container py-4">
      <SEO title="RFQ Marketplace" description="Browse thousands of RFQs from Pakistani buyers looking for suppliers of scrap, textile, agriculture, machinery and more." keywords="RFQ Pakistan, buy scrap Pakistan, textile RFQ, machinery buyers Pakistan" />
      <div className="row g-4">
        {/* Sidebar Filters */}
        <div className="col-md-3">
          <div className="card border-0 shadow-sm p-3 sticky-top" style={{ top: '80px' }}>
            <h6 className="fw-bold mb-3">🔍 Filter RFQs</h6>
            <form onSubmit={applyFilters}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Search</label>
                <input className="form-control form-control-sm" placeholder="Keywords..."
                  value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Category</label>
                <select className="form-select form-select-sm"
                  value={filters.categoryId} onChange={e => setFilters({ ...filters, categoryId: e.target.value })}>
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label small fw-semibold">City</label>
                <input className="form-control form-control-sm" placeholder="e.g. Karachi"
                  value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-sm w-100 fw-semibold" style={{ background: '#e94560', color: '#fff' }}>
                Apply Filters
              </button>
              <button type="button" className="btn btn-sm btn-light w-100 mt-2"
                onClick={() => { setFilters({ search: '', categoryId: '', city: '' }); setPage(1); }}>
                Clear
              </button>
            </form>
          </div>
        </div>

        {/* RFQ Grid */}
        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">
              {total} RFQs Found
              {filters.search && <span className="text-muted fw-normal fs-6"> for &quot;{filters.search}&quot;</span>}
            </h5>
            <Link to="/dashboard/buyer/post-rfq" className="btn btn-sm fw-semibold" style={{ background: '#e94560', color: '#fff' }}>
              + Post RFQ
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5"><div className="spinner-border" style={{ color: '#e94560' }} /></div>
          ) : rfqs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div style={{ fontSize: '3rem' }}>📋</div>
              <p>No RFQs found. Try different filters.</p>
            </div>
          ) : (
            <div className="row g-3">
              {rfqs.map(rfq => (
                <div className="col-md-6 col-lg-4" key={rfq.rfqId}>
                  <Link to={`/rfqs/${rfq.rfqId}`} className="text-decoration-none">
                    <div className="card h-100 border-0 shadow-sm"
                      style={{ transition: 'transform 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                      <div className="card-body">
                        {rfq.isFeatured && (
                          <span className="badge mb-2" style={{ background: '#e94560' }}>⭐ Featured</span>
                        )}
                        <h6 className="fw-bold text-dark mb-2">{rfq.title}</h6>
                        <p className="text-muted small mb-2">📦 {rfq.quantity} {rfq.unit}</p>
                        <p className="text-muted small mb-2">📍 {rfq.deliveryCity || 'Pakistan'}</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="badge bg-light text-dark border small">{rfq.categoryName}</span>
                          <span className="text-muted small">{rfq.quotationCount} quotes</span>
                        </div>
                      </div>
                      <div className="card-footer bg-transparent border-top-0 small text-muted">
                        🏢 {rfq.buyerCompany} · {new Date(rfq.createdAt).toLocaleDateString('en-PK')}
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {total > 18 && (
            <div className="d-flex justify-content-center mt-4 gap-2">
              <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="btn btn-sm btn-light disabled">Page {page} of {Math.ceil(total / 18)}</span>
              <button className="btn btn-outline-secondary btn-sm" disabled={page >= Math.ceil(total / 18)} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
