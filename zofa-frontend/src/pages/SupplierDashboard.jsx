import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { ListCardSkeleton, TableSkeleton } from '../components/PageSkeleton';

export default function SupplierDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState('rfqs');
  const [rfqs, setRfqs] = useState([]);
  const [rfqTotal, setRfqTotal] = useState(0);
  const [rfqPage, setRfqPage] = useState(1);
  const [rfqLoading, setRfqLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', categoryId: '', city: '' });

  const [quotes, setQuotes] = useState([]);
  const [quotesLoading, setQuotesLoading] = useState(false);

  const [subStatus, setSubStatus] = useState(null);

  // Quote form state per RFQ
  const [quoteForm, setQuoteForm] = useState({});
  const [quoteMsg, setQuoteMsg] = useState({});
  const [submitting, setSubmitting] = useState({});

  const loadRFQs = useCallback(() => {
    setRfqLoading(true);
    const q = new URLSearchParams({ page: rfqPage, pageSize: 10 });
    if (filters.search) q.set('search', filters.search);
    if (filters.categoryId) q.set('categoryId', filters.categoryId);
    if (filters.city) q.set('city', filters.city);
    api.get(`/rfqs?${q}`)
      .then(r => { setRfqs(r.data.items || []); setRfqTotal(r.data.total || 0); })
      .catch(() => {})
      .finally(() => setRfqLoading(false));
  }, [rfqPage, filters]);

  const loadMyQuotes = useCallback(() => {
    setQuotesLoading(true);
    api.get('/quotations/my')
      .then(r => setQuotes(r.data || []))
      .catch(() => {})
      .finally(() => setQuotesLoading(false));
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'Supplier') { navigate('/login'); return; }
    api.get('/categories').then(r => setCategories(r.data || [])).catch(() => {});
    api.get('/subscriptions/status').then(r => setSubStatus(r.data)).catch(() => {});
    loadRFQs();
    loadMyQuotes();
  }, [user, navigate, loadRFQs, loadMyQuotes]);

  const isPremium = subStatus?.planType === 'Premium' && subStatus?.isActive;

  const applyFilters = (e) => {
    e.preventDefault();
    setRfqPage(1);
    loadRFQs();
  };

  const getForm = (rfqId) => quoteForm[rfqId] || { unitPrice: '', totalPrice: '', deliveryDays: '', message: '' };
  const setForm = (rfqId, field, val) =>
    setQuoteForm(prev => ({ ...prev, [rfqId]: { ...getForm(rfqId), [field]: val } }));

  const submitQuote = async (e, rfqId) => {
    e.preventDefault();
    const f = getForm(rfqId);
    setSubmitting(prev => ({ ...prev, [rfqId]: true }));
    setQuoteMsg(prev => ({ ...prev, [rfqId]: '' }));
    try {
      await api.post('/quotations', {
        rfqId,
        unitPrice: +f.unitPrice,
        totalPrice: +f.totalPrice,
        deliveryDays: +f.deliveryDays,
        message: f.message
      });
      setQuoteMsg(prev => ({ ...prev, [rfqId]: 'success' }));
      loadMyQuotes();
    } catch (err) {
      setQuoteMsg(prev => ({ ...prev, [rfqId]: err.response?.data?.message || 'Failed to submit.' }));
    } finally {
      setSubmitting(prev => ({ ...prev, [rfqId]: false }));
    }
  };

  const pendingCount = quotes.filter(q => q.status === 'Pending').length;
  const acceptedCount = quotes.filter(q => q.status === 'Accepted').length;

  return (
    <div style={{ background: '#f4f6fb', minHeight: '100vh' }}>
      <SEO title="Supplier Dashboard" />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }} className="py-4">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="fw-bold text-white mb-0">👋 Welcome, {user?.fullName}</h4>
              <p className="text-white-50 small mb-0">Supplier Dashboard — Browse RFQs and manage your quotes</p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/profile/edit" className="btn btn-sm btn-outline-light">✏️ Edit Profile</Link>
              <Link to="/messages" className="btn btn-sm btn-outline-light">💬 Messages</Link>
              {!isPremium && (
                <Link to="/pricing" className="btn btn-sm fw-bold" style={{ background: '#e94560', color: '#fff' }}>
                  ⭐ Upgrade
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">

        {/* Premium Banner */}
        {!isPremium && (
          <div className="alert border-0 mb-4 p-3" style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: '#fff' }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <strong>🚀 Upgrade to Premium</strong>
                <p className="mb-0 small opacity-75">Unlimited quotes per day · Priority listing · Verified badge</p>
              </div>
              <Link to="/upgrade" className="btn btn-warning btn-sm fw-bold">Upgrade — PKR 2,500/mo</Link>
            </div>
          </div>
        )}

        {isPremium && subStatus?.endDate && (
          <div className="alert alert-success py-2 mb-4">
            ⭐ Premium active until <strong>{new Date(subStatus.endDate).toLocaleDateString('en-PK')}</strong>
          </div>
        )}

        {/* Stats */}
        <div className="row g-3 mb-4">
          {[
            { label: 'Quotes Sent', value: quotes.length, icon: '📤', color: '#0f3460', sub: 'All time' },
            { label: 'Pending', value: pendingCount, icon: '⏳', color: '#f39c12', sub: 'Awaiting response' },
            { label: 'Accepted', value: acceptedCount, icon: '✅', color: '#27ae60', sub: 'Won deals' },
            { label: 'Plan', value: isPremium ? 'Premium' : 'Free', icon: isPremium ? '⭐' : '🔓', color: '#e94560', sub: isPremium ? 'Active' : '5 quotes/day' },
          ].map(s => (
            <div className="col-6 col-md-3" key={s.label}>
              <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: `4px solid ${s.color}` }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted small">{s.label}</div>
                    <div className={`fw-bold fs-3 ${s.label === 'Plan' && isPremium ? 'text-warning' : ''}`}>{s.value}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{s.sub}</div>
                  </div>
                  <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom p-0">
            <ul className="nav nav-tabs border-0 px-3">
              <li className="nav-item">
                <button className={`nav-link ${tab === 'rfqs' ? 'active fw-semibold' : ''}`} onClick={() => setTab('rfqs')}>
                  📋 Browse RFQs
                  {rfqTotal > 0 && <span className="badge bg-success ms-2" style={{ fontSize: '0.65rem' }}>{rfqTotal} open</span>}
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${tab === 'quotes' ? 'active fw-semibold' : ''}`} onClick={() => setTab('quotes')}>
                  💬 My Quotes
                  {pendingCount > 0 && <span className="badge bg-warning text-dark ms-2" style={{ fontSize: '0.65rem' }}>{pendingCount} pending</span>}
                </button>
              </li>
            </ul>
          </div>

          <div className="card-body p-0">

            {/* ── Browse RFQs Tab ── */}
            {tab === 'rfqs' && (
              <div className="p-4">
                {/* Filters */}
                <form onSubmit={applyFilters} className="row g-2 mb-4 align-items-end">
                  <div className="col-md-4">
                    <input className="form-control form-control-sm" placeholder="Search keywords..."
                      value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
                  </div>
                  <div className="col-md-3">
                    <select className="form-select form-select-sm"
                      value={filters.categoryId} onChange={e => setFilters({ ...filters, categoryId: e.target.value })}>
                      <option value="">All Categories</option>
                      {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <input className="form-control form-control-sm" placeholder="City e.g. Karachi"
                      value={filters.city} onChange={e => setFilters({ ...filters, city: e.target.value })} />
                  </div>
                  <div className="col-md-2 d-flex gap-1">
                    <button type="submit" className="btn btn-sm fw-semibold flex-fill" style={{ background: '#e94560', color: '#fff' }}>
                      Search
                    </button>
                    <button type="button" className="btn btn-sm btn-light"
                      onClick={() => { setFilters({ search: '', categoryId: '', city: '' }); setRfqPage(1); }}>
                      ✕
                    </button>
                  </div>
                </form>

                {rfqLoading && rfqs.length === 0 ? (
                  <ListCardSkeleton count={4} />
                ) : rfqs.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <div style={{ fontSize: '3rem' }}>📋</div>
                    <p>No open RFQs found. Try different filters.</p>
                  </div>
                ) : (
                  <div className={`d-flex flex-column gap-3 ${rfqLoading ? 'opacity-50' : ''}`} style={{ transition: 'opacity 0.2s' }}>
                    {rfqs.map(rfq => {
                      const f = getForm(rfq.rfqId);
                      const msg = quoteMsg[rfq.rfqId];
                      const busy = submitting[rfq.rfqId];
                      return (
                        <div key={rfq.rfqId} className="card border-0 shadow-sm">
                          <div className="card-body">
                            <div className="row g-3">
                              {/* RFQ Info */}
                              <div className="col-lg-7">
                                <div className="d-flex align-items-start gap-2 mb-2">
                                  {rfq.isFeatured && (
                                    <span className="badge" style={{ background: '#e94560', fontSize: '0.7rem' }}>⭐ Featured</span>
                                  )}
                                  <span className="badge bg-success" style={{ fontSize: '0.7rem' }}>Open</span>
                                </div>
                                <h6 className="fw-bold mb-2">{rfq.title}</h6>
                                <div className="d-flex flex-wrap gap-3 text-muted small mb-2">
                                  <span>📦 {rfq.quantity} {rfq.unit}</span>
                                  <span>📍 {rfq.deliveryCity || 'Pakistan'}</span>
                                  <span>🏷️ {rfq.categoryName}</span>
                                  <span>💬 {rfq.quotationCount} quotes</span>
                                  <span>🏢 {rfq.buyerCompany}</span>
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                  Posted {new Date(rfq.createdAt).toLocaleDateString('en-PK')}
                                </div>
                              </div>

                              {/* Quote Form */}
                              <div className="col-lg-5">
                                {msg === 'success' ? (
                                  <div className="alert alert-success py-2 small mb-0">
                                    ✅ Quote submitted! View in My Quotes tab.
                                  </div>
                                ) : (
                                  <form onSubmit={e => submitQuote(e, rfq.rfqId)}>
                                    {msg && (
                                      <div className="alert alert-danger py-1 small mb-2">{msg}</div>
                                    )}
                                    <div className="row g-2 mb-2">
                                      <div className="col-6">
                                        <input type="number" className="form-control form-control-sm" placeholder="Unit Price (PKR)" required min="0"
                                          value={f.unitPrice} onChange={e => setForm(rfq.rfqId, 'unitPrice', e.target.value)} />
                                      </div>
                                      <div className="col-6">
                                        <input type="number" className="form-control form-control-sm" placeholder="Total Price (PKR)" required min="0"
                                          value={f.totalPrice} onChange={e => setForm(rfq.rfqId, 'totalPrice', e.target.value)} />
                                      </div>
                                      <div className="col-6">
                                        <input type="number" className="form-control form-control-sm" placeholder="Delivery Days" required min="1"
                                          value={f.deliveryDays} onChange={e => setForm(rfq.rfqId, 'deliveryDays', e.target.value)} />
                                      </div>
                                      <div className="col-6">
                                        <input className="form-control form-control-sm" placeholder="Message (optional)"
                                          value={f.message} onChange={e => setForm(rfq.rfqId, 'message', e.target.value)} />
                                      </div>
                                    </div>
                                    <button type="submit" className="btn btn-sm w-100 fw-semibold" disabled={busy}
                                      style={{ background: '#e94560', color: '#fff' }}>
                                      {busy ? 'Submitting...' : '📤 Submit Quote'}
                                    </button>
                                  </form>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                {rfqTotal > 10 && (
                  <div className="d-flex justify-content-center mt-4 gap-2">
                    <button className="btn btn-outline-secondary btn-sm" disabled={rfqPage === 1}
                      onClick={() => setRfqPage(p => p - 1)}>← Prev</button>
                    <span className="btn btn-sm btn-light disabled">Page {rfqPage} of {Math.ceil(rfqTotal / 10)}</span>
                    <button className="btn btn-outline-secondary btn-sm" disabled={rfqPage >= Math.ceil(rfqTotal / 10)}
                      onClick={() => setRfqPage(p => p + 1)}>Next →</button>
                  </div>
                )}
              </div>
            )}

            {/* ── My Quotes Tab ── */}
            {tab === 'quotes' && (
              <div className="p-0">
                {quotesLoading && quotes.length === 0 ? (
                  <div className="p-3"><TableSkeleton rows={4} cols={6} /></div>
                ) : quotes.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <div style={{ fontSize: '3rem' }}>📤</div>
                    <p className="mt-2">No quotes submitted yet.</p>
                    <button className="btn btn-sm fw-semibold" style={{ background: '#e94560', color: '#fff' }}
                      onClick={() => setTab('rfqs')}>
                      Browse RFQs →
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                          <th className="ps-4">RFQ Title</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                          <th>Delivery</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th className="pe-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotes.map(q => (
                          <tr key={q.quotationId}>
                            <td className="ps-4 fw-semibold">{q.rfqTitle}</td>
                            <td>PKR {q.unitPrice?.toLocaleString()}</td>
                            <td>PKR {q.totalPrice?.toLocaleString()}</td>
                            <td>{q.deliveryDays} days</td>
                            <td>
                              <span className={`badge ${q.status === 'Accepted' ? 'bg-success' : q.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                {q.status}
                              </span>
                            </td>
                            <td className="text-muted small">{new Date(q.createdAt).toLocaleDateString('en-PK')}</td>
                            <td className="pe-4">
                              {q.status === 'Accepted' ? (
                                <button className="btn btn-sm fw-semibold"
                                  style={{ background: '#e94560', color: '#fff' }}
                                  onClick={() => navigate(`/messages?with=${q.buyerId}`)}>
                                  💬 Contact Buyer
                                </button>
                              ) : (
                                <span className="text-muted small">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
