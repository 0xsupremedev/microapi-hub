export function Skeleton({ className = '', width, height }: { className?: string; width?: string | number; height?: string | number }) {
  return (
    <div
      className={`animate-pulse bg-slate-800 rounded ${className}`}
      style={{ width: width || '100%', height: height || '1rem' }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-slate-900 rounded-xl border border-brand/20 p-6 space-y-4">
      <Skeleton height="1.5rem" />
      <Skeleton height="1rem" width="60%" />
      <Skeleton height="1rem" width="40%" />
    </div>
  );
}

