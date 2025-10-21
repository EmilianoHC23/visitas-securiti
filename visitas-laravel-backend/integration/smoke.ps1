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
        if ($null -eq $resp) { return $null }
        # If it's a string try to parse JSON, otherwise convert object to JSON
        if ($resp -is [string]) {
            $json = $resp | ConvertFrom-Json -ErrorAction Stop
            $json | ConvertTo-Json -Depth 5
        } else {
            $resp | ConvertTo-Json -Depth 5
        }
    } catch {
        # Fallback to raw output
        $resp
    }
}

Write-Host "BaseUrl: $BaseUrl" -ForegroundColor Cyan

function Get-ResponseContent($response) {
    if ($null -eq $response) { return $null }
    # Try common properties in different PowerShell/.NET versions
    try {
        if ($response -is [System.Net.WebResponse]) {
            $stream = $response.GetResponseStream()
            if ($stream) {
                $sr = New-Object System.IO.StreamReader($stream)
                $body = $sr.ReadToEnd()
                $sr.Close()
                return $body
            }
        }
    } catch {}
    try {
        # Some responses expose a 'Content' or 'Body' property
        if ($response.PSObject.Properties.Match('Content').Count -gt 0) { return $response.Content }
        if ($response.PSObject.Properties.Match('Body').Count -gt 0) { return $response.Body }
    } catch {}
    # Last resort: return the object flattened
    try { return $response | Out-String } catch { return $null }
}

# 1) Login
Write-Host "\n[1] Login..." -ForegroundColor Yellow
$loginBody = @{ email = $AdminEmail; password = $AdminPassword } | ConvertTo-Json
try {
    $loginResp = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType 'application/json' -ErrorAction Stop
    Write-Host "Response:"; PrettyPrint $loginResp
} catch {
    Write-Host "Login request failed:" $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) {
        try { $raw = Get-ResponseContent($_.Exception.Response); if ($raw) { Write-Host $raw } } catch {}
    }
    exit 1
}

# Extract token (try token or access_token)
$token = $null
# loginResp may already be a parsed object from Invoke-RestMethod, or a JSON string
if ($loginResp) {
    if ($loginResp -is [string]) { try { $j = $loginResp | ConvertFrom-Json } catch { $j = $null } }
    else { $j = $loginResp }
    if ($j) {
        if ($j.token) { $token = $j.token }
        elseif ($j.access_token) { $token = $j.access_token }
        elseif ($j.data -and $j.data.token) { $token = $j.data.token }
    }
}
if (-not $token) { Write-Host "No token found in login response. Aborting." -ForegroundColor Red; exit 1 }
Write-Host "Token found (truncated):" $token.Substring(0,16)"..."

# 2) Me
Write-Host "\n[2] ME..." -ForegroundColor Yellow
try {
    $meResp = Invoke-RestMethod -Uri "$BaseUrl/api/auth/me" -Method Get -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
    Write-Host "Response:"; PrettyPrint $meResp
} catch {
    Write-Host "ME request failed:" $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) { try { $raw = Get-ResponseContent($_.Exception.Response); if ($raw) { Write-Host $raw } } catch {} }
}

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
$createVisitResp = $null
try {
    $createVisitResp = Invoke-RestMethod -Uri "$BaseUrl/api/visits" -Method Post -Headers @{ Authorization = "Bearer $token" } -Body $visitPayload -ContentType 'application/json' -ErrorAction Stop
    Write-Host "Response:"; PrettyPrint $createVisitResp
} catch {
    Write-Host "Create visit failed:" $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) { try { $raw = Get-ResponseContent($_.Exception.Response); if ($raw) { Write-Host $raw } } catch {} }
}
try { if ($createVisitResp -is [string]) { $cv = $createVisitResp | ConvertFrom-Json } else { $cv = $createVisitResp } } catch { $cv = $null }
$visitId = $cv.id
if (-not $visitId) { Write-Host "Visit creation failed (no id)." -ForegroundColor Red } else { Write-Host "Created visit id: $visitId" }

