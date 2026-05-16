import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Field from '../components/Field.jsx';
import { getApiError } from '../api/client';
import { useAuth } from '../hooks/useAuth.jsx';
import { ROLE_OPTIONS } from '../utils/roles';
import { logger } from '../utils/logger';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CANDIDATE',
  });
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
      await register(form);
      navigate('/projects');
    } catch (err) {
      const message = getApiError(err);
      logger.error('register_form_failed', {
        email: form.email,
        role: form.role,
        message,
      });
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="panel auth-card form-grid" onSubmit={handleSubmit}>
        <div>
          <h1>Register</h1>
          <p className="muted">Create an account for one of the system roles.</p>
        </div>
        <Alert type="error">{error}</Alert>
        <Field label="Name">
          <input name="name" value={form.name} onChange={updateField} required />
        </Field>
        <Field label="Email">
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </Field>
        <Field label="Password">
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            minLength={6}
            required
          />
        </Field>
        <Field label="Role">
          <select name="role" value={form.role} onChange={updateField}>
            {ROLE_OPTIONS.map((role) => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
        </Field>
        <button className="button primary" type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Register'}
        </button>
        <p className="muted">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  );
}
