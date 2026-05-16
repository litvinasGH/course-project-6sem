function normalizeStatus(value) {
  return String(value || 'unknown').replaceAll('_', ' ');
}

export default function StatusBadge({ children }) {
  return <span className="status-badge">{normalizeStatus(children)}</span>;
}
