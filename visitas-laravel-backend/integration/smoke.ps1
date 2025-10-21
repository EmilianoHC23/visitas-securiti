<#
PowerShell smoke script for the visitas-securiti backend.
Usage:
  Open PowerShell in the repo folder and run:
    ./integration/smoke.ps1 -BaseUrl 'http://127.0.0.1:8000' -AdminEmail 'admin@example.com' -AdminPassword 'password'

The script runs the main smoke calls and prints responses. It expects the backend to be migrated and running.
#>
param(
    [string]$BaseUrl = 'http://127.0.0.1:8000',
    [string]$AdminEmail = 'admin@example.com',
    [string]$AdminPassword = 'password'
)

function PrettyPrint($resp) {
    try {
        $json = $resp | ConvertFrom-Json -ErrorAction Stop
        $json | ConvertTo-Json -Depth 5
    } catch {
        $resp
    }
}

Write-Host "BaseUrl: $BaseUrl" -ForegroundColor Cyan

# 1) Login
Write-Host "\n[1] Login..." -ForegroundColor Yellow
$loginResp = curl -s -X POST "$BaseUrl/api/auth/login" -H 'Content-Type: application/json' -d (@{"email"=$AdminEmail;"password"=$AdminPassword} | ConvertTo-Json)
Write-Host "Response:"; PrettyPrint $loginResp

# Extract token (try token or access_token)
$token = $null
try { $j = $loginResp | ConvertFrom-Json } catch { $j = $null }
if ($j) {
    if ($j.token) { $token = $j.token }
    elseif ($j.access_token) { $token = $j.access_token }
    elseif ($j.data -and $j.data.token) { $token = $j.data.token }
}
if (-not $token) { Write-Host "No token found in login response. Aborting." -ForegroundColor Red; exit 1 }
Write-Host "Token found (truncated):" $token.Substring(0,16)"..."

# 2) Me
Write-Host "\n[2] ME..." -ForegroundColor Yellow
$meResp = curl -s -X GET "$BaseUrl/api/auth/me" -H "Authorization: Bearer $token"
Write-Host "Response:"; PrettyPrint $meResp

# 3) Create visit (protected)
Write-Host "\n[3] Create visit (protected)..." -ForegroundColor Yellow
$visitPayload = @{
    host_id = 1
    visitor_name = 'Smoke Visitor'
    visitor_email = 'smoke.visitor@example.com'
    company_id = 1
    visit_date = (Get-Date).ToString('yyyy-MM-dd')
    visit_time = (Get-Date).ToString('HH:mm')
} | ConvertTo-Json
$createVisitResp = curl -s -X POST "$BaseUrl/api/visits" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d $visitPayload
Write-Host "Response:"; PrettyPrint $createVisitResp
try { $cv = $createVisitResp | ConvertFrom-Json } catch { $cv = $null }
$visitId = $cv.id
if (-not $visitId) { Write-Host "Visit creation failed (no id)." -ForegroundColor Red } else { Write-Host "Created visit id: $visitId" }

# 4) Checkin
if ($visitId) {
    Write-Host "\n[4] Checkin..." -ForegroundColor Yellow
    $chk = curl -s -X POST "$BaseUrl/api/visits/checkin/$visitId" -H "Authorization: Bearer $token"
    Write-Host "Response:"; PrettyPrint $chk

    Write-Host "\n[5] Checkout..." -ForegroundColor Yellow
    $chkout = curl -s -X POST "$BaseUrl/api/visits/checkout/$visitId" -H "Authorization: Bearer $token"
    Write-Host "Response:"; PrettyPrint $chkout
}

# 6) Scan QR (authenticated)
Write-Host "\n[6] Scan QR..." -ForegroundColor Yellow
$scanResp = curl -s -X POST "$BaseUrl/api/visits/scan-qr" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d (@{"code" = 'COMPANY-QR-123'} | ConvertTo-Json)
Write-Host "Response:"; PrettyPrint $scanResp

# 7) Public visit (no auth)
Write-Host "\n[7] Public visit (no auth)..." -ForegroundColor Yellow
$publicPayload = @{
    host_id = 1
    visitor_name = 'Public Smoke'
    visitor_email = 'public.smoke@example.com'
    company_id = 1
    visit_date = (Get-Date).ToString('yyyy-MM-dd')
    visit_time = (Get-Date).ToString('HH:mm')
} | ConvertTo-Json
$publicResp = curl -s -X POST "$BaseUrl/api/public/visit" -H 'Content-Type: application/json' -d $publicPayload
Write-Host "Response:"; PrettyPrint $publicResp

# 8) Invitations flow (create, verify, complete)
Write-Host "\n[8] Invitations flow..." -ForegroundColor Yellow
$invPayload = @{
    email = "invitee.smoke@example.com"
    first_name = "Invite"
    last_name = "Smoke"
    role = "host"
    company_id = 1
} | ConvertTo-Json
$invCreate = curl -s -X POST "$BaseUrl/api/invitations" -H "Authorization: Bearer $token" -H 'Content-Type: application/json' -d $invPayload
Write-Host "Create response:"; PrettyPrint $invCreate
try { $invj = $invCreate | ConvertFrom-Json } catch { $invj = $null }
$invToken = $null
if ($invj.invitation_token) { $invToken = $invj.invitation_token }
elseif ($invj.invitation && $invj.invitation.invitation_token) { $invToken = $invj.invitation.invitation_token }
if ($invToken) {
    Write-Host "Verify token..."
    $verify = curl -s -X GET "$BaseUrl/api/invitations/verify/$invToken"
    Write-Host "Verify response:"; PrettyPrint $verify

    Write-Host "Complete (public) token..."
    $complete = curl -s -X POST "$BaseUrl/api/invitations/complete" -H 'Content-Type: application/json' -d (@{"token"=$invToken} | ConvertTo-Json)
    Write-Host "Complete response:"; PrettyPrint $complete
} else {
    Write-Host "No invitation token returned; skipping verify/complete." -ForegroundColor Yellow
}

Write-Host "\nSmoke run finished." -ForegroundColor Green
