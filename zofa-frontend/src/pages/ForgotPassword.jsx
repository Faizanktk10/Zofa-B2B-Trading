import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      setMsg('Reset link sent! Check your email inbox (and spam folder).');
    } catch {
      setMsg('Something went wrong. Please try again.');
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
                <p className="text-muted">Reset your password</p>
              </div>

              {sent ? (
                <div className="text-center py-3">
                  <div style={{ fontSize: '3rem' }}>📧</div>
                  <h5 className="fw-bold mt-3">Check your email!</h5>
                  <p className="text-muted">{msg}</p>
                  <Link to="/login" className="btn fw-semibold mt-2" style={{ background: '#e94560', color: '#fff' }}>
                    Back to Login
                  </Link>
                </div>
              ) : (
                <>
                  {msg && <div className="alert alert-danger py-2">{msg}</div>}
                  <p className="text-muted small mb-3">
                    Enter your registered email and we'll send you a password reset link.
                  </p>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Email Address</label>
                      <input type="email" className="form-control" required
                        value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com" />
                    </div>
                    <button type="submit" className="btn w-100 fw-bold py-2" disabled={loading}
                      style={{ background: '#e94560', color: '#fff' }}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </form>
                  <p className="text-center mt-3 mb-0 text-muted small">
                    Remember your password? <Link to="/login" style={{ color: '#e94560' }}>Sign in</Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
