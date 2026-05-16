import { useEffect, useState } from 'react';
import Alert from '../components/Alert.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, LoadingState, PageHeader } from '../components/StateBlock.jsx';
import { getApiError } from '../api/client';
import { applicationApi } from '../api/endpoints';
import { asArray, formatDateTime } from '../utils/data';
import { logger } from '../utils/logger';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [results, setResults] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingResultId, setLoadingResultId] = useState(null);

  async function loadApplications() {
    setLoading(true);
    setError('');

    try {
      const { data } = await applicationApi.mine();
      setApplications(asArray(data.applications));
    } catch (err) {
      const text = getApiError(err);
      logger.error('my_applications_load_failed', { message: text });
      setError(text);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadResult(applicationId) {
    setLoadingResultId(applicationId);

    try {
      const { data } = await applicationApi.result(applicationId);
      setResults((current) => ({ ...current, [applicationId]: data.result }));
      logger.action('application_result_loaded', { application_id: applicationId });
    } catch (err) {
      const text = getApiError(err);
      logger.error('application_result_load_failed', {
        application_id: applicationId,
        message: text,
      });
      setResults((current) => ({
        ...current,
        [applicationId]: { error: text },
      }));
    } finally {
      setLoadingResultId(null);
    }
  }

  return (
    <section className="stack">
      <PageHeader
        title="My applications"
        description="Track application status, interview result, and final decision."
      />

      <Alert type="error">{error}</Alert>

      {loading ? (
        <LoadingState>Loading applications...</LoadingState>
      ) : applications.length ? (
        <div className="stack">
          {applications.map((application) => {
            const result = results[application.application_id];

            return (
              <article className="card wide-card" key={application.application_id}>
                <div className="card-header">
                  <div>
                    <h2>{application.vacancy?.title || `Vacancy ${application.vacancy_id}`}</h2>
                    <p className="muted">{application.vacancy?.project?.name || 'Project is not available'}</p>
                  </div>
                  <StatusBadge>{application.status}</StatusBadge>
                </div>

                <div className="meta-list">
                  <span>Application ID: {application.application_id}</span>
                  <span>Created: {formatDateTime(application.created_at)}</span>
                  {application.decision_at && <span>Decision: {formatDateTime(application.decision_at)}</span>}
                </div>

                {application.decision_comment && (
                  <p className="muted">Decision comment: {application.decision_comment}</p>
                )}

                <button
                  className="button secondary"
                  type="button"
                  onClick={() => loadResult(application.application_id)}
                  disabled={loadingResultId === application.application_id}
                >
                  {loadingResultId === application.application_id ? 'Loading...' : 'Load result'}
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
        <EmptyState title="No applications yet">
          Open a project vacancy and submit an application.
        </EmptyState>
      )}
    </section>
  );
}
