import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const PROVINCES = ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'Gilgit-Baltistan', 'AJK'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Sukkur'];

export default function Register() {
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', phone: '',
    role: params.get('role') || 'Buyer',
    city: '', province: '', companyName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem('token'));
    if (!user && !hasToken) return;

    if (user?.role === 'Admin') navigate('/admin', { replace: true });
    else if (user?.role === 'Buyer') navigate('/dashboard/buyer', { replace: true });
    else navigate('/pricing', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', form);
      login(data);
      if (data.role === 'Buyer') navigate('/dashboard/buyer');
      else navigate('/dashboard/supplier');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center py-5" style={{ background: '#f8f9fa' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-7">
            <div className="card border-0 shadow-lg p-4">
              <div className="text-center mb-4">
                <h3 className="fw-bold"><span style={{ color: '#e94560' }}>ZOFA</span> B2B</h3>
                <p className="text-muted">Create your free account</p>
              </div>

              {/* Role Toggle */}
              <div className="d-flex mb-4 rounded overflow-hidden border">
                {['Buyer', 'Supplier'].map(role => (
                  <button key={role} type="button"
                    className={`btn flex-fill py-2 fw-semibold rounded-0 ${form.role === role ? '' : 'btn-light'}`}
                    style={form.role === role ? { background: '#e94560', color: '#fff' } : {}}
                    onClick={() => setForm({ ...form, role })}>
                    {role === 'Buyer' ? '🛒 I am a Buyer' : '🏭 I am a Supplier'}
                  </button>
                ))}
              </div>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Full Name *</label>
                    <input className="form-control" required value={form.fullName} onChange={set('fullName')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Company Name</label>
                    <input className="form-control" value={form.companyName} onChange={set('companyName')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email *</label>
                    <input type="email" className="form-control" required value={form.email} onChange={set('email')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone</label>
                    <input className="form-control" placeholder="+92-300-0000000" value={form.phone} onChange={set('phone')} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">City</label>
                    <select className="form-select" value={form.city} onChange={set('city')}>
                      <option value="">Select City</option>
                      {CITIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Province</label>
                    <select className="form-select" value={form.province} onChange={set('province')}>
                      <option value="">Select Province</option>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Password *</label>
                    <input type="password" className="form-control" required minLength={6}
                      value={form.password} onChange={set('password')} />
                  </div>
                  <div className="col-12">
                    <button type="submit" className="btn w-100 fw-bold py-2" disabled={loading}
                      style={{ background: '#e94560', color: '#fff' }}>
                      {loading ? 'Creating Account...' : `Register as ${form.role}`}
                    </button>
                  </div>
                </div>
              </form>
              <p className="text-center mt-3 mb-0 text-muted small">
                Already have an account? <Link to="/login" style={{ color: '#e94560' }}>Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
