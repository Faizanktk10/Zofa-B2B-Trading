import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      setMsg('Passwords do not match.');
      return;
    }
    if (!token) {
      setMsg('Invalid reset link. Please request a new one.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      await api.post('/auth/reset-password', { token, newPassword: form.newPassword });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-vh-100 d-flex align-items-center" style={{ background: '#f8f9fa' }}>
        <div className="container text-center">
          <div style={{ fontSize: '3rem' }}>❌</div>
          <h4 className="fw-bold mt-3">Invalid Reset Link</h4>
          <p className="text-muted">This link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn fw-semibold" style={{ background: '#e94560', color: '#fff' }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ background: '#f8f9fa' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card border-0 shadow-lg p-4">
              <div className="text-center mb-4">
                <h3 className="fw-bold"><span style={{ color: '#e94560' }}>ZOFA</span> B2B</h3>
                <p className="text-muted">Set new password</p>
              </div>

              {success ? (
                <div className="text-center py-3">
                  <div style={{ fontSize: '3rem' }}>✅</div>
                  <h5 className="fw-bold mt-3">Password Reset!</h5>
                  <p className="text-muted">Redirecting to login in 3 seconds...</p>
                  <Link to="/login" className="btn fw-semibold" style={{ background: '#e94560', color: '#fff' }}>
                    Login Now
                  </Link>
                </div>
              ) : (
                <>
                  {msg && <div className="alert alert-danger py-2">{msg}</div>}
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">New Password</label>
                      <input type="password" className="form-control" required minLength={6}
                        value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })}
                        placeholder="Minimum 6 characters" />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-semibold">Confirm Password</label>
                      <input type="password" className="form-control" required
                        value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
                        placeholder="Repeat new password" />
                    </div>
                    <button type="submit" className="btn w-100 fw-bold py-2" disabled={loading}
                      style={{ background: '#e94560', color: '#fff' }}>
                      {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
