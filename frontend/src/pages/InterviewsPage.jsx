import { useEffect, useState } from 'react';
import Alert from '../components/Alert.jsx';
import Field from '../components/Field.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { getApiError } from '../api/client';
import { interviewApi } from '../api/endpoints';

const recommendations = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'not_recommended', label: 'Not recommended' },
  { value: 'reserve', label: 'Reserve' },
  { value: 'additional_interview', label: 'Additional interview' },
];

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [forms, setForms] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  async function loadInterviews() {
    setLoading(true);
    setError('');

    try {
      const { data } = await interviewApi.assigned();
      setInterviews(data.interviews || []);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInterviews();
  }, []);

  function formFor(interviewId) {
    return forms[interviewId] || {
      date: '',
      score: '',
      comment: '',
      recommendation: 'recommended',
    };
  }

  function updateForm(interviewId, field, value) {
    setForms((current) => ({
      ...current,
      [interviewId]: {
        ...formFor(interviewId),
        [field]: value,
      },
    }));
  }

  async function runAction(action, success) {
    setError('');
    setMessage('');

    try {
      await action();
      setMessage(success);
      await loadInterviews();
    } catch (err) {
      setError(getApiError(err));
    }
  }

  function schedule(interview) {
    const form = formFor(interview.interview_id);

    return runAction(
      () => interviewApi.schedule(interview.interview_id, new Date(form.date).toISOString()),
      'Interview scheduled.',
    );
  }

  function complete(interview) {
    return runAction(
      () => interviewApi.complete(interview.interview_id),
      'Interview marked as completed.',
    );
  }

  function submitResult(interview) {
    const form = formFor(interview.interview_id);

    return runAction(
      () => interviewApi.createResult(interview.interview_id, {
        score: Number(form.score),
        comment: form.comment,
        recommendation: form.recommendation,
      }),
      'Interview result submitted.',
    );
  }

  return (
    <section className="stack">
      <div className="page-title">
        <div>
          <h1>Assigned interviews</h1>
          <p className="muted">Schedule, complete and evaluate assigned candidates.</p>
        </div>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{message}</Alert>

      {loading ? (
        <div className="panel">Loading interviews...</div>
      ) : interviews.length ? (
        <div className="stack">
          {interviews.map((interview) => {
            const form = formFor(interview.interview_id);

            return (
              <article className="card wide-card" key={interview.interview_id}>
                <div className="card-header">
                  <div>
                    <h2>Interview #{interview.interview_id}</h2>
                    <p className="muted">
                      Application #{interview.application_id}
                      {interview.application?.vacancy?.title ? ` · ${interview.application.vacancy.title}` : ''}
                    </p>
                  </div>
                  <StatusBadge>{interview.status}</StatusBadge>
                </div>

                <div className="split-grid">
                  <div className="subpanel">
                    <h3>Schedule</h3>
                    <Field label="Date and time">
                      <input
                        type="datetime-local"
                        value={form.date}
                        onChange={(event) => updateForm(interview.interview_id, 'date', event.target.value)}
                      />
                    </Field>
                    <button className="button secondary" type="button" onClick={() => schedule(interview)}>
                      Schedule interview
                    </button>
                    <button className="button primary" type="button" onClick={() => complete(interview)}>
                      Mark completed
                    </button>
                  </div>

                  <div className="subpanel">
                    <h3>Evaluation</h3>
                    <Field label="Score">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={form.score}
                        onChange={(event) => updateForm(interview.interview_id, 'score', event.target.value)}
                      />
                    </Field>
                    <Field label="Recommendation">
                      <select
                        value={form.recommendation}
                        onChange={(event) => updateForm(interview.interview_id, 'recommendation', event.target.value)}
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
                        onChange={(event) => updateForm(interview.interview_id, 'comment', event.target.value)}
                      />
                    </Field>
                    <button className="button primary" type="button" onClick={() => submitResult(interview)}>
                      Submit result
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="panel">No assigned interviews.</div>
      )}
    </section>
  );
}
