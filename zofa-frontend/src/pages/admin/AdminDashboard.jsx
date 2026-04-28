import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'Admin') { navigate('/admin/login'); return; }
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/payments?status=Pending'),
      api.get('/admin/users')
    ]).then(([d, p, u]) => {
      setStats(d.data);
      setPayments(p.data);
      setUsers(u.data);
    }).finally(() => setLoading(false));
  }, [user, navigate]);

  const confirmPayment = async (id) => {
    await api.patch(`/admin/payments/${id}/confirm`);
    setPayments(payments.filter(p => p.paymentId !== id));
  };

  const rejectPayment = async (id) => {
    await api.patch(`/admin/payments/${id}/reject`);
    setPayments(payments.filter(p => p.paymentId !== id));
  };

  const banUser = async (id, isActive) => {
    await api.patch(`/admin/users/${id}/ban`, isActive, { headers: { 'Content-Type': 'application/json' } });
    setUsers(users.map(u => u.userId === id ? { ...u, isActive: !isActive } : u));
  };
  if (loading) return <div className="text-center py-5"><div className="spinner-border" style={{ color: '#e94560' }} /></div>;

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">⚙️ Admin Panel</h4>
        <span className="badge bg-danger">Admin</span>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers, icon: '👥', color: '#0f3460' },
          { label: 'Total RFQs', value: stats?.totalRFQs, icon: '📋', color: '#e94560' },
          { label: 'Pending Payments', value: stats?.pendingPayments, icon: '⏳', color: '#f39c12' },
          { label: 'Active Premium Users', value: stats?.activePremiumUsers, icon: '⭐', color: '#27ae60' },
          { label: 'Buyers', value: stats?.totalBuyers, icon: '🛒', color: '#16213e' },
          { label: 'Suppliers', value: stats?.totalSuppliers, icon: '🏭', color: '#1a1a2e' },
          { label: 'Total Quotes', value: stats?.totalQuotations, icon: '💬', color: '#0f3460' },
          { label: 'Premium Suppliers', value: stats?.premiumSuppliers, icon: '⭐', color: '#f39c12' },
          { label: 'Monthly Revenue', value: `PKR ${stats?.monthlyRevenue?.toLocaleString()}`, icon: '💰', color: '#27ae60' },
        ].map(s => (
          <div className="col-6 col-md-3 col-lg-2" key={s.label}>
            <div className="card border-0 shadow-sm p-3 text-center h-100" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
              <div className="fw-bold">{s.value}</div>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        {[['overview', 'Pending Payments'], ['users', 'Users']].map(([key, label]) => (
          <li className="nav-item" key={key}>
            <button className={`nav-link ${tab === key ? 'active fw-semibold' : ''}`} onClick={() => setTab(key)}>
              {label} {key === 'overview' && payments.length > 0 && <span className="badge bg-danger ms-1">{payments.length}</span>}
            </button>
          </li>
        ))}
      </ul>

      {/* Pending Payments */}
      {tab === 'overview' && (
        payments.length === 0 ? (
          <div className="text-center py-4 text-muted">No pending payments.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr><th>User</th><th>Plan</th><th>Amount</th><th>Method</th><th>Reference</th><th>Proof</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.paymentId}>
                    <td><div className="fw-semibold">{p.userName}</div><div className="text-muted small">{p.userEmail}</div></td>
                    <td><span className="badge bg-light text-dark border">{p.plan || p.type}</span></td>
                    <td className="fw-semibold">PKR {p.amount?.toLocaleString()}</td>
                    <td>{p.method}</td>
                    <td className="text-muted small">{p.referenceNo}</td>
                    <td>{p.proofImage ? <a href={p.proofImage} target="_blank" rel="noreferrer">View</a> : <span className="text-muted small">No image</span>}</td>
                    <td className="text-muted small">{new Date(p.createdAt).toLocaleDateString('en-PK')}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-success" onClick={() => confirmPayment(p.paymentId)}>✓ Confirm</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => rejectPayment(p.paymentId)}>✗ Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Company</th><th>City</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId}>
                  <td className="fw-semibold">{u.fullName}</td>
                  <td className="text-muted small">{u.email}</td>
                  <td><span className={`badge ${u.role === 'Buyer' ? 'bg-primary' : u.role === 'Supplier' ? 'bg-success' : 'bg-danger'}`}>{u.role}</span></td>
                  <td>{u.companyName || '—'}</td>
                  <td>{u.city || '—'}</td>
                  <td>
                    <span className={`badge ${u.isActive ? 'bg-success' : 'bg-danger'}`}>
                      {u.isActive ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                      onClick={() => banUser(u.userId, u.isActive)}>
                      {u.isActive ? 'Ban' : 'Unban'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
