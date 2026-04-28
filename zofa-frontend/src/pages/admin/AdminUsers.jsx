import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (role) q.set('role', role);
    if (search) q.set('search', search);
    api.get(`/admin/users?${q}`).then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, [role, search]);

  useEffect(() => {
    if (!user || user.role !== 'Admin') { navigate('/admin/login'); return; }
    load();
  }, [user, navigate, load]);

  const ban = async (id, isActive) => {
    await api.patch(`/admin/users/${id}/ban`, isActive, { headers: { 'Content-Type': 'application/json' } });
    setUsers(users.map(u => u.userId === id ? { ...u, isActive: !isActive } : u));
  };

  const verify = async (id) => {
    await api.patch(`/admin/users/${id}/verify`);
    setUsers(users.map(u => u.userId === id ? { ...u, isVerified: true } : u));
  };

  const updatePlan = async (id, planType) => {
    const { data } = await api.patch(`/admin/users/${id}/subscription`, {
      planType,
      durationDays: 30,
    });

    setUsers(users.map(u => u.userId === id ? {
      ...u,
      isPremium: data.isPremium,
      planType: data.planType,
      subscriptionExpiry: data.subscriptionExpiry,
    } : u));
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h5 className="fw-bold mb-0">👥 User Management</h5>
        <div className="d-flex gap-2 flex-wrap">
          {['', 'Buyer', 'Supplier'].map(r => (
            <button key={r} className={`btn btn-sm ${role === r ? 'btn-dark' : 'btn-outline-secondary'}`}
              onClick={() => setRole(r)}>
              {r || 'All'}
            </button>
          ))}
          <input className="form-control form-control-sm" style={{ width: 200 }}
            placeholder="Search name or email..." value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()} />
          <button className="btn btn-sm btn-dark" onClick={load}>Search</button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><div className="spinner-border" style={{ color: '#e94560' }} /></div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Company</th><th>City</th><th>Subscription</th><th>Verified</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.userId}>
                  <td className="fw-semibold small">{u.fullName}</td>
                  <td className="text-muted small">{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'Buyer' ? 'bg-primary' : u.role === 'Supplier' ? 'bg-success' : 'bg-danger'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="small">{u.companyName || '—'}</td>
                  <td className="small">{u.city || '—'}</td>
                  <td>
                    <div className="small fw-semibold">{u.planType || 'Free'}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {u.subscriptionExpiry ? `Expires ${new Date(u.subscriptionExpiry).toLocaleDateString('en-PK')}` : 'No active subscription'}
                    </div>
                  </td>
                  <td>
                    {u.isVerified
                      ? <span className="badge bg-success">✓ Verified</span>
                      : <button className="btn btn-sm btn-outline-success py-0" style={{ fontSize: '0.7rem' }} onClick={() => verify(u.userId)}>Verify</button>
                    }
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'bg-success' : 'bg-danger'}`}>
                      {u.isActive ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td className="text-muted small">{new Date(u.createdAt).toLocaleDateString('en-PK')}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => ban(u.userId, u.isActive)}>
                        {u.isActive ? 'Ban' : 'Unban'}
                      </button>
                      {u.role !== 'Admin' && (
                        <>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ fontSize: '0.7rem' }}
                            onClick={() => updatePlan(u.userId, 'Premium')}>
                            Premium
                          </button>
                          <button
                            className="btn btn-sm btn-outline-warning"
                            style={{ fontSize: '0.7rem' }}
                            onClick={() => updatePlan(u.userId, 'Star')}>
                            Star
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            style={{ fontSize: '0.7rem' }}
                            onClick={() => updatePlan(u.userId, 'Free')}>
                            Free
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="text-center text-muted py-4">No users found.</div>}
        </div>
      )}
    </div>
  );
}
