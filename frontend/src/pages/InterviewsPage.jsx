import { useEffect, useState } from 'react';
import Alert from '../components/Alert.jsx';
import Field from '../components/Field.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { EmptyState, LoadingState, PageHeader } from '../components/StateBlock.jsx';
import { getApiError } from '../api/client';
import { interviewApi } from '../api/endpoints';
import { asArray, formatDateTime, toDateTimeLocalValue } from '../utils/data';
import { logger } from '../utils/logger';

const recommendations = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'not_recommended', label: 'Not recommended' },
  { value: 'reserve', label: 'Reserve' },
  { value: 'additional_interview', label: 'Additional interview' },
];

function defaultForm(interview) {
  return {
    date: toDateTimeLocalValue(interview?.date),
    score: '',
    comment: '',
    recommendation: 'recommended',
  };
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [forms, setForms] = useState({});
  const [results, setResults] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');

  async function loadInterviews() {
    setLoading(true);
    setError('');

    try {
      const { data } = await interviewApi.assigned();
      setInterviews(asArray(data.interviews));
    } catch (err) {
      const text = getApiError(err);
      logger.error('assigned_interviews_load_failed', { message: text });
      setError(text);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInterviews();
  }, []);

  function formFor(interview) {
    return forms[interview.interview_id] || defaultForm(interview);
  }

  function updateForm(interview, field, value) {
    setForms((current) => ({
      ...current,
      [interview.interview_id]: {
        ...(current[interview.interview_id] || defaultForm(interview)),
        [field]: value,
      },
    }));
  }

  async function runAction(key, success, action) {
    setError('');
    setMessage('');
    setBusyKey(key);

    try {
      await action();
      setMessage(success);
      logger.action(`${key}_success`);
      await loadInterviews();
    } catch (err) {
      const text = getApiError(err);
      logger.error(`${key}_failed`, { message: text });
      setError(text);
    } finally {
      setBusyKey('');
    }
  }

  function schedule(interview) {
    const form = formFor(interview);

    if (!form.date) {
      setError('Choose interview date and time first.');
      logger.warn('interview_schedule_missing_date', { interview_id: interview.interview_id });
      return undefined;
    }

    return runAction(`interview_${interview.interview_id}_schedule`, 'Interview scheduled.', () => (
      interviewApi.schedule(interview.interview_id, new Date(form.date).toISOString())
    ));
  }

  function complete(interview) {
    return runAction(`interview_${interview.interview_id}_complete`, 'Interview marked as completed.', () => (
      interviewApi.complete(interview.interview_id)
    ));
  }

  function cancel(interview) {
    return runAction(`interview_${interview.interview_id}_cancel`, 'Interview canceled.', () => (
      interviewApi.cancel(interview.interview_id)
    ));
  }

  function loadResult(interview) {
    return runAction(`interview_${interview.interview_id}_result_load`, 'Result loaded.', async () => {
      const { data } = await interviewApi.result(interview.interview_id);
      const result = data.result;

      setResults((current) => ({ ...current, [interview.interview_id]: result }));
      setForms((current) => ({
        ...current,
        [interview.interview_id]: {
          ...(current[interview.interview_id] || defaultForm(interview)),
          score: String(result.score ?? ''),
          comment: result.comment || '',
          recommendation: result.recommendation || 'recommended',
        },
      }));
    });
  }

  function saveResult(interview) {
    const form = formFor(interview);
    const payload = {
      score: Number(form.score),
      comment: form.comment,
      recommendation: form.recommendation,
    };

    return runAction(`interview_${interview.interview_id}_result_save`, 'Interview result saved.', async () => {
      try {
        const { data } = await interviewApi.createResult(interview.interview_id, payload);
        setResults((current) => ({ ...current, [interview.interview_id]: data.result }));
      } catch (err) {
        if (err.response?.status !== 409) {
          throw err;
        }

        const { data } = await interviewApi.updateResult(interview.interview_id, payload);
        setResults((current) => ({ ...current, [interview.interview_id]: data.result }));
      }
    });
  }

  return (
    <section className="stack">
      <PageHeader
        title="Assigned interviews"
        description="Schedule, complete, and evaluate assigned candidates."
      />

      <Alert type="error">{error}</Alert>
      <Alert type="success">{message}</Alert>

      {loading ? (
        <LoadingState>Loading interviews...</LoadingState>
      ) : interviews.length ? (
        <div className="stack">
          {interviews.map((interview) => {
            const form = formFor(interview);
            const result = results[interview.interview_id];
            const isBusy = busyKey.startsWith(`interview_${interview.interview_id}_`);

            return (
              <article className="card wide-card" key={interview.interview_id}>
                <div className="card-header">
                  <div>
                    <h2>Interview #{interview.interview_id}</h2>
                    <p className="muted">
                      Application #{interview.application_id}
                      {interview.application?.vacancy?.title ? ` / ${interview.application.vacancy.title}` : ''}
                    </p>
                  </div>
                  <StatusBadge>{interview.status}</StatusBadge>
                </div>

                <div className="meta-list">
                  <span>Date: {formatDateTime(interview.date)}</span>
                  <span>Candidate ID: {interview.application?.user_id || 'Unknown'}</span>
                  <span>Project: {interview.application?.vacancy?.project?.name || 'Unknown'}</span>
                </div>

                <div className="split-grid">
                  <div className="subpanel">
                    <h3>Schedule</h3>
                    <Field label="Date and time">
                      <input
                        type="datetime-local"
                        value={form.date}
                        onChange={(event) => updateForm(interview, 'date', event.target.value)}
                      />
                    </Field>
                    <div className="button-row">
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => schedule(interview)}
                        disabled={isBusy}
                      >
                        Schedule
                      </button>
                      <button
                        className="button primary"
                        type="button"
                        onClick={() => complete(interview)}
                        disabled={isBusy}
                      >
                        Complete
                      </button>
                      <button
                        className="button danger"
                        type="button"
                        onClick={() => cancel(interview)}
                        disabled={isBusy}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  <div className="subpanel">
                    <h3>Evaluation</h3>
                    <Field label="Score">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={form.score}
                        onChange={(event) => updateForm(interview, 'score', event.target.value)}
                      />
                    </Field>
                    <Field label="Recommendation">
                      <select
                        value={form.recommendation}
                        onChange={(event) => updateForm(interview, 'recommendation', event.target.value)}
                      >
                        {recommendations.map((recommendation) => (
                          <option key={recommendation.value} value={recommendation.value}>
                            {recommendation.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Comment">
                      <textarea
                        rows={3}
                        value={form.comment}
                        onChange={(event) => updateForm(interview, 'comment', event.target.value)}
                      />
                    </Field>
                    <div className="button-row">
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => loadResult(interview)}
                        disabled={isBusy}
                      >
                        Load result
                      </button>
                      <button
                        className="button primary"
                        type="button"
                        onClick={() => saveResult(interview)}
                        disabled={isBusy}
                      >
                        Save result
                      </button>
                    </div>
                    {result && (
                      <div className="result-box">
                        <strong>Saved score: {result.score}/10</strong>
                        <span>Recommendation: {result.recommendation}</span>
                        <p>{result.comment || 'No comment'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No assigned interviews">
          New assignments will appear here after a project manager creates an interview.
        </EmptyState>
      )}
    </section>
  );
}
