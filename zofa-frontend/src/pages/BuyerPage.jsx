import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const initialForm = {
  title: '',
  category: '',
  description: '',
  city: '',
};

const starterRfqs = [
  {
    id: 1,
    title: 'Need Wholesale Cotton Fabric',
    category: 'Textiles',
    description: 'Looking for 5,000 meters of cotton fabric, export quality and ready stock preferred.',
    city: 'Karachi',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Industrial LED Lights Requirement',
    category: 'Electronics',
    description: 'Bulk order for warehouse LED lights with warranty and delivery timeline in quote.',
    city: 'Lahore',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function BuyerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [rfqs, setRfqs] = useState(starterRfqs);

  const categories = useMemo(
    () => ['Textiles', 'Electronics', 'Construction', 'Agriculture', 'Packaging', 'Other'],
    []
  );

  const onInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!form.title || !form.category || !form.description || !form.city) return;

    const newRfq = {
      id: Date.now(),
      ...form,
      createdAt: new Date().toISOString(),
    };

    setRfqs((prev) => [newRfq, ...prev]);
    setForm(initialForm);
  };

  const viewQuotes = (rfqId) => {
    navigate(`/rfqs/${rfqId}`);
  };

  const contactSupplier = () => {
    navigate('/categories');
  };

  return (
    <div className="container py-4 py-md-5">
      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h4 fw-bold mb-3">Create RFQ</h2>
              <p className="text-muted mb-4">Post your requirement and start receiving supplier quotations.</p>

              <form onSubmit={onSubmit} className="d-grid gap-3">
                <div>
                  <label htmlFor="rfq-title" className="form-label fw-semibold">Title</label>
                  <input
                    id="rfq-title"
                    name="title"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Need 1,000 cartons"
                    value={form.title}
                    onChange={onInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="rfq-category" className="form-label fw-semibold">Category</label>
                  <select
                    id="rfq-category"
                    name="category"
                    className="form-select"
                    value={form.category}
                    onChange={onInputChange}
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="rfq-description" className="form-label fw-semibold">Description</label>
                  <textarea
                    id="rfq-description"
                    name="description"
                    rows="4"
                    className="form-control"
                    placeholder="Provide quantity, quality specs, and expected timeline."
                    value={form.description}
                    onChange={onInputChange}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="rfq-city" className="form-label fw-semibold">City</label>
                  <input
                    id="rfq-city"
                    name="city"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Faisalabad"
                    value={form.city}
                    onChange={onInputChange}
                    required
                  />
                </div>

                <button type="submit" className="btn fw-semibold" style={{ background: '#e94560', color: '#fff' }}>
                  Submit RFQ
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h4 fw-bold mb-0">Recent RFQs</h2>
            <span className="badge text-bg-light border">{rfqs.length} total</span>
          </div>

          <div className="d-grid gap-3">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                    <h3 className="h5 fw-bold mb-0">{rfq.title}</h3>
                    <span className="badge text-bg-secondary">{rfq.category}</span>
                  </div>
                  <p className="text-muted mb-3">{rfq.description}</p>
                  <div className="small text-muted mb-3 d-flex flex-wrap gap-3">
                    <span><strong>City:</strong> {rfq.city}</span>
                    <span><strong>Created:</strong> {new Date(rfq.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => viewQuotes(rfq.id)}>View Quotes</button>
                    <button type="button" className="btn btn-outline-primary btn-sm" onClick={contactSupplier}>Contact Supplier</button>
                    <a
                      className="btn btn-outline-success btn-sm"
                      href="https://wa.me/923001234567"
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
