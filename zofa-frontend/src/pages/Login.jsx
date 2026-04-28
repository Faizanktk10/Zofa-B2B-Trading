import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      if (data.role === 'Admin') navigate('/admin');
      else if (data.role === 'Buyer') navigate('/dashboard/buyer');
      else navigate('/dashboard/supplier');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
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
                <h3 className="fw-bold"><span style={{ color: '#e94560' }}>ZOFA</span> B2B</h3>
                <p className="text-muted">Sign in to your account</p>
              </div>
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email</label>
                  <input type="email" className="form-control" required
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Password</label>
                  <input type="password" className="form-control" required
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
                <button type="submit" className="btn w-100 fw-bold py-2" disabled={loading}
                  style={{ background: '#e94560', color: '#fff' }}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
              <p className="text-center mt-3 mb-0 text-muted small">
                Don't have an account? <Link to="/register" style={{ color: '#e94560' }}>Register here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
