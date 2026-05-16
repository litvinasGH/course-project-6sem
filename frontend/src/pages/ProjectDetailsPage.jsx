import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Field from '../components/Field.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, LoadingState, PageHeader } from '../components/StateBlock.jsx';
import { getApiError } from '../api/client';
import { projectApi } from '../api/endpoints';
import { loadProjectWithVacancies } from '../api/loaders';
import { useAuth } from '../hooks/useAuth.jsx';
import { compactText } from '../utils/data';
import { isManager } from '../utils/roles';
import { logger } from '../utils/logger';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', status: 'OPEN' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadVacancies() {
    setLoading(true);
    setError('');

    try {
      const data = await loadProjectWithVacancies(id);
      setProject(data.project);
      setVacancies(data.vacancies);
    } catch (err) {
      const text = getApiError(err);
      logger.error('project_details_load_failed', { project_id: id, message: text });
      setError(text);
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
    setSubmitting(true);
    logger.action('vacancy_create_submit', { project_id: id, title: form.title });

    try {
      await projectApi.createVacancy(id, form);
      setForm({ title: '', description: '', status: 'OPEN' });
      setMessage('Vacancy created.');
      await loadVacancies();
    } catch (err) {
      const text = getApiError(err);
      logger.error('vacancy_create_failed', {
        project_id: id,
        title: form.title,
        message: text,
      });
      setError(text);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack">
      <PageHeader
        title={project?.name || `Project ${id}`}
        description={project?.description || `Project ID: ${id}`}
        actions={<Link className="button secondary" to="/projects">Back to projects</Link>}
      />

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
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create vacancy'}
          </button>
        </form>
      )}

      {loading ? (
        <LoadingState>Loading vacancies...</LoadingState>
      ) : vacancies.length ? (
        <div className="grid-list">
          {vacancies.map((vacancy) => (
            <article className="card" key={vacancy.vacancy_id}>
              <div className="card-header">
                <h2>{vacancy.title}</h2>
                <StatusBadge>{vacancy.status}</StatusBadge>
              </div>
              <p className="muted">{compactText(vacancy.description, 'No description')}</p>
              <p className="meta">Vacancy ID: {vacancy.vacancy_id}</p>
              <Link
                className="button secondary"
                to={`/vacancies/${vacancy.vacancy_id}`}
                state={{ vacancy, project }}
              >
                Open vacancy
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No vacancies yet">
          This project does not have vacancies.
        </EmptyState>
      )}
    </section>
  );
}
