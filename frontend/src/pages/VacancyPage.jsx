import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Field from '../components/Field.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { getApiError } from '../api/client';
import { applicationApi, vacancyApi } from '../api/endpoints';
import { useAuth } from '../hooks/useAuth.jsx';
import { isCandidate, isManager } from '../utils/roles';

export default function VacancyPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const vacancy = state?.vacancy;
  const [applications, setApplications] = useState([]);
  const [applicationsError, setApplicationsError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [assignForm, setAssignForm] = useState({ applicationId: '', interviewerId: '' });
  const [decisionForm, setDecisionForm] = useState({ applicationId: '', status: 'accepted', comment: '' });
  const [resultApplicationId, setResultApplicationId] = useState('');
  const [result, setResult] = useState(null);

  async function loadApplications() {
    if (!isManager(user)) {
      return;
    }

    setApplicationsError('');

    try {
      const { data } = await vacancyApi.applications(id);
      setApplications(data.applications || []);
    } catch (err) {
      setApplications([]);
      setApplicationsError('Applications list endpoint is not available yet. Use application IDs from candidate applications or API tests.');
    }
  }

  useEffect(() => {
    loadApplications();
  }, [id, user?.role]);

  function updateAssign(event) {
    setAssignForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateDecision(event) {
    setDecisionForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function apply() {
    setError('');
    setMessage('');

    try {
      await vacancyApi.apply(id);
      setMessage('Application submitted.');
    } catch (err) {
      setError(getApiError(err));
    }
  }

  async function assignInterview(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await applicationApi.assignInterview(assignForm.applicationId, assignForm.interviewerId);
      setMessage('Interviewer assigned.');
      setAssignForm({ applicationId: '', interviewerId: '' });
    } catch (err) {
      setError(getApiError(err));
    }
  }

  async function loadResult(event) {
    event.preventDefault();
    setError('');
    setResult(null);

    try {
      const { data } = await applicationApi.result(resultApplicationId);
      setResult(data.result);
    } catch (err) {
      setError(getApiError(err));
    }
  }

  async function makeDecision(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await applicationApi.decide(decisionForm.applicationId, {
        status: decisionForm.status,
        comment: decisionForm.comment,
      });
      setMessage('Final decision saved.');
      setDecisionForm({ applicationId: '', status: 'accepted', comment: '' });
    } catch (err) {
      setError(getApiError(err));
    }
  }

  return (
    <section className="stack">
      <div className="page-title">
        <div>
          <h1>{vacancy?.title || `Vacancy ${id}`}</h1>
          <p className="muted">{vacancy?.description || 'Vacancy details endpoint is not implemented yet.'}</p>
        </div>
        {vacancy?.status && <StatusBadge>{vacancy.status}</StatusBadge>}
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{message}</Alert>

      {isCandidate(user) && (
        <div className="panel">
          <h2>Candidate actions</h2>
          <button className="button primary" type="button" onClick={apply}>Apply to vacancy</button>
          <p className="muted">You can track the application on the My applications page.</p>
          <Link className="button secondary" to="/applications">Open my applications</Link>
        </div>
      )}

      {isManager(user) && (
        <>
          <div className="panel">
            <h2>Applications for this vacancy</h2>
            <Alert>{applicationsError}</Alert>
            {applications.length ? (
              <div className="table-list">
                {applications.map((application) => (
                  <div className="table-row" key={application.application_id}>
                    <span>Application #{application.application_id}</span>
                    <StatusBadge>{application.status}</StatusBadge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No application list returned by API.</p>
            )}
          </div>

          <form className="panel form-grid" onSubmit={assignInterview}>
            <h2>Assign interviewer</h2>
            <Field label="Application ID">
              <input name="applicationId" value={assignForm.applicationId} onChange={updateAssign} required />
            </Field>
            <Field label="Interviewer user ID">
              <input name="interviewerId" value={assignForm.interviewerId} onChange={updateAssign} required />
            </Field>
            <button className="button primary" type="submit">Assign interviewer</button>
          </form>

          <form className="panel form-grid" onSubmit={loadResult}>
            <h2>View interview result</h2>
            <Field label="Application ID">
              <input value={resultApplicationId} onChange={(event) => setResultApplicationId(event.target.value)} required />
            </Field>
            <button className="button secondary" type="submit">Load result</button>
            {result && (
              <div className="result-box">
                <strong>Score: {result.score}/10</strong>
                <span>Recommendation: {result.recommendation}</span>
                <p>{result.comment || 'No comment'}</p>
              </div>
            )}
          </form>

          <form className="panel form-grid" onSubmit={makeDecision}>
            <h2>Final decision</h2>
            <Field label="Application ID">
              <input name="applicationId" value={decisionForm.applicationId} onChange={updateDecision} required />
            </Field>
            <Field label="Decision">
              <select name="status" value={decisionForm.status} onChange={updateDecision}>
                <option value="accepted">Accept</option>
                <option value="rejected">Reject</option>
              </select>
            </Field>
            <Field label="Comment">
              <textarea name="comment" value={decisionForm.comment} onChange={updateDecision} rows={3} />
            </Field>
            <button className="button primary" type="submit">Save decision</button>
          </form>
        </>
      )}
    </section>
  );
}
