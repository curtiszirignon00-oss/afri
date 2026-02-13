# Test Moderation API - PowerShell Script
# Run from backend directory

$BaseUrl = "http://localhost:3000/api"
$Token = "" # Add your auth token here after login

# Helper function
function Invoke-API {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null
    )
    
    $Headers = @{
        "Content-Type" = "application/json"
    }
    if ($Token) {
        $Headers["Authorization"] = "Bearer $Token"
    }
    
    $Uri = "$BaseUrl$Endpoint"
    
    try {
        if ($Body) {
            $Response = Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers -Body ($Body | ConvertTo-Json)
        } else {
            $Response = Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers
        }
        return $Response
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        return $null
    }
}

Write-Host "=== MODERATION API TESTS ===" -ForegroundColor Cyan

# 1. Login first to get token (modify with your credentials)
Write-Host "`n1. Getting auth token..." -ForegroundColor Yellow
$LoginResult = Invoke-API -Method POST -Endpoint "/login" -Body @{
    email = "admin@test.com"
    password = "password123"
}
if ($LoginResult -and $LoginResult.token) {
    $Token = $LoginResult.token
    Write-Host "   Token obtained!" -ForegroundColor Green
} else {
    Write-Host "   Login failed. Make sure you have an admin account." -ForegroundColor Red
    Write-Host "   Continuing tests without auth..." -ForegroundColor Yellow
}

# 2. Get moderation stats
Write-Host "`n2. Getting moderation stats..." -ForegroundColor Yellow
$Stats = Invoke-API -Method GET -Endpoint "/moderation/stats"
if ($Stats) {
    Write-Host "   Pending reports: $($Stats.data.pendingReports)" -ForegroundColor Green
    Write-Host "   Active bans: $($Stats.data.activeBans)" -ForegroundColor Green
    Write-Host "   Banned keywords: $($Stats.data.bannedKeywords)" -ForegroundColor Green
}

# 3. List banned keywords
Write-Host "`n3. Listing banned keywords..." -ForegroundColor Yellow
$Keywords = Invoke-API -Method GET -Endpoint "/moderation/keywords"
if ($Keywords) {
    Write-Host "   Total keywords: $($Keywords.total)" -ForegroundColor Green
}

# 4. Add a test banned keyword
Write-Host "`n4. Adding test banned keyword..." -ForegroundColor Yellow
$NewKeyword = Invoke-API -Method POST -Endpoint "/moderation/keywords" -Body @{
    keyword = "testbannedword123"
    severity = 2
    category = "test"
}
if ($NewKeyword -and $NewKeyword.success) {
    Write-Host "   Keyword added: $($NewKeyword.data.keyword)" -ForegroundColor Green
    $KeywordId = $NewKeyword.data.id
}

# 5. Check text for banned keywords
Write-Host "`n5. Testing keyword detection..." -ForegroundColor Yellow
$CheckResult = Invoke-API -Method POST -Endpoint "/moderation/keywords/check" -Body @{
    text = "This is a test with testbannedword123 in it"
}
if ($CheckResult) {
    Write-Host "   Has banned keywords: $($CheckResult.hasBannedKeywords)" -ForegroundColor Green
    Write-Host "   Max severity: $($CheckResult.maxSeverity)" -ForegroundColor Green
}

# 6. List reports
Write-Host "`n6. Listing reports..." -ForegroundColor Yellow
$Reports = Invoke-API -Method GET -Endpoint "/moderation/reports?status=PENDING"
if ($Reports) {
    Write-Host "   Pending reports: $($Reports.total)" -ForegroundColor Green
}

# 7. List active bans
Write-Host "`n7. Listing active bans..." -ForegroundColor Yellow
$Bans = Invoke-API -Method GET -Endpoint "/moderation/bans"
if ($Bans) {
    Write-Host "   Active bans: $($Bans.total)" -ForegroundColor Green
}

# 8. Get moderation logs
Write-Host "`n8. Getting moderation logs..." -ForegroundColor Yellow
$Logs = Invoke-API -Method GET -Endpoint "/moderation/logs"
if ($Logs) {
    Write-Host "   Total logs: $($Logs.total)" -ForegroundColor Green
}

# 9. Clean up - delete test keyword
if ($KeywordId) {
    Write-Host "`n9. Cleaning up test keyword..." -ForegroundColor Yellow
    $DeleteResult = Invoke-API -Method DELETE -Endpoint "/moderation/keywords/$KeywordId"
    if ($DeleteResult -and $DeleteResult.success) {
        Write-Host "   Test keyword deleted" -ForegroundColor Green
    }
}

Write-Host "`n=== TESTS COMPLETE ===" -ForegroundColor Cyan
Write-Host "Note: Run this script after starting the backend server" -ForegroundColor Gray
