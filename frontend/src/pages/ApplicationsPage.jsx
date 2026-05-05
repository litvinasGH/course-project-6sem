import { useEffect, useState } from 'react';
import Alert from '../components/Alert.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { getApiError } from '../api/client';
import { applicationApi } from '../api/endpoints';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [results, setResults] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadApplications() {
    setLoading(true);
    setError('');

    try {
      const { data } = await applicationApi.mine();
      setApplications(data.applications || []);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadResult(applicationId) {
    setError('');

    try {
      const { data } = await applicationApi.result(applicationId);
      setResults((current) => ({ ...current, [applicationId]: data.result }));
    } catch (err) {
      setResults((current) => ({
        ...current,
        [applicationId]: { error: getApiError(err) },
      }));
    }
  }

  return (
    <section className="stack">
      <div className="page-title">
        <div>
          <h1>My applications</h1>
          <p className="muted">Track application status and final results.</p>
        </div>
      </div>

      <Alert type="error">{error}</Alert>

      {loading ? (
        <div className="panel">Loading applications...</div>
      ) : applications.length ? (
        <div className="stack">
          {applications.map((application) => {
            const result = results[application.application_id];

            return (
              <article className="card wide-card" key={application.application_id}>
                <div className="card-header">
                  <div>
                    <h2>{application.vacancy?.title || `Vacancy ${application.vacancy_id}`}</h2>
                    <p className="muted">{application.vacancy?.project?.name || 'Project'}</p>
                  </div>
                  <StatusBadge>{application.status}</StatusBadge>
                </div>
                <p className="meta">Application ID: {application.application_id}</p>
                <button className="button secondary" type="button" onClick={() => loadResult(application.application_id)}>
                  Load result
                </button>
                {result?.error && <Alert type="error">{result.error}</Alert>}
                {result && !result.error && (
                  <div className="result-box">
                    <strong>Score: {result.score}/10</strong>
                    <span>Recommendation: {result.recommendation}</span>
                    <p>{result.comment || 'No comment'}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel">You have not applied to any vacancies yet.</div>
      )}
    </section>
  );
}
