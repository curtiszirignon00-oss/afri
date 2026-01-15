# Test script for Investor Profile and Social Features (PowerShell)
# Usage: .\test-investor-social.ps1

$BaseUrl = "http://localhost:5000"
$CookieFile = "test-cookies.txt"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Investor Profile & Social Tests" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Function to print test result
function Print-Result {
    param (
        [bool]$Success,
        [string]$Message
    )
    if ($Success) {
        Write-Host "✓ $Message" -ForegroundColor Green
    } else {
        Write-Host "✗ $Message" -ForegroundColor Red
    }
}

# Step 1: Login to get JWT token
Write-Host "Step 1: Login to get JWT token" -ForegroundColor Yellow
$Email = Read-Host "Enter your email"
$Password = Read-Host "Enter your password" -AsSecureString
$PasswordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))

try {
    $LoginBody = @{
        email = $Email
        password = $PasswordText
    } | ConvertTo-Json

    $LoginResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $LoginBody `
        -SessionVariable Session

    Print-Result -Success $true -Message "Login successful"
    $UserId = $LoginResponse.user._id
    $Token = $LoginResponse.token
    Write-Host "User ID: $UserId" -ForegroundColor Gray
    Write-Host ""
} catch {
    Print-Result -Success $false -Message "Login failed"
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Prepare headers with token
$Headers = @{
    "Cookie" = "token=$Token"
    "Content-Type" = "application/json"
}

# Step 2: Check Onboarding Status
Write-Host "Step 2: Check Onboarding Status" -ForegroundColor Yellow
try {
    $OnboardingStatus = Invoke-RestMethod -Uri "$BaseUrl/api/investor-profile/onboarding/status" `
        -Method Get `
        -Headers $Headers
    $OnboardingStatus | ConvertTo-Json -Depth 5
    Print-Result -Success $true -Message "Onboarding status retrieved"
    Write-Host ""
} catch {
    Print-Result -Success $false -Message "Failed to get onboarding status"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

# Step 3: Complete Onboarding
Write-Host "Step 3: Complete Onboarding" -ForegroundColor Yellow
try {
    $OnboardingData = @{
        risk_profile = "MODERATE"
        investment_horizon = "LONG_TERM"
        favorite_sectors = @("Technologie", "Finance")
        monthly_investment = 50000
        investment_goals = @("Retraite")
        experience_level = "Intermédiaire"
        quiz_score = 75
    } | ConvertTo-Json

    $CompleteResponse = Invoke-RestMethod -Uri "$BaseUrl/api/investor-profile/onboarding/complete" `
        -Method Post `
        -Headers $Headers `
        -Body $OnboardingData

    $CompleteResponse | ConvertTo-Json -Depth 5
    Print-Result -Success $true -Message "Onboarding completed"
    Write-Host ""
} catch {
    Print-Result -Success $false -Message "Failed to complete onboarding"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

# Step 4: Get Investor Profile
Write-Host "Step 4: Get Investor Profile" -ForegroundColor Yellow
try {
    $ProfileResponse = Invoke-RestMethod -Uri "$BaseUrl/api/investor-profile" `
        -Method Get `
        -Headers $Headers

    $ProfileResponse | ConvertTo-Json -Depth 5
    Print-Result -Success $true -Message "Profile retrieved"
    Write-Host ""
} catch {
    Print-Result -Success $false -Message "Failed to get profile"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

# Step 5: Create Social Post - Opinion
Write-Host "Step 5: Create Social Post (Opinion)" -ForegroundColor Yellow
try {
    $Post1Data = @{
        type = "OPINION"
        content = "SONATEL est une excellente opportunité pour les investisseurs à long terme!"
        stock_symbol = "SNTS"
        tags = @("BRVM", "Dividendes")
        visibility = "PUBLIC"
    } | ConvertTo-Json

    $Post1Response = Invoke-RestMethod -Uri "$BaseUrl/api/social/posts" `
        -Method Post `
        -Headers $Headers `
        -Body $Post1Data

    $Post1Response | ConvertTo-Json -Depth 5
    $Post1Id = $Post1Response.post._id
    Print-Result -Success $true -Message "Post created (ID: $Post1Id)"
    Write-Host ""
} catch {
    Print-Result -Success $false -Message "Failed to create post"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

# Step 6: Create Social Post - Analysis
Write-Host "Step 6: Create Social Post (Analysis)" -ForegroundColor Yellow
try {
    $Post2Data = @{
        type = "ANALYSIS"
        content = "Analyse technique de BOABF: Le cours a franchi une résistance importante"
        stock_symbol = "BOABF"
        tags = @("Analyse technique", "BRVM")
        visibility = "PUBLIC"
    } | ConvertTo-Json

    $Post2Response = Invoke-RestMethod -Uri "$BaseUrl/api/social/posts" `
        -Method Post `
        -Headers $Headers `
        -Body $Post2Data

    $Post2Response | ConvertTo-Json -Depth 5
    Print-Result -Success $true -Message "Analysis post created"
    Write-Host ""
} catch {
    Print-Result -Success $false -Message "Failed to create analysis post"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

# Step 7: Get Feed
Write-Host "Step 7: Get Social Feed" -ForegroundColor Yellow
try {
    $FeedResponse = Invoke-RestMethod -Uri "$BaseUrl/api/social/feed?page=1&limit=10" `
        -Method Get `
        -Headers $Headers

    $FeedResponse | ConvertTo-Json -Depth 5
    Print-Result -Success $true -Message "Feed retrieved"
    Write-Host ""
} catch {
    Print-Result -Success $false -Message "Failed to get feed"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

# Step 8: Like a Post
if ($Post1Id) {
    Write-Host "Step 8: Like Post" -ForegroundColor Yellow
    try {
        $LikeResponse = Invoke-RestMethod -Uri "$BaseUrl/api/social/posts/$Post1Id/like" `
            -Method Post `
            -Headers $Headers

        $LikeResponse | ConvertTo-Json -Depth 5
        Print-Result -Success $true -Message "Post liked"
        Write-Host ""
    } catch {
        Print-Result -Success $false -Message "Failed to like post"
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
    }
}

# Step 9: Comment on Post
if ($Post1Id) {
    Write-Host "Step 9: Comment on Post" -ForegroundColor Yellow
    try {
        $CommentData = @{
            content = "Très bonne analyse, je suis d'accord!"
        } | ConvertTo-Json

        $CommentResponse = Invoke-RestMethod -Uri "$BaseUrl/api/social/posts/$Post1Id/comments" `
            -Method Post `
            -Headers $Headers `
            -Body $CommentData

        $CommentResponse | ConvertTo-Json -Depth 5
        Print-Result -Success $true -Message "Comment added"
        Write-Host ""
    } catch {
        Print-Result -Success $false -Message "Failed to add comment"
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
    }
}

# Step 10: Get Comments
if ($Post1Id) {
    Write-Host "Step 10: Get Post Comments" -ForegroundColor Yellow
    try {
        $CommentsResponse = Invoke-RestMethod -Uri "$BaseUrl/api/social/posts/$Post1Id/comments" `
            -Method Get `
            -Headers $Headers

        $CommentsResponse | ConvertTo-Json -Depth 5
        Print-Result -Success $true -Message "Comments retrieved"
        Write-Host ""
    } catch {
        Print-Result -Success $false -Message "Failed to get comments"
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
    }
}

# Step 11: Get User Posts
Write-Host "Step 11: Get User Posts" -ForegroundColor Yellow
try {
    $UserPostsResponse = Invoke-RestMethod -Uri "$BaseUrl/api/social/posts/$UserId" `
        -Method Get `
        -Headers $Headers

    $UserPostsResponse | ConvertTo-Json -Depth 5
    Print-Result -Success $true -Message "User posts retrieved"
    Write-Host ""
} catch {
    Print-Result -Success $false -Message "Failed to get user posts"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

# Step 12: Get Followers
Write-Host "Step 12: Get Followers" -ForegroundColor Yellow
try {
    $FollowersResponse = Invoke-RestMethod -Uri "$BaseUrl/api/social/followers/$UserId" `
        -Method Get `
        -Headers $Headers

    $FollowersResponse | ConvertTo-Json -Depth 5
    Print-Result -Success $true -Message "Followers retrieved"
    Write-Host ""
} catch {
    Print-Result -Success $false -Message "Failed to get followers"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

# Step 13: Get Following
Write-Host "Step 13: Get Following" -ForegroundColor Yellow
try {
    $FollowingResponse = Invoke-RestMethod -Uri "$BaseUrl/api/social/following/$UserId" `
        -Method Get `
        -Headers $Headers

    $FollowingResponse | ConvertTo-Json -Depth 5
    Print-Result -Success $true -Message "Following retrieved"
    Write-Host ""
} catch {
    Print-Result -Success $false -Message "Failed to get following"
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Tests Completed!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
