import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Field from '../components/Field.jsx';
import { getApiError } from '../api/client';
import { useAuth } from '../hooks/useAuth.jsx';

const roles = [
  { value: 'CANDIDATE', label: 'Candidate' },
  { value: 'INTERVIEWER', label: 'Interviewer' },
  { value: 'PROJECT_MANAGER', label: 'Project Manager' },
];

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
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="panel auth-card" onSubmit={handleSubmit}>
        <h1>Register</h1>
        <p className="muted">Create a test account for one of the system roles.</p>
        <Alert type="error">{error}</Alert>
        <Field label="Name">
          <input name="name" value={form.name} onChange={updateField} required />
        </Field>
        <Field label="Email">
          <input name="email" type="email" value={form.email} onChange={updateField} required />
        </Field>
        <Field label="Password">
          <input name="password" type="password" value={form.password} onChange={updateField} minLength={6} required />
        </Field>
        <Field label="Role">
          <select name="role" value={form.role} onChange={updateField}>
            {roles.map((role) => (
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
