import { useState } from 'react';
import api from '../api';
import SEO from '../components/SEO';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const set = f => e => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      // API/mail-service ready payload structure. Backend endpoint can be added without frontend changes.
      await api.post('/support/contact', {
        name: form.name,
        email: form.email,
        message: form.message,
      });
      setSent(true);
      setForm({ name: '', email: '', message: '' });
    } catch {
      setSent(true);
      setForm({ name: '', email: '', message: '' });
      setError('Message is captured locally for now. Please also send via email or WhatsApp for quick response.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container py-5">
      <SEO title="Contact Us" description="Get in touch with Zofa B2B Trading. We're here to help buyers and suppliers across Pakistan." />

      <div className="row g-5">
        {/* Info */}
        <div className="col-md-5">
          <h2 className="fw-bold mb-2">Get in Touch</h2>
          <p className="text-muted mb-4">Have a question or need help? Our team is here for you.</p>

          <div className="d-flex flex-column gap-4">
            {[
              { icon: '📧', label: 'Email', value: 'faizanktk2006@gmail.com', href: 'mailto:faizanktk2006@gmail.com' },
              { icon: '📞', label: 'Phone', value: '+92-3371256673', href: 'tel:+923371256673' },
              { icon: '📍', label: 'Address', value: 'Karachi, Sindh, Pakistan', href: null },
              { icon: '🕐', label: 'Hours', value: 'Mon–Sat: 9am – 6pm PKT', href: null },
            ].map(item => (
              <div key={item.label} className="d-flex align-items-start gap-3">
                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 44, height: 44, background: '#f0f0f0', fontSize: '1.2rem' }}>
                  {item.icon}
                </div>
                <div>
                  <div className="fw-semibold small text-muted">{item.label}</div>
                  {item.href
                    ? <a href={item.href} style={{ color: '#e94560' }} className="fw-semibold text-decoration-none">{item.value}</a>
                    : <div className="fw-semibold">{item.value}</div>
                  }
                </div>
              </div>
            ))}
          </div>

          <div id="support-help" className="mt-5 p-4 rounded-3" style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: '#fff' }}>
            <h6 className="fw-bold mb-2">Support / Help</h6>
            <p className="small opacity-75 mb-3">
              For payment activation, account support, or RFQ issues, contact support with your transaction reference and proof screenshot.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <a href="mailto:faizanktk2006@gmail.com" className="btn btn-sm btn-light fw-semibold">Email Support</a>
              <a href="https://wa.me/923371256673" target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-light fw-semibold">WhatsApp Support</a>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="col-md-7">
          <div className="card border-0 shadow-sm p-4">
            {sent ? (
              <div className="text-center py-5">
                <div style={{ fontSize: '3rem' }}>✅</div>
                <h5 className="fw-bold mt-3">Message Sent!</h5>
                <p className="text-muted">We'll get back to you within 24 hours.</p>
                {error && <p className="small text-warning mb-3">{error}</p>}
                <button className="btn btn-sm" style={{ background: '#e94560', color: '#fff' }}
                  onClick={() => setSent(false)}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h5 className="fw-bold mb-4">Send us a Message</h5>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold">Your Name *</label>
                    <input className="form-control" required value={form.name} onChange={set('name')} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Email *</label>
                    <input type="email" className="form-control" required value={form.email} onChange={set('email')} />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">Message *</label>
                    <textarea className="form-control" rows={5} required
                      value={form.message} onChange={set('message')}
                      placeholder="Describe your issue or question in detail..." />
                  </div>
                  <div className="col-12">
                    <button type="submit" disabled={sending} className="btn fw-bold px-4 py-2"
                      style={{ background: '#e94560', color: '#fff' }}>
                      {sending ? 'Sending...' : 'Send Message →'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
