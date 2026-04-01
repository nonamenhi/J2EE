import './Skeleton.css';

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img shimmer" />
      <div className="skeleton-body">
        <div className="skeleton-line shimmer" style={{ width: '80%' }} />
        <div className="skeleton-line shimmer" style={{ width: '60%' }} />
        <div className="skeleton-line shimmer short" style={{ width: '40%' }} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 6 }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="skeleton-detail">
      <div className="skeleton-banner shimmer" />
      <div className="skeleton-line shimmer" style={{ width: '60%', height: '2rem', marginTop: '1.5rem' }} />
      <div className="skeleton-line shimmer" style={{ width: '40%' }} />
      <div className="skeleton-line shimmer" style={{ width: '100%', height: '8rem', marginTop: '1rem' }} />
    </div>
  );
}
