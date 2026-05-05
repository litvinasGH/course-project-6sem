import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Field from '../components/Field.jsx';
import { getApiError } from '../api/client';
import { projectApi } from '../api/endpoints';
import { useAuth } from '../hooks/useAuth.jsx';
import { isManager } from '../utils/roles';

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadProjects() {
    setLoading(true);
    setError('');

    try {
      const { data } = await projectApi.list();
      setProjects(data.projects || []);
    } catch (err) {
      setError(getApiError(err));
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

    try {
      await projectApi.create(form);
      setForm({ name: '', description: '' });
      setMessage('Project created.');
      await loadProjects();
    } catch (err) {
      setError(getApiError(err));
    }
  }

  return (
    <section className="stack">
      <div className="page-title">
        <div>
          <h1>Projects</h1>
          <p className="muted">Browse projects and open project vacancy lists.</p>
        </div>
      </div>

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
          <button className="button primary" type="submit">Create project</button>
        </form>
      )}

      <div className="grid-list">
        {loading ? (
          <div className="panel">Loading projects...</div>
        ) : projects.length ? (
          projects.map((project) => (
            <article className="card" key={project.project_id}>
              <h2>{project.name}</h2>
              <p className="muted">{project.description || 'No description'}</p>
              <p className="meta">Owner ID: {project.owner_id}</p>
              <Link className="button secondary" to={`/projects/${project.project_id}`}>Open vacancies</Link>
            </article>
          ))
        ) : (
          <div className="panel">No projects yet.</div>
        )}
      </div>
    </section>
  );
}
