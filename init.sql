CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT,
    password TEXT,
    role TEXT
);

CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    name TEXT,
    description TEXT,
    owner_id INT REFERENCES users(user_id)
);

CREATE TABLE vacancies (
    vacancy_id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(project_id),
    title TEXT,
    description TEXT
);

CREATE TABLE applications (
    application_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    vacancy_id INT REFERENCES vacancies(vacancy_id),
    status TEXT
);

CREATE TABLE interviews (
    interview_id SERIAL PRIMARY KEY,
    application_id INT REFERENCES applications(application_id),
    interviewer_id INT REFERENCES users(user_id),
    date TIMESTAMP
);

CREATE TABLE interview_results (
    result_id SERIAL PRIMARY KEY,
    interview_id INT REFERENCES interviews(interview_id),
    score INT,
    comment TEXT
);

CREATE TABLE project_members (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES projects(project_id),
    user_id INT REFERENCES users(user_id),
    role_in_project TEXT
);