import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Field from '../components/Field.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { LoadingState, PageHeader } from '../components/StateBlock.jsx';
import { getApiError } from '../api/client';
import { applicationApi, interviewApi, vacancyApi } from '../api/endpoints';
import { findVacancyById } from '../api/loaders';
import { useAuth } from '../hooks/useAuth.jsx';
import { compactText, formatDateTime } from '../utils/data';
import { isCandidate, isManager } from '../utils/roles';
import { logger } from '../utils/logger';

export default function VacancyPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const [vacancy, setVacancy] = useState(state?.vacancy || null);
  const [project, setProject] = useState(state?.project || state?.vacancy?.project || null);
  const [loading, setLoading] = useState(!state?.vacancy);
  const [detailsError, setDetailsError] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [assignForm, setAssignForm] = useState({ applicationId: '', interviewerId: '' });
  const [decisionForm, setDecisionForm] = useState({ applicationId: '', status: 'accepted', comment: '' });
  const [resultApplicationId, setResultApplicationId] = useState('');
  const [cancelInterviewId, setCancelInterviewId] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadDetails() {
      if (state?.vacancy) {
        setVacancy(state.vacancy);
        setProject(state.project || state.vacancy.project || null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setDetailsError('');

      try {
        const data = await findVacancyById(id);

        if (!active) {
          return;
        }

        setVacancy(data.vacancy);
        setProject(data.project);

        if (!data.vacancy) {
          setDetailsError('Vacancy details were not found through existing project vacancy API.');
        }
      } catch (err) {
        const text = getApiError(err);
        logger.error('vacancy_details_load_failed', { vacancy_id: id, message: text });

        if (active) {
          setDetailsError(text);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDetails();

    return () => {
      active = false;
    };
  }, [id, state]);

  function updateAssign(event) {
    setAssignForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateDecision(event) {
    setDecisionForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function runAction(actionName, successMessage, action) {
    setError('');
    setMessage('');
    setBusyAction(actionName);

    try {
      await action();
      setMessage(successMessage);
      logger.action(`${actionName}_success`, { vacancy_id: id });
    } catch (err) {
      const text = getApiError(err);
      logger.error(`${actionName}_failed`, { vacancy_id: id, message: text });
      setError(text);
    } finally {
      setBusyAction('');
    }
  }

  function apply() {
    return runAction('vacancy_apply', 'Application submitted.', () => vacancyApi.apply(id));
  }

  function assignInterview(event) {
    event.preventDefault();

    return runAction('interview_assign', 'Interviewer assigned.', async () => {
      await applicationApi.assignInterview(assignForm.applicationId, assignForm.interviewerId);
      setAssignForm({ applicationId: '', interviewerId: '' });
    });
  }

  function loadResult(event) {
    event.preventDefault();
    setResult(null);

    return runAction('application_result_load', 'Interview result loaded.', async () => {
      const { data } = await applicationApi.result(resultApplicationId);
      setResult(data.result);
    });
  }

  function makeDecision(event) {
    event.preventDefault();

    return runAction('application_decision', 'Final decision saved.', async () => {
      await applicationApi.decide(decisionForm.applicationId, {
        status: decisionForm.status,
        comment: decisionForm.comment,
      });
      setDecisionForm({ applicationId: '', status: 'accepted', comment: '' });
    });
  }

  function cancelInterview(event) {
    event.preventDefault();

    return runAction('interview_cancel', 'Interview canceled.', async () => {
      await interviewApi.cancel(cancelInterviewId);
      setCancelInterviewId('');
    });
  }

  const canApply = !vacancy?.status || vacancy.status === 'open';

  return (
    <section className="stack">
      <PageHeader
        title={vacancy?.title || `Vacancy ${id}`}
        description={project?.name || `Vacancy ID: ${id}`}
        actions={vacancy?.status && <StatusBadge>{vacancy.status}</StatusBadge>}
      />

      <Alert type="error">{detailsError}</Alert>
      <Alert type="error">{error}</Alert>
      <Alert type="success">{message}</Alert>

      {loading ? (
        <LoadingState>Loading vacancy details...</LoadingState>
      ) : (
        <div className="panel">
          <h2>Vacancy details</h2>
          <p className="muted">{compactText(vacancy?.description, 'No description available')}</p>
          <div className="meta-list">
            <span>Vacancy ID: {id}</span>
            {project?.project_id && <span>Project ID: {project.project_id}</span>}
            {vacancy?.created_at && <span>Created: {formatDateTime(vacancy.created_at)}</span>}
          </div>
        </div>
      )}

      {isCandidate(user) && (
        <div className="panel action-panel">
          <h2>Candidate actions</h2>
          <button
            className="button primary"
            type="button"
            onClick={apply}
            disabled={!canApply || busyAction === 'vacancy_apply'}
          >
            {busyAction === 'vacancy_apply' ? 'Applying...' : 'Apply to vacancy'}
          </button>
          {!canApply && <p className="muted">Only open vacancies accept applications.</p>}
          <Link className="button secondary" to="/applications">Open my applications</Link>
        </div>
      )}

      {isManager(user) && (
        <>
          <div className="panel">
            <h2>Applications</h2>
            <p className="muted">
              The current backend exposes candidate-owned applications, interview assignment by application ID,
              result lookup by application ID, and final decisions. It does not expose a vacancy applications
              list endpoint, so this page avoids calling a non-existing API route.
            </p>
          </div>

          <form className="panel form-grid" onSubmit={assignInterview}>
            <h2>Assign interviewer</h2>
            <Field label="Application ID">
              <input name="applicationId" value={assignForm.applicationId} onChange={updateAssign} required />
            </Field>
            <Field label="Interviewer user ID">
              <input name="interviewerId" value={assignForm.interviewerId} onChange={updateAssign} required />
            </Field>
            <button className="button primary" type="submit" disabled={busyAction === 'interview_assign'}>
              {busyAction === 'interview_assign' ? 'Assigning...' : 'Assign interviewer'}
            </button>
          </form>

          <form className="panel form-grid" onSubmit={cancelInterview}>
            <h2>Cancel interview</h2>
            <Field label="Interview ID">
              <input value={cancelInterviewId} onChange={(event) => setCancelInterviewId(event.target.value)} required />
            </Field>
            <button className="button secondary" type="submit" disabled={busyAction === 'interview_cancel'}>
              {busyAction === 'interview_cancel' ? 'Canceling...' : 'Cancel interview'}
            </button>
          </form>

          <form className="panel form-grid" onSubmit={loadResult}>
            <h2>View interview result</h2>
            <Field label="Application ID">
              <input value={resultApplicationId} onChange={(event) => setResultApplicationId(event.target.value)} required />
            </Field>
            <button className="button secondary" type="submit" disabled={busyAction === 'application_result_load'}>
              {busyAction === 'application_result_load' ? 'Loading...' : 'Load result'}
            </button>
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
            <button className="button primary" type="submit" disabled={busyAction === 'application_decision'}>
              {busyAction === 'application_decision' ? 'Saving...' : 'Save decision'}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
