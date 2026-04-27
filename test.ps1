param(
    [string]$BaseUrl = "http://192.168.88.32/api"
)

$ErrorActionPreference = "Stop"

$BaseUrl = $BaseUrl.TrimEnd("/")
$RunId = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()

$ManagerEmail = "manager_$RunId@example.com"
$CandidateEmail = "candidate_$RunId@example.com"
$Password = "password123"
$LastResponse = $null
$LastStatus = $null

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [string]$Token = ""
    )

    $headers = @{
        "Content-Type" = "application/json"
    }

    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    $params = @{
        Uri        = "$BaseUrl$Path"
        Method     = $Method
        Headers    = $headers
        ErrorAction = "Stop"
    }

    if ($null -ne $Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }

    try {
        $response = Invoke-WebRequest @params
        $script:LastStatus = [int]$response.StatusCode
        $script:LastResponse = if ($response.Content) {
            $response.Content | ConvertFrom-Json
        } else {
            $null
        }
    } catch {
        $script:LastStatus = [int]$_.Exception.Response.StatusCode

        $stream = $_.Exception.Response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $content = $reader.ReadToEnd()

        $script:LastResponse = if ($content) {
            try {
                $content | ConvertFrom-Json
            } catch {
                $content
            }
        } else {
            $null
        }
    }
}

function Assert-Status {
    param(
        [int]$Expected,
        [string]$Label
    )

    if ($LastStatus -ne $Expected) {
        Write-Host "FAIL: $Label" -ForegroundColor Red
        Write-Host "Expected status: $Expected"
        Write-Host "Actual status:   $LastStatus"
        Write-Host "Response:"
        $LastResponse | ConvertTo-Json -Depth 10
        exit 1
    }

    Write-Host "OK: $Label" -ForegroundColor Green
}

function Assert-Value {
    param(
        [object]$Actual,
        [object]$Expected,
        [string]$Label
    )

    if ($Actual -ne $Expected) {
        Write-Host "FAIL: $Label" -ForegroundColor Red
        Write-Host "Expected: $Expected"
        Write-Host "Actual:   $Actual"
        Write-Host "Response:"
        $LastResponse | ConvertTo-Json -Depth 10
        exit 1
    }

    Write-Host "OK: $Label" -ForegroundColor Green
}

Write-Host "Testing API at: $BaseUrl"
Write-Host ""

Invoke-Api -Method "GET" -Path "/health"
Assert-Status -Expected 200 -Label "health check"

Invoke-Api -Method "POST" -Path "/auth/register" -Body @{
    name     = "Test Manager"
    email    = $ManagerEmail
    password = $Password
    role     = "PROJECT_MANAGER"
}
Assert-Status -Expected 201 -Label "register project manager"
$ManagerToken = $LastResponse.token
Assert-Value -Actual $LastResponse.user.role -Expected "project_manager" -Label "manager role response"

Invoke-Api -Method "POST" -Path "/auth/register" -Body @{
    name     = "Test Candidate"
    email    = $CandidateEmail
    password = $Password
    role     = "CANDIDATE"
}
Assert-Status -Expected 201 -Label "register candidate"
$CandidateToken = $LastResponse.token
Assert-Value -Actual $LastResponse.user.role -Expected "candidate" -Label "candidate role response"

Invoke-Api -Method "POST" -Path "/auth/login" -Body @{
    email    = $ManagerEmail
    password = $Password
}
Assert-Status -Expected 200 -Label "login project manager"
$ManagerToken = $LastResponse.token

Invoke-Api -Method "GET" -Path "/auth/me" -Token $ManagerToken
Assert-Status -Expected 200 -Label "get current user"
Assert-Value -Actual $LastResponse.user.email -Expected $ManagerEmail -Label "current user email"

Invoke-Api -Method "GET" -Path "/projects"
Assert-Status -Expected 401 -Label "projects require authentication"

Invoke-Api -Method "POST" -Path "/projects" -Token $CandidateToken -Body @{
    name        = "Smoke Test Project $RunId"
    description = "Project created by test.ps1"
}
Assert-Status -Expected 403 -Label "candidate cannot create project"

Invoke-Api -Method "POST" -Path "/projects" -Token $ManagerToken -Body @{
    name        = "Smoke Test Project $RunId"
    description = "Project created by test.ps1"
}
Assert-Status -Expected 201 -Label "project manager creates project"
$ProjectId = $LastResponse.project.project_id

Invoke-Api -Method "GET" -Path "/projects" -Token $CandidateToken
Assert-Status -Expected 200 -Label "candidate can list projects"

Invoke-Api -Method "POST" -Path "/projects/$ProjectId/vacancies" -Token $CandidateToken -Body @{
    title       = "Backend Developer $RunId"
    description = "Node.js and PostgreSQL"
    status      = "OPEN"
}
Assert-Status -Expected 403 -Label "candidate cannot create vacancy"

Invoke-Api -Method "POST" -Path "/projects/$ProjectId/vacancies" -Token $ManagerToken -Body @{
    title       = "Backend Developer $RunId"
    description = "Node.js and PostgreSQL"
    status      = "OPEN"
}
Assert-Status -Expected 201 -Label "project manager creates vacancy"
$VacancyId = $LastResponse.vacancy.vacancy_id

Invoke-Api -Method "GET" -Path "/projects/$ProjectId/vacancies" -Token $CandidateToken
Assert-Status -Expected 200 -Label "candidate can list project vacancies"

Invoke-Api -Method "POST" -Path "/vacancies/$VacancyId/applications" -Token $ManagerToken -Body @{}
Assert-Status -Expected 403 -Label "project manager cannot apply as candidate"

Invoke-Api -Method "POST" -Path "/vacancies/$VacancyId/applications" -Token $CandidateToken -Body @{}
Assert-Status -Expected 201 -Label "candidate applies to vacancy"
$ApplicationId = $LastResponse.application.application_id

Invoke-Api -Method "POST" -Path "/vacancies/$VacancyId/applications" -Token $CandidateToken -Body @{}
Assert-Status -Expected 409 -Label "candidate cannot apply twice"

Invoke-Api -Method "GET" -Path "/applications/my" -Token $CandidateToken
Assert-Status -Expected 200 -Label "candidate lists own applications"

$OwnApplication = $LastResponse.applications | Where-Object {
    $_.application_id -eq $ApplicationId
}

if (-not $OwnApplication) {
    Write-Host "FAIL: own applications response does not contain created application" -ForegroundColor Red
    $LastResponse | ConvertTo-Json -Depth 10
    exit 1
}

Write-Host "OK: own applications contain created application" -ForegroundColor Green
Write-Host ""
Write-Host "All smoke tests passed." -ForegroundColor Green
