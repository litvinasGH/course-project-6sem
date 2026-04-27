#!/bin/bash

BASE_URL="http://192.168.88.32/api"

echo "=== REGISTER USER (PM) ==="
curl -s -X POST "$BASE_URL/auth/register" \
-H "Content-Type: application/json" \
-d '{
  "email": "pm@test.com",
  "password": "123456",
  "name": "PM User",
  "role": "PROJECT_MANAGER"
}' | tee pm.json

PM_TOKEN=$(jq -r '.token' pm.json)

echo "PM TOKEN: $PM_TOKEN"


echo "=== CREATE PROJECT ==="
curl -s -X POST "$BASE_URL/projects" \
-H "Authorization: Bearer $PM_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "name": "Test Project",
  "description": "Test project description"
}' | tee project.json

PROJECT_ID=$(jq -r '.project_id' project.json)

echo "PROJECT_ID: $PROJECT_ID"


echo "=== CREATE VACANCY ==="
curl -s -X POST "$BASE_URL/projects/$PROJECT_ID/vacancies" \
-H "Authorization: Bearer $PM_TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "title": "Backend Developer",
  "description": "Node.js dev"
}' | tee vacancy.json

VACANCY_ID=$(jq -r '.vacancy_id' vacancy.json)

echo "VACANCY_ID: $VACANCY_ID"


echo "=== REGISTER CANDIDATE ==="
curl -s -X POST "$BASE_URL/auth/register" \
-H "Content-Type: application/json" \
-d '{
  "email": "candidate@test.com",
  "password": "123456",
  "name": "Candidate",
  "role": "CANDIDATE"
}' | tee candidate.json

CANDIDATE_TOKEN=$(jq -r '.token' candidate.json)

echo "CANDIDATE TOKEN: $CANDIDATE_TOKEN"


echo "=== APPLY TO VACANCY ==="
curl -s -X POST "$BASE_URL/vacancies/$VACANCY_ID/applications" \
-H "Authorization: Bearer $CANDIDATE_TOKEN" \
-H "Content-Type: application/json" \
-d '{}' | tee application.json

echo "=== GET MY APPLICATIONS ==="
curl -s -X GET "$BASE_URL/applications/my" \
-H "Authorization: Bearer $CANDIDATE_TOKEN"

echo ""
echo "=== DONE ==="