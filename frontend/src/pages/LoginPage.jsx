import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Field from '../components/Field.jsx';
import { getApiError } from '../api/client';
import { useAuth } from '../hooks/useAuth.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form);
      navigate('/projects');
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="panel auth-card" onSubmit={handleSubmit}>
        <h1>Login</h1>
        <p className="muted">Sign in to continue managing candidate selection.</p>
        <Alert type="error">{error}</Alert>
        <Field label="Email">
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </Field>
        <Field label="Password">
          <input name="password" type="password" value={form.password} onChange={updateField} required />
        </Field>
        <button className="button primary" type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
        <p className="muted">
          No account yet? <Link to="/register">Create one</Link>
        </p>
      </form>
    </section>
  );
}
