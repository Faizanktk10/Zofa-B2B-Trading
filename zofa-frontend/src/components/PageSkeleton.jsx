export function CardGridSkeleton({ count = 6, cols = 'col-md-6 col-lg-4' }) {
  return (
    <div className="row g-3">
      {Array.from({ length: count }).map((_, i) => (
        <div className={cols} key={i}>
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body placeholder-glow">
              <span className="placeholder col-8 mb-2 d-block" />
              <span className="placeholder col-6 mb-2 d-block" />
              <span className="placeholder col-4 d-block" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 6 }) {
  return (
    <div className="table-responsive placeholder-glow">
      <table className="table align-middle mb-0">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              {Array.from({ length: cols }).map((_, j) => (
                <td key={j}><span className="placeholder col-12 d-block" style={{ minHeight: 14 }} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="container py-4">
      <div className="placeholder-glow mb-3"><span className="placeholder col-3" /></div>
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-4 placeholder-glow">
            <span className="placeholder col-10 mb-3 d-block" />
            <span className="placeholder col-12 mb-2 d-block" />
            <span className="placeholder col-12 mb-2 d-block" />
            <span className="placeholder col-8 d-block" />
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 placeholder-glow">
            <span className="placeholder col-8 mb-3 d-block" />
            <span className="placeholder col-12 mb-2 d-block" />
            <span className="placeholder col-12 d-block" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 text-center placeholder-glow">
            <span className="placeholder rounded-circle d-inline-block mb-3" style={{ width: 80, height: 80 }} />
            <span className="placeholder col-8 mx-auto mb-2 d-block" />
            <span className="placeholder col-6 mx-auto d-block" />
          </div>
        </div>
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-4 placeholder-glow">
            <span className="placeholder col-4 mb-3 d-block" />
            <span className="placeholder col-12 mb-2 d-block" />
            <span className="placeholder col-12 mb-2 d-block" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm p-4 placeholder-glow">
            <span className="placeholder col-4 mb-4 d-block" />
            <span className="placeholder col-12 mb-3 d-block" style={{ minHeight: 38 }} />
            <span className="placeholder col-12 mb-3 d-block" style={{ minHeight: 38 }} />
            <span className="placeholder col-12 mb-3 d-block" style={{ minHeight: 38 }} />
            <span className="placeholder col-4 d-block" style={{ minHeight: 38 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatsSkeleton({ count = 4 }) {
  return (
    <div className="row g-3 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <div className="col-6 col-md-3" key={i}>
          <div className="card border-0 shadow-sm p-3 placeholder-glow">
            <span className="placeholder col-6 mb-2 d-block" />
            <span className="placeholder col-4 d-block" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListCardSkeleton({ count = 3 }) {
  return (
    <div className="d-flex flex-column gap-3 placeholder-glow">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card border-0 shadow-sm p-4">
          <span className="placeholder col-6 mb-2 d-block" />
          <span className="placeholder col-10 mb-2 d-block" />
          <span className="placeholder col-8 d-block" />
        </div>
      ))}
    </div>
  );
}
