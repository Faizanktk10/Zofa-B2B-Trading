import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const FEATURES = [
  { label: 'RFQ Marketplace access', free: '✅', premium: '✅', lead: '✅' },
  { label: 'Quotes per day', free: '5 per day', premium: 'Unlimited', lead: '5 per day' },
  { label: 'Buyer contact (email + phone)', free: '❌', premium: '✅ Full access', lead: '✅ Per RFQ' },
  { label: 'Search ranking', free: 'Normal', premium: '🔝 Priority', lead: 'Normal' },
  { label: 'Verified badge', free: '❌', premium: '✅ Premium badge', lead: '❌' },
  { label: 'Profile visibility', free: 'Basic', premium: 'Featured listing', lead: 'Basic' },
  { label: 'Cost', free: 'Free', premium: 'PKR 2,500/mo', lead: 'PKR 200/lead' },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(user || localStorage.getItem('token'));
  const [billing, setBilling] = useState('Monthly');
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [stats, setStats] = useState({ buyers: '—', suppliers: '—', rfqs: '—', quotations: '—' });

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats({
        buyers: r.data.totalBuyers.toLocaleString(),
        suppliers: r.data.totalSuppliers.toLocaleString(),
        rfqs: r.data.totalRFQs.toLocaleString(),
        quotations: r.data.totalQuotations.toLocaleString(),
      }))
      .catch(() => {});
  }, []);

  const shouldSelectPlanFromEvent = (event) => {
    const interactiveElement = event.target.closest('a,button,input,select,textarea,label');
    return !interactiveElement;
  };

  const price = billing === 'Yearly' ? 20000 : 2500;
  const saving = billing === 'Yearly' ? 'Save PKR 10,000' : null;

  const handleUpgradeRedirect = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    navigate('/upgrade');
  };

  return (
    <div>
      <SEO title="Pricing — Supplier Plans" description="Upgrade to Premium on Zofa B2B Trading. Unlock buyer contacts, unlimited quotes and priority listing. PKR 2,500/month." />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }} className="py-5 text-white">
        <div className="container text-center py-3">
          <div className="badge mb-3 px-3 py-2" style={{ background: '#e94560', fontSize: '0.8rem' }}>
            🇵🇰 Pakistan's #1 B2B Marketplace
          </div>
          <h1 className="display-5 fw-bold mb-3">
            Connect with Millions of <span style={{ color: '#e94560' }}>Buyers Globally</span>
          </h1>
          <p className="lead opacity-75 mb-4" style={{ maxWidth: 600, margin: '0 auto' }}>
            Join thousands of Pakistani suppliers already growing their business on Zofa B2B Trading.
            Choose the plan that fits your needs.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <button
              type="button"
              className="btn btn-lg fw-bold px-4"
              style={{ background: '#e94560', color: '#fff' }}
              onClick={handleUpgradeRedirect}
            >
              Apply Now — It's Free
            </button>
            <a href="#plans" className="btn btn-lg btn-outline-light px-4">View Plans</a>
          </div>
        </div>
      </section>

      {/* Stats — real data from API */}
      <div style={{ background: '#e94560' }} className="py-4">
        <div className="container">
          <div className="row text-center text-white g-3">
            {[
              { num: stats.buyers, label: 'Active Buyers' },
              { num: stats.suppliers, label: 'Active Suppliers' },
              { num: stats.rfqs, label: 'Total RFQs Posted' },
              { num: stats.quotations, label: 'Quotes Submitted' },
            ].map(s => (
              <div className="col-6 col-md-3" key={s.label}>
                <div className="fw-bold" style={{ fontSize: '1.8rem' }}>{s.num}</div>
                <div className="small opacity-75">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plans */}
      <section id="plans" className="py-5" style={{ background: '#f4f6fb' }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="fw-bold">Choose Your Plan</h2>
            <p className="text-muted">Transparent pricing — no hidden fees</p>

            {/* Billing Toggle */}
            <div className="d-inline-flex rounded-pill border overflow-hidden mt-2"
              style={{ background: '#fff' }}>
              {['Monthly', 'Yearly'].map(b => (
                <button key={b} type="button"
                  className="btn px-4 py-2 rounded-0 fw-semibold border-0"
                  style={billing === b ? { background: '#e94560', color: '#fff' } : { color: '#666' }}
                  onClick={() => setBilling(b)}>
                  {b}
                  {b === 'Yearly' && (
                    <span className="badge bg-success ms-2" style={{ fontSize: '0.6rem' }}>Save 33%</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="row g-4 justify-content-center">

            {/* Free Plan */}
            <div className="col-md-4">
              <div
                role="button"
                tabIndex={0}
                className={`card border-0 shadow-sm h-100 p-4 pricing-plan-card ${selectedPlan === 'free' ? 'pricing-plan-active' : ''}`}
                onClick={(e) => shouldSelectPlanFromEvent(e) && setSelectedPlan('free')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPlan('free');
                  }
                }}
              >
                <div className="mb-3">
                  <span className="badge bg-light text-dark border mb-2">Free Forever</span>
                  <h4 className="fw-bold">Free Plan</h4>
                  <div className="display-5 fw-bold mb-1">PKR 0</div>
                  <p className="text-muted small">No credit card required</p>
                </div>
                <ul className="list-unstyled mb-4 d-flex flex-column gap-2">
                  {[
                    '✅ RFQ Marketplace access',
                    '✅ 5 quotes per day',
                    '✅ Basic profile listing',
                    '✅ Platform messaging',
                    '❌ Buyer contact details',
                    '❌ Priority listing',
                    '❌ Verified badge',
                  ].map(f => (
                    <li key={f} className={`small ${f.startsWith('❌') ? 'text-muted' : 'text-dark'}`}>{f}</li>
                  ))}
                </ul>
                <Link to="/register?role=Supplier"
                  className={`btn w-100 fw-semibold mt-auto ${selectedPlan === 'free' ? 'btn-danger' : 'btn-outline-secondary'}`}>
                  Get Started Free
                </Link>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="col-md-4">
              <div
                role="button"
                tabIndex={0}
                className={`card border-0 shadow-lg h-100 p-4 position-relative pricing-plan-card ${selectedPlan === 'premium' ? 'pricing-plan-active' : ''}`}
                onClick={(e) => shouldSelectPlanFromEvent(e) && setSelectedPlan('premium')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPlan('premium');
                  }
                }}
              >
                <div className="position-absolute top-0 start-50 translate-middle">
                  <span className="badge px-3 py-2 fw-semibold"
                    style={{ background: '#e94560', fontSize: '0.75rem' }}>
                    ⭐ Most Popular
                  </span>
                </div>
                <div className="mb-3 mt-2">
                  <span className="badge mb-2" style={{ background: '#fff3cd', color: '#856404' }}>Premium</span>
                  <h4 className="fw-bold">Premium Plan</h4>
                  <div className="d-flex align-items-end gap-2 mb-1">
                    <div className="display-5 fw-bold" style={{ color: '#e94560' }}>
                      PKR {price.toLocaleString()}
                    </div>
                    <div className="text-muted mb-2">/{billing === 'Yearly' ? 'year' : 'month'}</div>
                  </div>
                  {saving && <span className="badge bg-success">{saving}</span>}
                </div>
                <ul className="list-unstyled mb-4 d-flex flex-column gap-2">
                  {[
                    '✅ RFQ Marketplace access',
                    '✅ Unlimited quotes per day',
                    '✅ Full buyer contact (email + phone)',
                    '✅ Priority search ranking',
                    '✅ Verified Premium badge',
                    '✅ Featured profile listing',
                    '✅ Dedicated support',
                  ].map(f => (
                    <li key={f} className="small fw-semibold">{f}</li>
                  ))}
                </ul>

                  <button className="btn w-100 fw-bold py-2 mt-auto"
                    style={{ background: '#e94560', color: '#fff' }}
                    onClick={() => {
                      if (!isAuthenticated) { navigate('/login'); return; }
                      navigate('/upgrade');
                    }}>
                    Upgrade Now →
                  </button>
              </div>
            </div>

            {/* Pay Per Lead */}
            <div className="col-md-4">
              <div
                role="button"
                tabIndex={0}
                className={`card border-0 shadow-sm h-100 p-4 pricing-plan-card ${selectedPlan === 'lead' ? 'pricing-plan-active' : ''}`}
                onClick={(e) => shouldSelectPlanFromEvent(e) && setSelectedPlan('lead')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPlan('lead');
                  }
                }}
              >
                <div className="mb-3">
                  <span className="badge bg-info text-dark mb-2">Flexible</span>
                  <h4 className="fw-bold">Pay Per Lead</h4>
                  <div className="display-5 fw-bold mb-1" style={{ color: '#0f3460' }}>PKR 200</div>
                  <p className="text-muted small">per buyer contact unlocked</p>
                </div>
                <ul className="list-unstyled mb-4 d-flex flex-column gap-2">
                  {[
                    '✅ RFQ Marketplace access',
                    '✅ 5 quotes per day',
                    '✅ Unlock 1 buyer contact per RFQ',
                    '✅ No monthly commitment',
                    '✅ Pay only when you need',
                    '❌ Priority listing',
                    '❌ Verified badge',
                  ].map(f => (
                    <li key={f} className={`small ${f.startsWith('❌') ? 'text-muted' : 'text-dark'}`}>{f}</li>
                  ))}
                </ul>
                <div className="alert py-2 small mb-3" style={{ background: '#f0f8ff', border: '1px solid #bee3f8' }}>
                  💡 Best for occasional suppliers who need flexible lead access
                </div>
                <button
                  type="button"
                  className={`btn w-100 fw-semibold mt-auto ${selectedPlan === 'lead' ? 'btn-danger' : 'btn-outline-dark'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) { navigate('/login'); return; }
                    navigate('/upgrade');
                  }}
                >
                  Open RFQ Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-5">
        <div className="container">
          <h2 className="fw-bold text-center mb-5">Full Feature Comparison</h2>
          <div className="card border-0 shadow-sm overflow-hidden">
            <div className="table-responsive">
              <table className="table mb-0 align-middle">
                <thead style={{ background: '#1a1a2e', color: '#fff' }}>
                  <tr>
                    <th className="py-3 ps-4" style={{ width: '35%' }}>Feature</th>
                    <th className="py-3 text-center">Free</th>
                    <th className="py-3 text-center" style={{ background: '#e94560' }}>
                      ⭐ Premium
                    </th>
                    <th className="py-3 text-center">Pay Per Lead</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURES.map((f, i) => (
                    <tr key={f.label} style={{ background: i % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                      <td className="ps-4 fw-semibold small">{f.label}</td>
                      <td className="text-center small">{f.free}</td>
                      <td className="text-center small fw-semibold" style={{ background: i % 2 === 0 ? '#fff5f5' : '#fff0f0' }}>
                        {f.premium}
                      </td>
                      <td className="text-center small">{f.lead}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-5" style={{ background: '#f4f6fb' }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <h2 className="fw-bold text-center mb-4">Frequently Asked Questions</h2>
          <div className="accordion" id="faqAccordion">
            {[
              { q: 'How does the free plan work?', a: 'Free plan lets you browse all RFQs and submit 1 quote per day. Buyer contact details are hidden — you can unlock them individually for PKR 200 each.' },
              { q: 'How do I upgrade to Premium?', a: 'Send payment via JazzCash, EasyPaisa, or bank transfer, then submit your transaction reference on this page. Our team activates your account within 2 hours.' },
              { q: 'What is Pay Per Lead?', a: 'Instead of a monthly subscription, you pay PKR 200 to unlock the buyer\'s contact details (email + phone) for a specific RFQ, with up to 5 quotes per day included.' },
              { q: 'Can I cancel my subscription?', a: 'Yes. Your Premium access continues until the end of your billing period. We do not offer refunds for activated subscriptions.' },
              { q: 'What payment methods are accepted?', a: 'We accept JazzCash, EasyPaisa, and bank transfer. All payments are manually verified by our team.' },
            ].map((item, i) => (
              <div className="accordion-item border-0 mb-2 shadow-sm rounded overflow-hidden" key={i}>
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed fw-semibold" type="button"
                    data-bs-toggle="collapse" data-bs-target={`#faq${i}`}>
                    {item.q}
                  </button>
                </h2>
                <div id={`faq${i}`} className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                  <div className="accordion-body text-muted">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ background: 'linear-gradient(135deg, #e94560, #0f3460)' }} className="py-5 text-white text-center">
        <div className="container">
          <h2 className="fw-bold mb-3">Ready to grow your export business?</h2>
          <p className="lead opacity-75 mb-4">Join 500+ verified suppliers already using Zofa B2B Trading</p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <button
              type="button"
              className="btn btn-light btn-lg fw-bold px-5"
              onClick={handleUpgradeRedirect}
            >
              Apply Now — Free
            </button>
            <button className="btn btn-outline-light btn-lg px-5"
              onClick={() => { document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }); }}>
              View Plans
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
