#!/bin/bash

# Run eslint and capture both output and exit code
eslint_output=$(npx eslint --fix --max-warnings 0 . 2>&1)
exit_code=$?

# Create JSON output using jq
if [ $exit_code -eq 0 ]; then
    # No issues found
    jq -n --arg output "$eslint_output" '{
        continue: true,
        status: "passed",
        issues: $output
    }'
    exit 0
else
    # Issues found - output to stdout for Claude to read, then exit 2 to block
    jq -n --arg output "$eslint_output" '{
        decision: "block",
        status: "failed",
        reason: $output
    }'

    # Send blocking feedback to Claude via stderr
    echo "❌ ESLint found linting issues that need to be fixed before proceeding." >&2
    exit 2
fi