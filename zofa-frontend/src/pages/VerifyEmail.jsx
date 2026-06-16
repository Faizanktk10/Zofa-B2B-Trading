import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [email, setEmail] = useState(params.get('email') || '');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [debugCode, setDebugCode] = useState('');
  const [serverCode, setServerCode] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (code.length !== 6) { setError('Enter the 6-digit code from your email.'); return; }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email', { email: email.trim(), code });
      login(data);
      setSuccess('Email verified! Redirecting...');
      if (data.role === 'Buyer') navigate('/dashboard/buyer');
      else navigate('/dashboard/supplier');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email.trim()) return;
    setError('');
    setSuccess('');
    try {
      await api.post('/auth/resend-verification', { email: email.trim() });
      setSuccess('A new code has been sent to your email.');
      setResendCooldown(60);
      setCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code. Please try again.');
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ background: '#f8f9fa' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card border-0 shadow-lg p-4">

              <div className="text-center mb-3">
                <div className="alert alert-warning py-2 small mb-3" style={{ borderRadius: 12 }}>
                  Email sending is temporarily disabled.
                  <br />
                  Your verification code is printed on the server console.
                </div>

                <div className="mb-2">
                  <div className="text-muted fw-semibold" style={{ fontSize: 14 }}>
                    SERVER CODE (ADMIN/SUPPORT USE)
                  </div>
                  <div
                    className="fw-bolder p-3 rounded"
                    style={{
                      background: '#0f3460',
                      color: '#fff',
                      fontSize: '2rem',
                      letterSpacing: 6,
                      userSelect: 'text',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    {serverCode || '------'}
                  </div>
                  <div className="form-text text-center" style={{ fontSize: 12 }}>
                    Copy-paste friendly (paste in the input below).
                  </div>
                </div>

              </div>

              <div className="text-center mb-4">
                <div style={{ fontSize: '3rem' }}>📧</div>
                <h3 className="fw-bold mt-2"><span style={{ color: '#e94560' }}>ZOFA</span> B2B</h3>
                <p className="text-muted mb-0">Verify your email address</p>
              </div>

              <div className="alert alert-info py-2 small mb-3">
                Email sending is temporarily disabled due to provider restrictions.
                <br />
                Use the verification code shown in server console (check backend logs), or paste it here.
              </div>

              {error && <div className="alert alert-danger py-2">{error}</div>}
              {success && <div className="alert alert-success py-2">{success}</div>}

              <form onSubmit={handleVerify}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email</label>
                  <input type="email" className="form-control" required
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold">Verification Code</label>
                  <input
                    className="form-control form-control-lg text-center fw-bold"
                    style={{ letterSpacing: 12, fontSize: '1.5rem' }}
                    maxLength={6}
                    placeholder="------"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                  <div className="form-text text-center">Code expires in 15 minutes.</div>
                </div>
                <button type="submit" className="btn w-100 fw-bold py-2 mb-3" disabled={loading}
                  style={{ background: '#e94560', color: '#fff' }}>
                  {loading ? 'Verifying...' : 'Verify Email'}
                </button>
              </form>

              <div className="text-center">
                <button type="button" className="btn btn-link text-decoration-none" style={{ color: '#e94560' }}
                  onClick={handleResend} disabled={resendCooldown > 0 || !email.trim()}>
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <p className="text-center mt-3 mb-0 text-muted small">
                Already verified? <Link to="/login" style={{ color: '#e94560' }}>Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
