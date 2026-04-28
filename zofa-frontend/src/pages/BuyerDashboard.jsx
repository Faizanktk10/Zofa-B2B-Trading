import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState([]);
  const [selectedRFQ, setSelectedRFQ] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [tab, setTab] = useState('rfqs');
  const [loading, setLoading] = useState(true);
  const [quotesLoading, setQuotesLoading] = useState(false);

  const loadRFQs = useCallback(() => {
    setLoading(true);
    api.get('/rfqs/my').then(r => setRfqs(r.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'Buyer') { navigate('/login'); return; }
    loadRFQs();
  }, [user, navigate, loadRFQs]);

  const viewQuotes = async (rfq) => {
    setSelectedRFQ(rfq);
    setTab('quotes');
    setQuotesLoading(true);
    try {
      const { data } = await api.get(`/quotations/rfq/${rfq.rfqId}`);
      setQuotes(data);
    } catch { setQuotes([]); }
    finally { setQuotesLoading(false); }
  };

  const acceptQuote = async (id) => {
    await api.patch(`/quotations/${id}/accept`);
    setQuotes(quotes.map(q => q.quotationId === id ? { ...q, status: 'Accepted' } : q));
    loadRFQs();
  };

  const rejectQuote = async (id) => {
    await api.patch(`/quotations/${id}/reject`);
    setQuotes(quotes.map(q => q.quotationId === id ? { ...q, status: 'Rejected' } : q));
  };

  const closeRFQ = async (rfqId) => {
    await api.patch(`/rfqs/${rfqId}/close`);
    setRfqs(rfqs.map(r => r.rfqId === rfqId ? { ...r, status: 'Closed' } : r));
  };

  const totalQuotes = rfqs.reduce((a, r) => a + r.quotationCount, 0);
  const openRFQs = rfqs.filter(r => r.status === 'Open').length;
  const awardedRFQs = rfqs.filter(r => r.status === 'Awarded').length;

  return (
    <div style={{ background: '#f4f6fb', minHeight: '100vh' }}>
      <SEO title="Buyer Dashboard" />

      {/* Top Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }} className="py-4">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h4 className="fw-bold text-white mb-0">👋 Welcome, {user?.fullName}</h4>
              <p className="text-white-50 small mb-0">Buyer Dashboard — Manage your RFQs and supplier quotes</p>
            </div>
            <div className="d-flex gap-2">
              <Link to="/profile/edit" className="btn btn-sm btn-outline-light">✏️ Edit Profile</Link>
              <Link to="/dashboard/buyer/post-rfq"
                className="btn btn-sm fw-bold px-4"
                style={{ background: '#e94560', color: '#fff' }}>
                + Post New RFQ
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          {[
            { label: 'Total RFQs', value: rfqs.length, icon: '📋', color: '#0f3460', sub: 'All time' },
            { label: 'Open RFQs', value: openRFQs, icon: '🟢', color: '#27ae60', sub: 'Receiving quotes' },
            { label: 'Quotes Received', value: totalQuotes, icon: '💬', color: '#e94560', sub: 'From suppliers' },
            { label: 'Deals Awarded', value: awardedRFQs, icon: '✅', color: '#f39c12', sub: 'Completed' },
          ].map(s => (
            <div className="col-6 col-md-3" key={s.label}>
              <div className="card border-0 shadow-sm p-3 h-100" style={{ borderLeft: `4px solid ${s.color}` }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted small">{s.label}</div>
                    <div className="fw-bold fs-3">{s.value}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{s.sub}</div>
                  </div>
                  <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="row g-3 mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm p-3">
              <div className="d-flex gap-3 flex-wrap align-items-center">
                <span className="fw-semibold text-muted small">QUICK ACTIONS:</span>
                <Link to="/dashboard/buyer/post-rfq" className="btn btn-sm fw-semibold"
                  style={{ background: '#e94560', color: '#fff' }}>📤 Post RFQ</Link>
                <Link to="/rfqs" className="btn btn-sm btn-outline-secondary">🔍 Browse Marketplace</Link>
                <Link to="/categories" className="btn btn-sm btn-outline-secondary">🏭 Find Suppliers</Link>
                <Link to="/messages" className="btn btn-sm btn-outline-secondary">💬 Messages</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white border-bottom p-0">
            <ul className="nav nav-tabs border-0 px-3">
              <li className="nav-item">
                <button className={`nav-link ${tab === 'rfqs' ? 'active fw-semibold' : ''}`}
                  onClick={() => setTab('rfqs')}>
                  📋 My RFQs
                  {openRFQs > 0 && <span className="badge bg-success ms-2" style={{ fontSize: '0.65rem' }}>{openRFQs} open</span>}
                </button>
              </li>
              {selectedRFQ && (
                <li className="nav-item">
                  <button className={`nav-link ${tab === 'quotes' ? 'active fw-semibold' : ''}`}
                    onClick={() => setTab('quotes')}>
                    💬 Quotes — <span className="text-muted fw-normal">{selectedRFQ.title.slice(0, 25)}...</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className="card-body p-0">
            {/* RFQs Tab */}
            {tab === 'rfqs' && (
              loading ? (
                <div className="text-center py-5"><div className="spinner-border" style={{ color: '#e94560' }} /></div>
              ) : rfqs.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{ fontSize: '4rem' }}>📋</div>
                  <h5 className="fw-bold mt-3">No RFQs yet</h5>
                  <p className="text-muted">Post your first RFQ and start receiving quotes from suppliers.</p>
                  <Link to="/dashboard/buyer/post-rfq" className="btn fw-semibold px-4"
                    style={{ background: '#e94560', color: '#fff' }}>
                    Post Your First RFQ
                  </Link>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead style={{ background: '#f8f9fa' }}>
                      <tr>
                        <th className="ps-4">RFQ Title</th>
                        <th>Category</th>
                        <th>Qty / Unit</th>
                        <th>City</th>
                        <th>Quotes</th>
                        <th>Status</th>
                        <th>Posted</th>
                        <th className="pe-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rfqs.map(rfq => (
                        <tr key={rfq.rfqId}>
                          <td className="ps-4">
                            <div className="fw-semibold">{rfq.title}</div>
                            {rfq.isFeatured && <span className="badge" style={{ background: '#e94560', fontSize: '0.6rem' }}>⭐ Featured</span>}
                          </td>
                          <td><span className="badge bg-light text-dark border">{rfq.categoryName}</span></td>
                          <td className="text-muted small">{rfq.quantity} {rfq.unit}</td>
                          <td className="text-muted small">{rfq.deliveryCity || '—'}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary py-0 px-2"
                              onClick={() => viewQuotes(rfq)}>
                              {rfq.quotationCount} Quotes
                              {rfq.quotationCount > 0 && rfq.status === 'Open' && (
                                <span className="ms-1 rounded-circle bg-danger d-inline-block"
                                  style={{ width: 7, height: 7 }} />
                              )}
                            </button>
                          </td>
                          <td>
                            <span className={`badge ${rfq.status === 'Open' ? 'bg-success' : rfq.status === 'Awarded' ? 'bg-primary' : 'bg-secondary'}`}>
                              {rfq.status}
                            </span>
                          </td>
                          <td className="text-muted small">{new Date(rfq.createdAt).toLocaleDateString('en-PK')}</td>
                          <td className="pe-4">
                            <div className="d-flex gap-1">
                              <Link to={`/rfqs/${rfq.rfqId}`} className="btn btn-sm btn-outline-secondary py-0">View</Link>
                              {rfq.status === 'Open' && (
                                <button className="btn btn-sm btn-outline-danger py-0"
                                  onClick={() => closeRFQ(rfq.rfqId)}>Close</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* Quotes Tab */}
            {tab === 'quotes' && selectedRFQ && (
              <div className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h6 className="fw-bold mb-0">Quotations for: {selectedRFQ.title}</h6>
                    <p className="text-muted small mb-0">{selectedRFQ.quantity} {selectedRFQ.unit} · {selectedRFQ.deliveryCity || 'Pakistan'}</p>
                  </div>
                  <Link to={`/rfqs/${selectedRFQ.rfqId}`} className="btn btn-sm btn-outline-secondary">View RFQ</Link>
                </div>

                {quotesLoading ? (
                  <div className="text-center py-4"><div className="spinner-border" style={{ color: '#e94560' }} /></div>
                ) : quotes.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <div style={{ fontSize: '3rem' }}>⏳</div>
                    <p className="mt-2">No quotations received yet. Suppliers will respond soon.</p>
                  </div>
                ) : (
                  <div className="row g-3">
                    {quotes.map((q, idx) => (
                      <div className="col-md-6 col-lg-4" key={q.quotationId}>
                        <div className={`card h-100 border-0 shadow-sm ${q.status === 'Accepted' ? '' : ''}`}
                          style={{ borderTop: q.status === 'Accepted' ? '3px solid #27ae60' : q.status === 'Rejected' ? '3px solid #e74c3c' : '3px solid #e94560' }}>
                          <div className="card-body">
                            {/* Rank badge */}
                            {idx === 0 && q.status === 'Pending' && (
                              <span className="badge bg-warning text-dark mb-2">🏆 Best Quote</span>
                            )}
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div>
                                <div className="fw-bold">{q.supplierCompany || q.supplierName}</div>
                                <div className="text-muted small">{q.supplierName}</div>
                              </div>
                              <span className={`badge ${q.status === 'Accepted' ? 'bg-success' : q.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                {q.status}
                              </span>
                            </div>

                            <div className="row g-2 mb-3">
                              <div className="col-6">
                                <div className="bg-light rounded p-2 text-center">
                                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>UNIT PRICE</div>
                                  <div className="fw-bold text-success">PKR {q.unitPrice?.toLocaleString()}</div>
                                </div>
                              </div>
                              <div className="col-6">
                                <div className="bg-light rounded p-2 text-center">
                                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>TOTAL</div>
                                  <div className="fw-bold" style={{ color: '#e94560' }}>PKR {q.totalPrice?.toLocaleString()}</div>
                                </div>
                              </div>
                              <div className="col-12">
                                <div className="bg-light rounded p-2 text-center">
                                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>DELIVERY</div>
                                  <div className="fw-semibold">🚚 {q.deliveryDays} days</div>
                                </div>
                              </div>
                            </div>

                            {q.message && (
                              <p className="text-muted small mb-3 fst-italic">"{q.message}"</p>
                            )}

                            {q.status === 'Pending' && (
                              <div className="d-flex gap-2">
                                <button className="btn btn-success btn-sm flex-fill fw-semibold"
                                  onClick={() => acceptQuote(q.quotationId)}>
                                  ✓ Accept
                                </button>
                                <button className="btn btn-outline-danger btn-sm flex-fill"
                                  onClick={() => rejectQuote(q.quotationId)}>
                                  ✗ Reject
                                </button>
                              </div>
                            )}
                            {q.status === 'Accepted' && (
                              <Link to={`/messages?with=${q.supplierId}`}
                                className="btn btn-sm w-100 fw-semibold"
                                style={{ background: '#e94560', color: '#fff' }}>
                                💬 Message Supplier
                              </Link>
                            )}
                          </div>
                          <div className="card-footer bg-transparent border-0 small text-muted">
                            Submitted {new Date(q.createdAt).toLocaleDateString('en-PK')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* How to get more quotes tip */}
        {rfqs.some(r => r.status === 'Open' && r.quotationCount === 0) && (
          <div className="card border-0 shadow-sm mt-4 p-4"
            style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: '#fff' }}>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div style={{ fontSize: '2rem' }}>💡</div>
              <div className="flex-grow-1">
                <div className="fw-bold mb-1">Tip: Get more quotes faster</div>
                <div className="small opacity-75">Add a target price and detailed description to your RFQ. Suppliers respond faster to well-described requirements.</div>
              </div>
              <Link to="/rfqs" className="btn btn-warning btn-sm fw-bold">Browse Suppliers</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
