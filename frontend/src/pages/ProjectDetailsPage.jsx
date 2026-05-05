import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Field from '../components/Field.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { getApiError } from '../api/client';
import { projectApi } from '../api/endpoints';
import { useAuth } from '../hooks/useAuth.jsx';
import { isManager } from '../utils/roles';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', status: 'OPEN' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadVacancies() {
    setLoading(true);
    setError('');

    try {
      const { data } = await projectApi.vacancies(id);
      setVacancies(data.vacancies || []);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVacancies();
  }, [id]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function createVacancy(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await projectApi.createVacancy(id, form);
      setForm({ title: '', description: '', status: 'OPEN' });
      setMessage('Vacancy created.');
      await loadVacancies();
    } catch (err) {
      setError(getApiError(err));
    }
  }

  return (
    <section className="stack">
      <div className="page-title">
        <div>
          <h1>Project vacancies</h1>
          <p className="muted">Project ID: {id}</p>
        </div>
        <Link className="button secondary" to="/projects">Back to projects</Link>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{message}</Alert>

      {isManager(user) && (
        <form className="panel form-grid" onSubmit={createVacancy}>
          <h2>Create vacancy</h2>
          <Field label="Title">
            <input name="title" value={form.title} onChange={updateField} required />
          </Field>
          <Field label="Description">
            <textarea name="description" value={form.description} onChange={updateField} rows={3} />
          </Field>
          <Field label="Status">
            <select name="status" value={form.status} onChange={updateField}>
              <option value="OPEN">Open</option>
              <option value="PAUSED">Paused</option>
              <option value="CLOSED">Closed</option>
            </select>
          </Field>
          <button className="button primary" type="submit">Create vacancy</button>
        </form>
      )}

      <div className="grid-list">
        {loading ? (
          <div className="panel">Loading vacancies...</div>
        ) : vacancies.length ? (
          vacancies.map((vacancy) => (
            <article className="card" key={vacancy.vacancy_id}>
              <div className="card-header">
                <h2>{vacancy.title}</h2>
                <StatusBadge>{vacancy.status}</StatusBadge>
              </div>
              <p className="muted">{vacancy.description || 'No description'}</p>
              <p className="meta">Vacancy ID: {vacancy.vacancy_id}</p>
              <Link
                className="button secondary"
                to={`/vacancies/${vacancy.vacancy_id}`}
                state={{ vacancy }}
              >
                Open vacancy
              </Link>
            </article>
          ))
        ) : (
          <div className="panel">No vacancies for this project yet.</div>
        )}
      </div>
    </section>
  );
}
