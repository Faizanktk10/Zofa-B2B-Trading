import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function SupplierDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'Supplier') { navigate('/login'); return; }
    Promise.all([
      api.get('/quotations/my'),
      api.get('/subscriptions/status')
    ]).then(([q, s]) => {
      setQuotes(q.data);
      setSubStatus(s.data);
    }).finally(() => setLoading(false));
  }, [user, navigate]);

  const isPremium = subStatus?.planType === 'Premium' && subStatus?.isActive;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-0">Supplier Dashboard</h4>
          <p className="text-muted small mb-0">Welcome, {user?.fullName}</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/profile/edit" className="btn btn-outline-secondary btn-sm">✏️ Edit Profile</Link>
          <Link to="/rfqs" className="btn fw-semibold" style={{ background: '#e94560', color: '#fff' }}>RFQ Marketplace</Link>
        </div>
      </div>

      {/* Premium Banner */}
      {!isPremium && (
        <div className="alert border-0 mb-4 p-3" style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: '#fff' }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <strong>🚀 Upgrade to Premium</strong>
              <p className="mb-0 small opacity-75">Unlock buyer contacts, unlimited quotes & priority listing</p>
            </div>
            <Link to="/pricing" className="btn btn-warning btn-sm fw-bold">Upgrade — PKR 2,500/mo</Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Quotes Sent', value: quotes.length, icon: '📤' },
          { label: 'Pending', value: quotes.filter(q => q.status === 'Pending').length, icon: '⏳' },
          { label: 'Accepted', value: quotes.filter(q => q.status === 'Accepted').length, icon: '✅' },
          { label: 'Plan', value: isPremium ? 'Premium' : 'Free', icon: isPremium ? '⭐' : '🔓' },
        ].map(s => (
          <div className="col-6 col-md-3" key={s.label}>
            <div className="card border-0 shadow-sm p-3 text-center">
              <div style={{ fontSize: '1.8rem' }}>{s.icon}</div>
              <div className={`fw-bold fs-5 ${s.label === 'Plan' && isPremium ? 'text-warning' : ''}`}>{s.value}</div>
              <div className="text-muted small">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Subscription Info */}
      {isPremium && subStatus?.endDate && (
        <div className="alert alert-success py-2 mb-4">
          ✅ Premium active until <strong>{new Date(subStatus.endDate).toLocaleDateString('en-PK')}</strong>
        </div>
      )}

      {/* My Quotes */}
      <h6 className="fw-bold mb-3">My Submitted Quotes</h6>
      {loading ? (
        <div className="text-center py-4"><div className="spinner-border" style={{ color: '#e94560' }} /></div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <div style={{ fontSize: '3rem' }}>📤</div>
          <p>No quotes submitted yet. <Link to="/rfqs" style={{ color: '#e94560' }}>RFQ Marketplace</Link></p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr><th>RFQ</th><th>Unit Price</th><th>Total</th><th>Delivery</th><th>Status</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {quotes.map(q => (
                <tr key={q.quotationId}>
                  <td className="fw-semibold">{q.rfqTitle}</td>
                  <td>PKR {q.unitPrice?.toLocaleString()}</td>
                  <td>PKR {q.totalPrice?.toLocaleString()}</td>
                  <td>{q.deliveryDays} days</td>
                  <td>
                    <span className={`badge ${q.status === 'Accepted' ? 'bg-success' : q.status === 'Rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="text-muted small">{new Date(q.createdAt).toLocaleDateString('en-PK')}</td>
                  <td><Link to={`/rfqs/${q.rfqId}`} className="btn btn-sm btn-outline-secondary">View RFQ</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
