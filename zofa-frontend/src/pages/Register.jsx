// ============================================
// Page: Register.jsx
// Purpose: User registration (Buyer/Supplier).
//          - Validates inputs (email/password/phone/city/province)
//          - Calls backend /auth/register
//          - Redirects user to /verify-email with email param
// Created by: Faizan (Full Stack)
// Date: June 2026
// ============================================

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
  const [fieldErrors, setFieldErrors] = useState({
    fullName: '', email: '', password: '', phone: '',
    city: '', province: '', companyName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hasToken = Boolean(localStorage.getItem('token'));
    if (!user && !hasToken) return;
    if (user?.role === 'Admin') navigate('/admin', { replace: true });
    else if (user?.role === 'Buyer') navigate('/dashboard/buyer', { replace: true });
    else navigate('/pricing', { replace: true });
  }, [user, navigate]);

  const set = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const next = { fullName: '', email: '', password: '', phone: '', city: '', province: '', companyName: '' };
    if (form.fullName.trim().length < 3) next.fullName = 'Full Name is required (minimum 3 characters)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Valid email is required';
    if (!form.password || form.password.length < 6) next.password = 'Password is required (minimum 6 characters)';
    const phoneRaw = form.phone.trim();
    // Accept common Pakistani formats:
    // 1) +92-300-0000000
    // 2) +92188455904
    // 3) +92 300 0000000
    // 4) 03001234567
    const digits = phoneRaw.replace(/\D/g, '');

    const normalizedE164 = (() => {
      if (digits.startsWith('92')) return `+${digits}`; // +92XXXXXXXXX (after removing non-digits)
      if (digits.startsWith('0')) return `+92${digits.slice(1)}`; // 0XXXXXXXXX -> +92...
      return phoneRaw;
    })();

    const isValid =
      /^\+92\d{10}$/.test(normalizedE164) || // +92 + 10 digits (Pakistan mobile)
      /^03\d{9}$/.test(phoneRaw); // legacy local format

    if (phoneRaw && !isValid) {
      next.phone = 'Use format: +92-300-0000000 or +923000000000 or 03001234567';
    }
    // City removed (no validation)

    if (!form.province) next.province = 'Please select a province';

    if (form.role === 'Supplier' && !form.companyName?.trim())
      next.companyName = 'Company Name is required for Suppliers';
    setFieldErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        phone: form.phone.trim() || null,
      };
      const { data } = await api.post('/auth/register', payload);
      navigate(`/verify-email?email=${encodeURIComponent(data.email || form.email.trim())}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
      if (err.response?.data?.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}`);
      }
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

              <form onSubmit={handleRegister}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Full Name *</label>
                    <input className={`form-control ${fieldErrors.fullName ? 'is-invalid' : ''}`} value={form.fullName} onChange={set('fullName')} />
                    {fieldErrors.fullName && <div className="text-danger small mt-1">{fieldErrors.fullName}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Company Name{form.role === 'Supplier' ? ' *' : ''}</label>
                    <input className={`form-control ${fieldErrors.companyName ? 'is-invalid' : ''}`} value={form.companyName} onChange={set('companyName')} />
                    {fieldErrors.companyName && <div className="text-danger small mt-1">{fieldErrors.companyName}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email *</label>
                    <input type="email" className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`} value={form.email} onChange={set('email')} />
                    {fieldErrors.email && <div className="text-danger small mt-1">{fieldErrors.email}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Phone</label>
                    <input className={`form-control ${fieldErrors.phone ? 'is-invalid' : ''}`}
                      placeholder="+92-300-0000000 or 03001234567"
                      value={form.phone} onChange={set('phone')} />
                    {fieldErrors.phone && <div className="text-danger small mt-1">{fieldErrors.phone}</div>}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Province *</label>
                    <select className={`form-select ${fieldErrors.province ? 'is-invalid' : ''}`} value={form.province} onChange={set('province')}>
                      <option value="">Select Province</option>
                      {PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                    {fieldErrors.province && <div className="text-danger small mt-1">{fieldErrors.province}</div>}
                  </div>


                  <div className="col-md-6">
                    <label className="form-label fw-semibold">City</label>
                    <select className={`form-select ${fieldErrors.city ? 'is-invalid' : ''}`} value={form.city} onChange={set('city')}>
                      <option value="">Select City</option>
                      {CITIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    {fieldErrors.city && <div className="text-danger small mt-1">{fieldErrors.city}</div>}
                  </div>


                  <div className="col-12">
                    <label className="form-label fw-semibold">Password *</label>
                    <input type="password" className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`} value={form.password} onChange={set('password')} />
                    {fieldErrors.password && <div className="text-danger small mt-1">{fieldErrors.password}</div>}
                  </div>

                  <div className="col-12">
                    <button type="submit" className="btn w-100 fw-bold py-2" disabled={loading}
                      style={{ background: '#e94560', color: '#fff' }}>
                      {loading ? 'Creating account...' : 'Create Account'}
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
