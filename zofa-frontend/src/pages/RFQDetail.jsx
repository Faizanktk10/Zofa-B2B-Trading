import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import { DetailPageSkeleton } from '../components/PageSkeleton';

export default function RFQDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quoteForm, setQuoteForm] = useState({ unitPrice: '', totalPrice: '', deliveryDays: '', message: '' });
  const [quoteMsg, setQuoteMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/rfqs/${id}`).then(r => setRfq(r.data)).finally(() => setLoading(false));
  }, [id]);

  const submitQuote = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setSubmitting(true);
    setQuoteMsg('');
    try {
      await api.post('/quotations', { rfqId: parseInt(id), ...quoteForm, unitPrice: +quoteForm.unitPrice, totalPrice: +quoteForm.totalPrice, deliveryDays: +quoteForm.deliveryDays });
      setQuoteMsg('✅ Quotation submitted successfully!');
      setQuoteForm({ unitPrice: '', totalPrice: '', deliveryDays: '', message: '' });
    } catch (err) {
      setQuoteMsg('❌ ' + (err.response?.data?.message || 'Failed to submit quote.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DetailPageSkeleton />;
  if (!rfq) return <div className="container py-5 text-center text-muted">RFQ not found.</div>;

  return (
    <div className="container py-4">
      <SEO
        title={rfq.title}
        description={`${rfq.title} — ${rfq.quantity} ${rfq.unit} needed in ${rfq.deliveryCity || 'Pakistan'}. Submit your quotation on Zofa B2B Trading.`}
        keywords={`${rfq.title}, ${rfq.categoryName} RFQ Pakistan, B2B quotation`}
      />
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/rfqs">RFQs</Link></li>
          <li className="breadcrumb-item active">{rfq.title}</li>
        </ol>
      </nav>

      <div className="row g-4">
        {/* Main RFQ Info */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-4 mb-4">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                {rfq.isFeatured && <span className="badge mb-2 me-2" style={{ background: '#e94560' }}>⭐ Featured</span>}
                <span className={`badge ${rfq.status === 'Open' ? 'bg-success' : 'bg-secondary'}`}>{rfq.status}</span>
              </div>
              <span className="text-muted small">{new Date(rfq.createdAt).toLocaleDateString('en-PK')}</span>
            </div>
            <h3 className="fw-bold mb-3">{rfq.title}</h3>
            <div className="row g-3 mb-4">
              {[
                ['📦 Quantity', `${rfq.quantity} ${rfq.unit}`],
                ['📍 Delivery City', rfq.deliveryCity || 'Pakistan'],
                ['🏷️ Category', rfq.categoryName],
                ['👁️ Views', rfq.viewCount],
                ['💬 Quotes', rfq.quotationCount],
                rfq.targetPrice && ['💰 Target Price', `PKR ${rfq.targetPrice?.toLocaleString()}`],
                rfq.deadlineDate && ['📅 Deadline', new Date(rfq.deadlineDate).toLocaleDateString('en-PK')],
              ].filter(Boolean).map(([label, value]) => (
                <div className="col-6 col-md-4" key={label}>
                  <div className="bg-light rounded p-2 text-center">
                    <div className="small text-muted">{label}</div>
                    <div className="fw-semibold small">{value}</div>
                  </div>
                </div>
              ))}
            </div>
            <h6 className="fw-bold">Description</h6>
            <p className="text-muted">{rfq.description}</p>
          </div>

          {/* Buyer Contact — internal messaging only, no direct contact exposed */}
          <div className="card border-0 shadow-sm p-4 mb-4">
            <h6 className="fw-bold mb-3">Contact Buyer</h6>
            {user?.role === 'Buyer' && user?.userId === rfq.buyerId ? (
              <p className="text-muted small mb-0">This is your RFQ.</p>
            ) : user?.role === 'Supplier' ? (
              <>
                <p className="text-muted small mb-2">Send a message to the buyer through the platform.</p>
                <button
                  className="btn fw-semibold btn-sm"
                  style={{ background: '#e94560', color: '#fff' }}
                  onClick={() => navigate(`/messages?with=${rfq.buyerId}`)}
                >
                  💬 Contact Buyer via Messages
                </button>
              </>
            ) : (
              <div className="alert alert-warning py-2 mb-0 small">
                <Link to="/login" style={{ color: '#e94560' }}>Login as Supplier</Link> to contact this buyer.
              </div>
            )}
          </div>
        </div>

        {/* Quote Submission Sidebar */}
        <div className="col-lg-4">
          {user?.role === 'Supplier' && rfq.status === 'Open' ? (
            <div className="card border-0 shadow-sm p-4 sticky-top" style={{ top: '80px' }}>
              <h6 className="fw-bold mb-3">📤 Submit Quotation</h6>
              {quoteMsg && (
                <div className={`alert py-2 small ${quoteMsg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>
                  {quoteMsg}
                </div>
              )}
              <form onSubmit={submitQuote}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Unit Price (PKR) *</label>
                  <input type="number" className="form-control form-control-sm" required min="0"
                    value={quoteForm.unitPrice} onChange={e => setQuoteForm({ ...quoteForm, unitPrice: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Total Price (PKR) *</label>
                  <input type="number" className="form-control form-control-sm" required min="0"
                    value={quoteForm.totalPrice} onChange={e => setQuoteForm({ ...quoteForm, totalPrice: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Delivery Days *</label>
                  <input type="number" className="form-control form-control-sm" required min="1"
                    value={quoteForm.deliveryDays} onChange={e => setQuoteForm({ ...quoteForm, deliveryDays: e.target.value })} />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Message</label>
                  <textarea className="form-control form-control-sm" rows={3}
                    value={quoteForm.message} onChange={e => setQuoteForm({ ...quoteForm, message: e.target.value })} />
                </div>
                <button type="submit" className="btn w-100 fw-semibold" disabled={submitting}
                  style={{ background: '#e94560', color: '#fff' }}>
                  {submitting ? 'Submitting...' : 'Submit Quote'}
                </button>
              </form>
              {user?.plan !== 'Premium' && (
                <p className="text-muted small mt-2 text-center">
                  Free plan: 5 quotes/day. <Link to="/pricing" style={{ color: '#e94560' }}>Upgrade</Link>
                </p>
              )}
            </div>
          ) : !user ? (
            <div className="card border-0 shadow-sm p-4 text-center">
              <p className="text-muted">Login as a supplier to submit a quotation.</p>
              <Link to="/login" className="btn fw-semibold" style={{ background: '#e94560', color: '#fff' }}>Login</Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
