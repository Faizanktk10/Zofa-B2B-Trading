import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5 text-center">
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h4 className="fw-bold mt-3">Something went wrong</h4>
          <p className="text-muted">{this.state.error?.message}</p>
          <button className="btn fw-semibold" style={{ background: '#e94560', color: '#fff' }}
            onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
