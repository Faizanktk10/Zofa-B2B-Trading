import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';

const UNITS = ['KG', 'Ton', 'Piece', 'Meter', 'Liter', 'Box', 'Bundle', 'Set', 'Dozen', 'Quintal', 'Bag', 'Roll'];
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Sukkur', 'Abbottabad', 'Bahawalpur', 'Sargodha'];

export default function PostRFQ() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', quantity: '', unit: 'KG',
    targetPrice: '', deliveryCity: '', deadlineDate: '', categoryId: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(() => {
    api.get('/categories').then(r => setCategories(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'Buyer') { navigate('/login'); return; }
    loadCategories();
  }, [user, navigate, loadCategories]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        categoryId: parseInt(form.categoryId),
        targetPrice: form.targetPrice ? parseFloat(form.targetPrice) : null,
        deadlineDate: form.deadlineDate || null
      };
      await api.post('/rfqs', payload);
      navigate('/dashboard/buyer');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post RFQ. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f4f6fb', minHeight: '100vh' }}>
      <SEO title="Post RFQ" description="Post a Request for Quotation on Zofa B2B Trading and receive quotes from verified Pakistani suppliers." />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }} className="py-4">
        <div className="container">
          <h4 className="fw-bold text-white mb-0">📤 Post a New RFQ</h4>
          <p className="text-white-50 small mb-0">Describe your requirement and suppliers will send you competitive quotes</p>
        </div>
      </div>

      <div className="container py-4">
        <div className="row g-4">
          {/* Form */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm p-4">
              {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  {/* Title */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      RFQ Title <span className="text-danger">*</span>
                    </label>
                    <input className="form-control" required
                      placeholder='e.g. "Need 500 KG scrap copper wire" or "Looking for cotton yarn supplier"'
                      value={form.title} onChange={set('title')} />
                    <div className="form-text">Be specific — better titles get more quotes</div>
                  </div>

                  {/* Category */}
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      Category <span className="text-danger">*</span>
                    </label>
                    <select className="form-select" required value={form.categoryId} onChange={set('categoryId')}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* Quantity + Unit */}
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">
                      Quantity <span className="text-danger">*</span>
                    </label>
                    <input className="form-control" required placeholder="e.g. 500"
                      value={form.quantity} onChange={set('quantity')} />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold">Unit <span className="text-danger">*</span></label>
                    <select className="form-select" value={form.unit} onChange={set('unit')}>
                      {UNITS.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Detailed Description <span className="text-danger">*</span>
                    </label>
                    <textarea className="form-control" rows={5} required
                      placeholder="Describe your requirement in detail:&#10;- Product specifications (grade, quality, size)&#10;- Packaging requirements&#10;- Any certifications needed&#10;- Delivery terms"
                      value={form.description} onChange={set('description')} />
                  </div>

                  {/* Target Price */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Target Price (PKR)</label>
                    <div className="input-group">
                      <span className="input-group-text">PKR</span>
                      <input type="number" className="form-control" placeholder="Optional"
                        value={form.targetPrice} onChange={set('targetPrice')} />
                    </div>
                    <div className="form-text">Leave blank if flexible</div>
                  </div>

                  {/* Delivery City */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Delivery City</label>
                    <select className="form-select" value={form.deliveryCity} onChange={set('deliveryCity')}>
                      <option value="">Select City</option>
                      {CITIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Deadline */}
                  <div className="col-md-4">
                    <label className="form-label fw-semibold">Deadline Date</label>
                    <input type="date" className="form-control"
                      min={new Date().toISOString().split('T')[0]}
                      value={form.deadlineDate} onChange={set('deadlineDate')} />
                  </div>

                  {/* Submit */}
                  <div className="col-12 d-flex gap-2 pt-2">
                    <button type="submit" className="btn fw-bold px-5 py-2" disabled={loading}
                      style={{ background: '#e94560', color: '#fff' }}>
                      {loading ? (
                        <><span className="spinner-border spinner-border-sm me-2" />Posting...</>
                      ) : '📤 Post RFQ Now'}
                    </button>
                    <button type="button" className="btn btn-light px-4"
                      onClick={() => navigate('/dashboard/buyer')}>
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar Tips */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm p-4 mb-3"
              style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', color: '#fff' }}>
              <h6 className="fw-bold mb-3">✅ How it works</h6>
              {[
                { step: '1', text: 'Post your RFQ with product details' },
                { step: '2', text: 'Verified suppliers see your requirement' },
                { step: '3', text: 'Receive competitive quotes within hours' },
                { step: '4', text: 'Compare and accept the best offer' },
              ].map(s => (
                <div key={s.step} className="d-flex gap-2 mb-2 align-items-start">
                  <span className="rounded-circle d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                    style={{ width: 22, height: 22, background: '#e94560', fontSize: '0.7rem' }}>
                    {s.step}
                  </span>
                  <span className="small opacity-75">{s.text}</span>
                </div>
              ))}
            </div>

            <div className="card border-0 shadow-sm p-4 mb-3">
              <h6 className="fw-bold mb-3">💡 Tips for better quotes</h6>
              <ul className="list-unstyled small text-muted d-flex flex-column gap-2 mb-0">
                <li>✓ Be specific about quality/grade</li>
                <li>✓ Mention packaging requirements</li>
                <li>✓ Set a realistic target price</li>
                <li>✓ Add a deadline to create urgency</li>
                <li>✓ Include delivery city for accurate quotes</li>
              </ul>
            </div>

            <div className="card border-0 shadow-sm p-4" style={{ background: '#fff8f0' }}>
              <h6 className="fw-bold mb-2">🆓 Free to Post</h6>
              <p className="small text-muted mb-0">
                Posting RFQs is completely free for buyers. You only pay if you choose to feature your RFQ for priority visibility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
