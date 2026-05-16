import { projectApi } from './endpoints';
import { asArray } from '../utils/data';
import { logger } from '../utils/logger';

export async function loadProjectList() {
  const { data } = await projectApi.list();
  return asArray(data.projects);
}

export async function loadProjectWithVacancies(projectId) {
  const [projects, vacanciesResponse] = await Promise.all([
    loadProjectList(),
    projectApi.vacancies(projectId),
  ]);

  return {
    project: projects.find((item) => String(item.project_id) === String(projectId)) || null,
    vacancies: asArray(vacanciesResponse.data.vacancies),
  };
}

export async function findVacancyById(vacancyId) {
  const projects = await loadProjectList();

  for (const project of projects) {
    try {
      const { data } = await projectApi.vacancies(project.project_id);
      const vacancy = asArray(data.vacancies).find(
        (item) => String(item.vacancy_id) === String(vacancyId),
      );

      if (vacancy) {
        return {
          vacancy,
          project: vacancy.project || project,
        };
      }
    } catch (error) {
      logger.warn('project_vacancies_scan_failed', {
        project_id: project.project_id,
        error,
      });
    }
  }

  return {
    vacancy: null,
    project: null,
  };
}
