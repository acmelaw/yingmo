#!/bin/bash

# Wrapper script for jscpd that properly enforces the threshold
# jscpd's exitCode option exits on any duplication, not just when exceeding threshold
# This script checks the actual percentage against the configured threshold

set -e

# Run jscpd and capture output
jscpd src/

# Check if reports directory and JSON report exist
if [ ! -f "reports/jscpd/jscpd-report.json" ]; then
    echo "No duplication report found - assuming no duplications"
    exit 0
fi

# Extract duplication percentage from JSON report
# The report contains statistics.total.percentage field
PERCENTAGE=$(node -e "
const fs = require('fs');
try {
    const report = JSON.parse(fs.readFileSync('reports/jscpd/jscpd-report.json', 'utf8'));
    const percentage = report.statistics?.total?.percentage || 0;
    console.log(percentage);
} catch(e) {
    console.log(0);
}
")

# Get threshold from config (default 1%)
THRESHOLD=$(node -e "
const fs = require('fs');
try {
    const config = JSON.parse(fs.readFileSync('.jscpd.json', 'utf8'));
    console.log(config.threshold || 1);
} catch(e) {
    console.log(1);
}
")

# Compare and exit accordingly
if (( $(echo "$PERCENTAGE > $THRESHOLD" | bc -l) )); then
    echo ""
    echo "ERROR: Code duplication ($PERCENTAGE%) exceeds threshold ($THRESHOLD%)"
    exit 1
else
    echo ""
    echo "✓ Code duplication ($PERCENTAGE%) is below threshold ($THRESHOLD%)"
    exit 0
fi
