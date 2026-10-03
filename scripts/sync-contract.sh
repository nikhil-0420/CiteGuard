#!/usr/bin/env bash
# Copies the frozen contract + mock data into the frontend. Run after ANY contract/mock change.
set -e
cd "$(dirname "$0")/.."
mkdir -p frontend/public/mock frontend/src/contract
cp contract/contract.js frontend/src/contract/contract.js
cp contract/mock/*.json frontend/public/mock/
echo "synced contract + mocks into frontend/"
