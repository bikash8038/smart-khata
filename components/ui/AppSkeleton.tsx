import "./app-skeleton.css";

export function AppSkeleton() {
  return <main className="app-skeleton" aria-label="Loading Smart Khata"><aside className="skeleton-sidebar"><span className="skeleton-line skeleton-brand" /><span className="skeleton-line" /><span className="skeleton-line" /><span className="skeleton-line" /><span className="skeleton-line" /></aside><section className="skeleton-content"><header><span className="skeleton-line skeleton-title" /><span className="skeleton-line skeleton-action" /></header><span className="skeleton-line skeleton-heading" /><div className="skeleton-metrics"><span className="skeleton-card" /><span className="skeleton-card" /><span className="skeleton-card" /></div><span className="skeleton-panel" /></section></main>;
}

export function PageSkeleton() {
  return <section className="page-skeleton" aria-label="Loading page"><span className="skeleton-line skeleton-heading" /><div className="skeleton-metrics"><span className="skeleton-card" /><span className="skeleton-card" /><span className="skeleton-card" /></div><span className="skeleton-panel" /></section>;
}
