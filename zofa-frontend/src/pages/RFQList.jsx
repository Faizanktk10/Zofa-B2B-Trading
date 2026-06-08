import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const FILTER_CATEGORIES = [
  { categoryId: 1, name: 'Scrap' },
  { categoryId: 2, name: 'Textile' },
  { categoryId: 3, name: 'Agriculture' },
  { categoryId: 4, name: 'Machinery' },
  { categoryId: 5, name: 'Packaging' },
  { categoryId: 6, name: 'Raw Materials' },
  { categoryId: 7, name: 'Chemicals' },
  { categoryId: 8, name: 'Electronics' },
];

function RFQCardSkeleton() {
  return (
    <div className="col-md-6 col-lg-4">
      <div className="card h-100 border-0 shadow-sm">
        <div className="card-body">
          <div className="placeholder-glow">
            <span className="placeholder col-8 mb-2"></span>
            <span className="placeholder col-6 mb-2"></span>
            <span className="placeholder col-5 mb-3"></span>
            <span className="placeholder col-4"></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RFQList() {
  const [params, setParams] = useSearchParams();
  const [rfqs, setRfqs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const navigate = useNavigate();

  const search = params.get('search') || '';
  const categoryId = params.get('categoryId') || '';
  const city = params.get('city') || '';

  const [filters, setFilters] = useState({ search, categoryId, city });

  const handlePostRFQ = () => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'Buyer') { navigate('/dashboard/supplier'); return; }
    navigate('/dashboard/buyer/post-rfq');
  };

  const isFirstLoad = useRef(true);

  const fetchRFQs = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoading(true);
    else setPageLoading(true);
    setError('');

    const q = new URLSearchParams({ page, pageSize: 18 });
    if (filters.search) q.set('search', filters.search);
    if (filters.categoryId) q.set('categoryId', filters.categoryId);
    if (filters.city) q.set('city', filters.city);

    try {
      const { data } = await api.get(`/rfqs?${q}`);
      setRfqs(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setRfqs([]);
      setTotal(0);
      setError('Could not load RFQs. Please check your connection and try again.');
    } finally {
      if (isInitial) setInitialLoading(false);
      else setPageLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchRFQs(isFirstLoad.current);
    isFirstLoad.current = false;
  }, [fetchRFQs]);

  const applyFilters = (e) => {
    e.preventDefault();
    setPage(1);
    setParams(filters);
  };

  const showSkeletons = initialLoading || (pageLoading && rfqs.length === 0);

  return (
    <div className="container py-4">
      <SEO title="RFQ Marketplace" description="Browse thousands of RFQs from Pakistani buyers looking for suppliers of scrap, textile, agriculture, machinery and more." keywords="RFQ Pakistan, buy scrap Pakistan, textile RFQ, machinery buyers Pakistan" />
      <div className="row g-4">
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
                  {FILTER_CATEGORIES.map(c => (
                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                  ))}
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
                onClick={() => { setFilters({ search: '', categoryId: '', city: '' }); setPage(1); setParams({}); }}>
                Clear
              </button>
            </form>
          </div>
        </div>

        <div className="col-md-9">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">
              {initialLoading ? 'RFQ Marketplace' : `${total} RFQs Found`}
              {!initialLoading && filters.search && (
                <span className="text-muted fw-normal fs-6"> for &quot;{filters.search}&quot;</span>
              )}
            </h5>
            <button onClick={handlePostRFQ} className="btn btn-sm fw-semibold" style={{ background: '#e94560', color: '#fff' }}>
              + Post RFQ
            </button>
          </div>

          {error && <div className="alert alert-warning py-2">{error}</div>}

          {showSkeletons ? (
            <div className="row g-3">
              {Array.from({ length: 6 }).map((_, i) => <RFQCardSkeleton key={i} />)}
            </div>
          ) : rfqs.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div style={{ fontSize: '3rem' }}>📋</div>
              <p>No RFQs found. Try different filters.</p>
            </div>
          ) : (
            <div className={`row g-3 ${pageLoading ? 'opacity-50' : ''}`} style={{ transition: 'opacity 0.2s' }}>
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

          {total > 18 && !initialLoading && (
            <div className="d-flex justify-content-center mt-4 gap-2">
              <button className="btn btn-outline-secondary btn-sm" disabled={page === 1 || pageLoading} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="btn btn-sm btn-light disabled">Page {page} of {Math.ceil(total / 18)}</span>
              <button className="btn btn-outline-secondary btn-sm" disabled={page >= Math.ceil(total / 18) || pageLoading} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
