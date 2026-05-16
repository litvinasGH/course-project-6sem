import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { LoadingState } from './StateBlock.jsx';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState>Loading session...</LoadingState>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return (
      <section className="panel">
        <h1>Access denied</h1>
        <p className="muted">This page is not available for your role.</p>
      </section>
    );
  }

  return children;
}
