export default function StatusBadge({ children }) {
  return <span className="status-badge">{children || 'unknown'}</span>;
}
