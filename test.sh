#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
RUN_ID="$(date +%s)"

MANAGER_EMAIL="manager_${RUN_ID}@example.com"
CANDIDATE_EMAIL="candidate_${RUN_ID}@example.com"
PASSWORD="password123"

TMP_DIR="$(mktemp -d)"
LAST_BODY="$TMP_DIR/last_response.json"
trap 'rm -rf "$TMP_DIR"' EXIT

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

request() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local token="${4:-}"
  local headers=(-H "Content-Type: application/json")

  if [[ -n "$token" ]]; then
    headers+=(-H "Authorization: Bearer $token")
  fi

  if [[ -n "$body" ]]; then
    LAST_STATUS="$(
      curl -sS -o "$LAST_BODY" -w "%{http_code}" \
        -X "$method" "${BASE_URL}${path}" \
        "${headers[@]}" \
        --data "$body"
    )"
  else
    LAST_STATUS="$(
      curl -sS -o "$LAST_BODY" -w "%{http_code}" \
        -X "$method" "${BASE_URL}${path}" \
        "${headers[@]}"
    )"
  fi
}

expect_status() {
  local expected="$1"
  local label="$2"

  if [[ "$LAST_STATUS" != "$expected" ]]; then
    echo "FAIL: $label"
    echo "Expected status: $expected"
    echo "Actual status:   $LAST_STATUS"
    echo "Response body:"
    cat "$LAST_BODY"
    echo
    exit 1
  fi

  echo "OK: $label"
}

json_get() {
  local file="$1"
  local path="$2"

  node -e '
    const fs = require("fs");
    const file = process.argv[1];
    const path = process.argv[2].split(".");
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    const value = path.reduce((current, key) => current && current[key], json);

    if (value === undefined || value === null) {
      process.exit(2);
    }

    if (typeof value === "object") {
      console.log(JSON.stringify(value));
    } else {
      console.log(value);
    }
  ' "$file" "$path"
}

assert_json_value() {
  local path="$1"
  local expected="$2"
  local label="$3"
  local actual

  actual="$(json_get "$LAST_BODY" "$path")"

  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL: $label"
    echo "Expected ${path}: $expected"
    echo "Actual ${path}:   $actual"
    echo "Response body:"
    cat "$LAST_BODY"
    echo
    exit 1
  fi

  echo "OK: $label"
}

need_command curl
need_command node

echo "Testing API at: $BASE_URL"
echo

request GET "/health"
expect_status 200 "health check"

request POST "/auth/register" "{
  \"name\": \"Test Manager\",
  \"email\": \"${MANAGER_EMAIL}\",
  \"password\": \"${PASSWORD}\",
  \"role\": \"PROJECT_MANAGER\"
}"
expect_status 201 "register project manager"
MANAGER_TOKEN="$(json_get "$LAST_BODY" "token")"
assert_json_value "user.role" "project_manager" "manager role response"

request POST "/auth/register" "{
  \"name\": \"Test Candidate\",
  \"email\": \"${CANDIDATE_EMAIL}\",
  \"password\": \"${PASSWORD}\",
  \"role\": \"CANDIDATE\"
}"
expect_status 201 "register candidate"
CANDIDATE_TOKEN="$(json_get "$LAST_BODY" "token")"
assert_json_value "user.role" "candidate" "candidate role response"

request POST "/auth/login" "{
  \"email\": \"${MANAGER_EMAIL}\",
  \"password\": \"${PASSWORD}\"
}"
expect_status 200 "login project manager"
MANAGER_TOKEN="$(json_get "$LAST_BODY" "token")"

request GET "/auth/me" "" "$MANAGER_TOKEN"
expect_status 200 "get current user"
assert_json_value "user.email" "$MANAGER_EMAIL" "current user email"

request GET "/projects"
expect_status 401 "projects require authentication"

request POST "/projects" "{
  \"name\": \"Smoke Test Project ${RUN_ID}\",
  \"description\": \"Project created by test.sh\"
}" "$CANDIDATE_TOKEN"
expect_status 403 "candidate cannot create project"

request POST "/projects" "{
  \"name\": \"Smoke Test Project ${RUN_ID}\",
  \"description\": \"Project created by test.sh\"
}" "$MANAGER_TOKEN"
expect_status 201 "project manager creates project"
PROJECT_ID="$(json_get "$LAST_BODY" "project.project_id")"

request GET "/projects" "" "$CANDIDATE_TOKEN"
expect_status 200 "candidate can list projects"

request POST "/projects/${PROJECT_ID}/vacancies" "{
  \"title\": \"Backend Developer ${RUN_ID}\",
  \"description\": \"Node.js and PostgreSQL\",
  \"status\": \"OPEN\"
}" "$CANDIDATE_TOKEN"
expect_status 403 "candidate cannot create vacancy"

request POST "/projects/${PROJECT_ID}/vacancies" "{
  \"title\": \"Backend Developer ${RUN_ID}\",
  \"description\": \"Node.js and PostgreSQL\",
  \"status\": \"OPEN\"
}" "$MANAGER_TOKEN"
expect_status 201 "project manager creates vacancy"
VACANCY_ID="$(json_get "$LAST_BODY" "vacancy.vacancy_id")"

request GET "/projects/${PROJECT_ID}/vacancies" "" "$CANDIDATE_TOKEN"
expect_status 200 "candidate can list project vacancies"

request POST "/vacancies/${VACANCY_ID}/applications" "{}" "$MANAGER_TOKEN"
expect_status 403 "project manager cannot apply as candidate"

request POST "/vacancies/${VACANCY_ID}/applications" "{}" "$CANDIDATE_TOKEN"
expect_status 201 "candidate applies to vacancy"
APPLICATION_ID="$(json_get "$LAST_BODY" "application.application_id")"

request POST "/vacancies/${VACANCY_ID}/applications" "{}" "$CANDIDATE_TOKEN"
expect_status 409 "candidate cannot apply twice"

request GET "/applications/my" "" "$CANDIDATE_TOKEN"
expect_status 200 "candidate lists own applications"

if ! grep -q "\"application_id\":${APPLICATION_ID}" "$LAST_BODY"; then
  echo "FAIL: own applications response does not contain created application"
  cat "$LAST_BODY"
  echo
  exit 1
fi

echo "OK: own applications contain created application"
echo
echo "All smoke tests passed."
