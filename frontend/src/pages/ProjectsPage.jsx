import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Field from '../components/Field.jsx';
import { EmptyState, LoadingState, PageHeader } from '../components/StateBlock.jsx';
import { getApiError } from '../api/client';
import { projectApi } from '../api/endpoints';
import { loadProjectList } from '../api/loaders';
import { useAuth } from '../hooks/useAuth.jsx';
import { isManager } from '../utils/roles';
import { compactText } from '../utils/data';
import { logger } from '../utils/logger';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadProjects() {
    setLoading(true);
    setError('');

    try {
      const items = await loadProjectList();
      setProjects(items);
    } catch (err) {
      const text = getApiError(err);
      logger.error('projects_load_failed', { message: text });
      setError(text);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function createProject(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    logger.action('project_create_submit', { name: form.name });

    try {
      await projectApi.create(form);
      setForm({ name: '', description: '' });
      setMessage('Project created.');
      await loadProjects();
    } catch (err) {
      const text = getApiError(err);
      logger.error('project_create_failed', { name: form.name, message: text });
      setError(text);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="stack">
      <PageHeader
        title="Projects"
        description="Browse projects and open vacancy lists."
      />

      <Alert type="error">{error}</Alert>
      <Alert type="success">{message}</Alert>

      {isManager(user) && (
        <form className="panel form-grid" onSubmit={createProject}>
          <h2>Create project</h2>
          <Field label="Name">
            <input name="name" value={form.name} onChange={updateField} required />
          </Field>
          <Field label="Description">
            <textarea name="description" value={form.description} onChange={updateField} rows={3} />
          </Field>
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create project'}
          </button>
        </form>
      )}

      {loading ? (
        <LoadingState>Loading projects...</LoadingState>
      ) : projects.length ? (
        <div className="grid-list">
          {projects.map((project) => (
            <article className="card" key={project.project_id}>
              <div>
                <h2>{project.name}</h2>
                <p className="muted">{compactText(project.description, 'No description')}</p>
              </div>
              <p className="meta">Project ID: {project.project_id}</p>
              <Link className="button secondary" to={`/projects/${project.project_id}`}>
                Open vacancies
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No projects yet">
          A project manager can create the first project from this page.
        </EmptyState>
      )}
    </section>
  );
}