# 4) Checkin
if ($visitId) {
    Write-Host "\n[4] Checkin..." -ForegroundColor Yellow
    try {
        $chk = Invoke-RestMethod -Uri "$BaseUrl/api/visits/checkin/$visitId" -Method Post -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
        Write-Host "Response:"; PrettyPrint $chk
    } catch {
        Write-Host "Checkin failed:" $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) { try { $raw = Get-ResponseContent($_.Exception.Response); if ($raw) { Write-Host $raw } } catch {} }
    }

    Write-Host "\n[5] Checkout..." -ForegroundColor Yellow
    try {
        $chkout = Invoke-RestMethod -Uri "$BaseUrl/api/visits/checkout/$visitId" -Method Post -Headers @{ Authorization = "Bearer $token" } -ErrorAction Stop
        Write-Host "Response:"; PrettyPrint $chkout
    } catch {
        Write-Host "Checkout failed:" $_.Exception.Message -ForegroundColor Red
        if ($_.Exception.Response) { try { $raw = $_.Exception.Response | Select-Object -ExpandProperty Content; Write-Host $raw } catch {} }
    }
}

# 6) Scan QR (authenticated)
Write-Host "\n[6] Scan QR..." -ForegroundColor Yellow
try {
    $scanBody = @{ code = 'COMPANY-QR-123' } | ConvertTo-Json
    $scanResp = Invoke-RestMethod -Uri "$BaseUrl/api/visits/scan-qr" -Method Post -Headers @{ Authorization = "Bearer $token" } -Body $scanBody -ContentType 'application/json' -ErrorAction Stop
    Write-Host "Response:"; PrettyPrint $scanResp
} catch {
    Write-Host "Scan QR failed:" $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) { try { $raw = Get-ResponseContent($_.Exception.Response); if ($raw) { Write-Host $raw } } catch {} }
}

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
try {
    $publicResp = Invoke-RestMethod -Uri "$BaseUrl/api/public/visit" -Method Post -Body $publicPayload -ContentType 'application/json' -ErrorAction Stop
    Write-Host "Response:"; PrettyPrint $publicResp
} catch {
    Write-Host "Public visit failed:" $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) { try { $raw = Get-ResponseContent($_.Exception.Response); if ($raw) { Write-Host $raw } } catch {} }
}

# 8) Invitations flow (create, verify, complete)
Write-Host "\n[8] Invitations flow..." -ForegroundColor Yellow
$invPayload = @{
    email = "invitee.smoke@example.com"
    first_name = "Invite"
    last_name = "Smoke"
    role = "host"
    company_id = 1
} | ConvertTo-Json
$invCreate = $null
try {
    $invCreate = Invoke-RestMethod -Uri "$BaseUrl/api/invitations" -Method Post -Headers @{ Authorization = "Bearer $token" } -Body $invPayload -ContentType 'application/json' -ErrorAction Stop
    Write-Host "Create response:"; PrettyPrint $invCreate
} catch {
    Write-Host "Create invitation failed:" $_.Exception.Message -ForegroundColor Red
    if ($_.Exception.Response) { try { $raw = Get-ResponseContent($_.Exception.Response); if ($raw) { Write-Host $raw } } catch {} }
}
try { if ($invCreate -is [string]) { $invj = $invCreate | ConvertFrom-Json } else { $invj = $invCreate } } catch { $invj = $null }
$invToken = $null
if ($invj.invitation_token) { $invToken = $invj.invitation_token }
elseif ($invj.invitation -and $invj.invitation.invitation_token) { $invToken = $invj.invitation.invitation_token }
if ($invToken) {
    Write-Host "Verify token..."
    try {
        $verify = Invoke-RestMethod -Uri "$BaseUrl/api/invitations/verify/$invToken" -Method Get -ErrorAction Stop
        Write-Host "Verify response:"; PrettyPrint $verify
    } catch {
        Write-Host "Verify failed:" $_.Exception.Message -ForegroundColor Red
        if ($_.Exception.Response) { try { $raw = $_.Exception.Response | Select-Object -ExpandProperty Content; Write-Host $raw } catch {} }
    }

    Write-Host "Complete (public) token..."
    try {
        $completeBody = @{ token = $invToken } | ConvertTo-Json
        $complete = Invoke-RestMethod -Uri "$BaseUrl/api/invitations/complete" -Method Post -Body $completeBody -ContentType 'application/json' -ErrorAction Stop
        Write-Host "Complete response:"; PrettyPrint $complete
    } catch {
        Write-Host "Complete failed:" $_.Exception.Message -ForegroundColor Red
        if ($_.Exception.Response) { try { $raw = $_.Exception.Response | Select-Object -ExpandProperty Content; Write-Host $raw } catch {} }
    }
} else {
    Write-Host "No invitation token returned; skipping verify/complete." -ForegroundColor Yellow
}

Write-Host "\nSmoke run finished." -ForegroundColor Green
