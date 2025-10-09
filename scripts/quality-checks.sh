#!/bin/bash

# Quality Checks Script
# Runs all code quality checks that are executed in CI
# Usage: npm run quality:check (or ./scripts/quality-checks.sh)

set -e  # Exit on error

echo "🔍 Running Code Quality Checks..."
echo ""

# Track overall status
OVERALL_STATUS=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to run a check and track status
run_check() {
    local name=$1
    local command=$2
    local required=$3  # true or false
    
    echo -e "${YELLOW}Running: $name${NC}"
    
    if eval "$command"; then
        echo -e "${GREEN}✓ $name passed${NC}"
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}✗ $name failed${NC}"
            OVERALL_STATUS=1
        else
            echo -e "${YELLOW}⚠ $name had warnings (non-blocking)${NC}"
        fi
    fi
}

# 1. TypeScript Type Check
print_section "1. TypeScript Type Checking"
run_check "TypeScript Compilation" "npx vue-tsc --noEmit" "true"

# 2. Linting
print_section "2. Code Linting (ESLint)"
run_check "ESLint" "npm run lint" "true"

# 3. Formatting
print_section "3. Code Formatting (Prettier)"
run_check "Prettier" "npm run format:check" "true"

# 4. Code Duplication
print_section "4. Code Duplication Detection (jscpd)"
run_check "Code Duplication" "npm run check:duplication" "true"

# 5. Dead Code Detection
print_section "5. Dead Code Detection (ts-prune)"
run_check "Dead Code Detection" "npm run check:dead-code" "false"

# 6. Unit Tests
print_section "6. Unit Tests (Vitest)"
run_check "Unit Tests" "npm test" "true"

# 7. Build
print_section "7. Production Build"
run_check "Build" "npm run build" "true"

# Summary
print_section "Summary"
if [ $OVERALL_STATUS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ All quality checks passed!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Your code is ready to commit and push! 🚀"
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ Some quality checks failed${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Please fix the issues above before committing."
fi

echo ""
exit $OVERALL_STATUS
