import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

export default function Upgrade() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [billing, setBilling] = useState('Monthly');
  const [method, setMethod] = useState('Bank Transfer');
  const [refNo, setRefNo] = useState('');
  const [proofPreview, setProofPreview] = useState(null);
  const [proofBase64, setProofBase64] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [myPayments, setMyPayments] = useState([]);

  const price = billing === 'Yearly' ? 20000 : 2500;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'Supplier') {
      api.get('/payments/my').then(r => setMyPayments(r.data || [])).catch(() => {});
    }
  }, [user, navigate]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofBase64(reader.result);
      setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!refNo.trim()) { setMsg({ type: 'error', text: 'Transaction reference number is required.' }); return; }
    if (!proofBase64) { setMsg({ type: 'error', text: 'Please upload payment proof screenshot.' }); return; }

    setSubmitting(true);
    setMsg({ type: '', text: '' });
    try {
      await api.post('/payments/submit-proof', {
        billingCycle: billing,
        paymentMethod: method,
        referenceNo: refNo,
        proofImageBase64: proofBase64
      });
      setMsg({ type: 'success', text: '✅ Payment proof submitted! Your account will be upgraded within 2 hours.' });
      setRefNo('');
      setProofPreview(null);
      setProofBase64('');
      // Refresh payment history
      api.get('/payments/my').then(r => setMyPayments(r.data || [])).catch(() => {});
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const hasPending = myPayments.some(p => p.status === 'Pending');

  return (
    <div style={{ background: '#f4f6fb', minHeight: '100vh' }}>
      <SEO title="Upgrade to Premium — Zofa B2B Trading" />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }} className="py-4">
        <div className="container">
          <h4 className="fw-bold text-white mb-0">⭐ Upgrade to Premium</h4>
          <p className="text-white-50 small mb-0">Unlock unlimited quotes, buyer contacts & priority listing</p>
        </div>
      </div>

      <div className="container py-4">
        <div className="row g-4">

          {/* Left — Plan + Payment Instructions */}
          <div className="col-lg-5">

            {/* Billing Toggle */}
            <div className="card border-0 shadow-sm p-4 mb-4">
              <h6 className="fw-bold mb-3">Select Billing Cycle</h6>
              <div className="d-flex rounded overflow-hidden border mb-3">
                {['Monthly', 'Yearly'].map(b => (
                  <button key={b} type="button"
                    className="btn flex-fill py-2 fw-semibold rounded-0 border-0"
                    style={billing === b ? { background: '#e94560', color: '#fff' } : { color: '#666' }}
                    onClick={() => setBilling(b)}>
                    {b}
                    {b === 'Yearly' && <span className="badge bg-success ms-2" style={{ fontSize: '0.6rem' }}>Save 33%</span>}
                  </button>
                ))}
              </div>

              {/* Price */}
              <div className="text-center py-3 rounded mb-3" style={{ background: '#fff5f5' }}>
                <div className="fw-bold" style={{ fontSize: '2.5rem', color: '#e94560' }}>
                  PKR {price.toLocaleString()}
                </div>
                <div className="text-muted small">per {billing === 'Yearly' ? 'year' : 'month'}</div>
                {billing === 'Yearly' && (
                  <span className="badge bg-success mt-1">Save PKR 10,000/year</span>
                )}
              </div>

              {/* Features */}
              <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                {[
                  '✅ Unlimited quotes per day',
                  '✅ Priority search ranking',
                  '✅ Verified Premium badge',
                  '✅ Featured profile listing',
                  '✅ Dedicated support',
                ].map(f => <li key={f} className="small fw-semibold">{f}</li>)}
              </ul>
            </div>

            {/* Bank Details */}
            <div className="card border-0 shadow-sm p-4">
              <h6 className="fw-bold mb-3">🏦 Payment Instructions</h6>
              <p className="text-muted small mb-3">
                Send <strong>PKR {price.toLocaleString()}</strong> to the account below, then upload your proof.
              </p>
              <div className="d-flex flex-column gap-2">
                {[
                  ['Bank', 'Meezan Bank'],
                  ['Account Title', 'MUHAMMAD FAIZAN'],
                  ['Account Number', '99840111296632'],
                  ['IBAN', 'PK10MEZN0099840111296632'],
                  ['JazzCash / EasyPaisa', '03371256673'],
                ].map(([label, value]) => (
                  <div key={label} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span className="text-muted small">{label}</span>
                    <span className="fw-semibold small" style={{ userSelect: 'all' }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="alert alert-warning py-2 mt-3 small mb-0">
                ⚠️ After payment, upload proof below. Admin will verify within 2 hours.
              </div>
            </div>
          </div>

          {/* Right — Upload Form */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm p-4 mb-4">
              <h6 className="fw-bold mb-4">📤 Submit Payment Proof</h6>

              {user?.role !== 'Supplier' ? (
                <div className="text-center py-4">
                  <div style={{ fontSize: '3rem' }}>🏭</div>
                  <h5 className="fw-bold mt-3">Suppliers Only</h5>
                  <p className="text-muted">Premium plan is for suppliers. Register as a supplier to upgrade.</p>
                  <Link to="/register?role=Supplier" className="btn fw-semibold px-4"
                    style={{ background: '#e94560', color: '#fff' }}>
                    Register as Supplier
                  </Link>
                </div>
              ) : (
                <>
                  {hasPending && (
                    <div className="alert alert-info py-2 small mb-3">
                      ⏳ You have a pending payment under review. Please wait for admin approval.
                    </div>
                  )}

                  {msg.text && (
                    <div className={`alert py-2 small mb-3 ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                      {msg.text}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Payment Method</label>
                      <select className="form-select" value={method} onChange={e => setMethod(e.target.value)}>
                        <option>Bank Transfer</option>
                        <option>JazzCash</option>
                        <option>EasyPaisa</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Transaction Reference Number <span className="text-danger">*</span>
                      </label>
                      <input className="form-control" required
                        placeholder="e.g. TXN123456789"
                        value={refNo} onChange={e => setRefNo(e.target.value)} />
                      <div className="form-text">Found in your bank app or SMS receipt</div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        Payment Proof Screenshot <span className="text-danger">*</span>
                      </label>
                      <input type="file" className="form-control" accept="image/*,.pdf"
                        onChange={handleFileChange} />
                      <div className="form-text">Upload screenshot of your transaction (JPG, PNG, PDF)</div>

                      {proofPreview && (
                        <div className="mt-2">
                          <img src={proofPreview} alt="proof preview"
                            className="rounded border"
                            style={{ maxHeight: 200, maxWidth: '100%', objectFit: 'contain' }} />
                        </div>
                      )}
                    </div>

                    <button type="submit" className="btn w-100 fw-bold py-2"
                      disabled={submitting || hasPending}
                      style={{ background: '#e94560', color: '#fff' }}>
                      {submitting ? (
                        <><span className="spinner-border spinner-border-sm me-2" />Submitting...</>
                      ) : `Submit Proof — PKR ${price.toLocaleString()}`}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Payment History */}
            {myPayments.length > 0 && (
              <div className="card border-0 shadow-sm p-4">
                <h6 className="fw-bold mb-3">📋 My Payment History</h6>
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Reference</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myPayments.map(p => (
                        <tr key={p.paymentId}>
                          <td className="fw-semibold">PKR {p.amount?.toLocaleString()}</td>
                          <td className="small">{p.method}</td>
                          <td className="small text-muted">{p.referenceNo || '—'}</td>
                          <td>
                            <span className={`badge ${p.status === 'Confirmed' ? 'bg-success' : p.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="small text-muted">{new Date(p.createdAt).toLocaleDateString('en-PK')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
