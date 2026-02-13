#!/bin/bash

# Test script for Investor Profile and Social Features
# Usage: ./test-investor-social.sh

BASE_URL="http://localhost:5000"
COOKIE_FILE="test-cookies.txt"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "  Investor Profile & Social Tests"
echo "========================================="
echo ""

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Step 1: Login to get JWT token
echo -e "${YELLOW}Step 1: Login to get JWT token${NC}"
read -p "Enter your email: " EMAIL
read -sp "Enter your password: " PASSWORD
echo ""

LOGIN_RESPONSE=$(curl -s -c $COOKIE_FILE -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    print_result 0 "Login successful"
    USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo "User ID: $USER_ID"
else
    print_result 1 "Login failed"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# Step 2: Test Investor Profile - Check Onboarding Status
echo -e "${YELLOW}Step 2: Check Onboarding Status${NC}"
ONBOARDING_STATUS=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/api/investor-profile/onboarding/status")
echo "$ONBOARDING_STATUS" | jq '.'
print_result $? "Onboarding status retrieved"
echo ""

# Step 3: Complete Onboarding (if not already done)
echo -e "${YELLOW}Step 3: Complete Onboarding${NC}"
COMPLETE_RESPONSE=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/investor-profile/onboarding/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "risk_profile": "MODERATE",
    "investment_horizon": "LONG_TERM",
    "favorite_sectors": ["Technologie", "Finance"],
    "monthly_investment": 50000,
    "investment_goals": ["Retraite"],
    "experience_level": "Intermédiaire",
    "quiz_score": 75
  }')
echo "$COMPLETE_RESPONSE" | jq '.'
print_result $? "Onboarding completed"
echo ""

# Step 4: Get Investor Profile
echo -e "${YELLOW}Step 4: Get Investor Profile${NC}"
PROFILE_RESPONSE=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/api/investor-profile")
echo "$PROFILE_RESPONSE" | jq '.'
print_result $? "Profile retrieved"
echo ""

# Step 5: Create Social Post - Opinion
echo -e "${YELLOW}Step 5: Create Social Post (Opinion)${NC}"
POST1_RESPONSE=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/social/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "OPINION",
    "content": "SONATEL est une excellente opportunité pour les investisseurs à long terme!",
    "stock_symbol": "SNTS",
    "tags": ["BRVM", "Dividendes"],
    "visibility": "PUBLIC"
  }')
echo "$POST1_RESPONSE" | jq '.'
POST1_ID=$(echo "$POST1_RESPONSE" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
print_result $? "Post created (ID: $POST1_ID)"
echo ""

# Step 6: Create Social Post - Analysis
echo -e "${YELLOW}Step 6: Create Social Post (Analysis)${NC}"
POST2_RESPONSE=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/social/posts" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ANALYSIS",
    "content": "Analyse technique de BOABF: Le cours a franchi une résistance importante",
    "stock_symbol": "BOABF",
    "tags": ["Analyse technique", "BRVM"],
    "visibility": "PUBLIC"
  }')
echo "$POST2_RESPONSE" | jq '.'
print_result $? "Analysis post created"
echo ""

# Step 7: Get Feed
echo -e "${YELLOW}Step 7: Get Social Feed${NC}"
FEED_RESPONSE=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/api/social/feed?page=1&limit=10")
echo "$FEED_RESPONSE" | jq '.'
print_result $? "Feed retrieved"
echo ""

# Step 8: Like a Post
if [ ! -z "$POST1_ID" ]; then
    echo -e "${YELLOW}Step 8: Like Post${NC}"
    LIKE_RESPONSE=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/social/posts/$POST1_ID/like")
    echo "$LIKE_RESPONSE" | jq '.'
    print_result $? "Post liked"
    echo ""
fi

# Step 9: Comment on Post
if [ ! -z "$POST1_ID" ]; then
    echo -e "${YELLOW}Step 9: Comment on Post${NC}"
    COMMENT_RESPONSE=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/api/social/posts/$POST1_ID/comments" \
      -H "Content-Type: application/json" \
      -d '{
        "content": "Très bonne analyse, je suis d'\''accord!"
      }')
    echo "$COMMENT_RESPONSE" | jq '.'
    print_result $? "Comment added"
    echo ""
fi

# Step 10: Get Comments
if [ ! -z "$POST1_ID" ]; then
    echo -e "${YELLOW}Step 10: Get Post Comments${NC}"
    COMMENTS_RESPONSE=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/api/social/posts/$POST1_ID/comments")
    echo "$COMMENTS_RESPONSE" | jq '.'
    print_result $? "Comments retrieved"
    echo ""
fi

# Step 11: Get User Posts
echo -e "${YELLOW}Step 11: Get User Posts${NC}"
USER_POSTS_RESPONSE=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/api/social/posts/$USER_ID")
echo "$USER_POSTS_RESPONSE" | jq '.'
print_result $? "User posts retrieved"
echo ""

# Step 12: Get Followers
echo -e "${YELLOW}Step 12: Get Followers${NC}"
FOLLOWERS_RESPONSE=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/api/social/followers/$USER_ID")
echo "$FOLLOWERS_RESPONSE" | jq '.'
print_result $? "Followers retrieved"
echo ""

# Step 13: Get Following
echo -e "${YELLOW}Step 13: Get Following${NC}"
FOLLOWING_RESPONSE=$(curl -s -b $COOKIE_FILE -X GET "$BASE_URL/api/social/following/$USER_ID")
echo "$FOLLOWING_RESPONSE" | jq '.'
print_result $? "Following retrieved"
echo ""

# Cleanup
rm -f $COOKIE_FILE

echo ""
echo "========================================="
echo "  Tests Completed!"
echo "========================================="
