export function LoadingState({ children = 'Loading...' }) {
  return <div className="state-block">{children}</div>;
}

export function EmptyState({ title = 'Nothing here yet', children }) {
  return (
    <div className="state-block">
      <strong>{title}</strong>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}
