import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { isCandidate, isInterviewer, roleLabel } from '../utils/roles';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/">Candidate Selection</NavLink>
        <nav className="nav">
          {user ? (
            <>
              <NavLink to="/projects">Projects</NavLink>
              {isCandidate(user) && <NavLink to="/applications">My applications</NavLink>}
              {isInterviewer(user) && <NavLink to="/interviews">Interviews</NavLink>}
              <span className="user-pill">{user.name} · {roleLabel(user.role)}</span>
              <button className="button secondary" type="button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
