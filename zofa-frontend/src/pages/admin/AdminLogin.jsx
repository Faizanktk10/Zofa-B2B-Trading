import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const nextPath = location.state?.from || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.role !== 'Admin') {
        setError('Only admin users can access this panel.');
        return;
      }
      login(data);
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Admin login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ background: '#f8f9fa' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card border-0 shadow-lg p-4">
              <div className="text-center mb-4">
                <h3 className="fw-bold"><span style={{ color: '#e94560' }}>ZOFA</span> Admin</h3>
                <p className="text-muted mb-0">Sign in to manage platform operations</p>
              </div>
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Admin Email</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn w-100 fw-bold py-2" disabled={loading} style={{ background: '#e94560', color: '#fff' }}>
                  {loading ? 'Signing in...' : 'Sign In as Admin'}
                </button>
              </form>
              <p className="text-center mt-3 mb-0 text-muted small">
                Not an admin? <Link to="/login" style={{ color: '#e94560' }}>Go to user login</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
