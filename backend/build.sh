#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install Python backend dependencies
pip install -r requirements.txt

# 2. Build the React frontend (sibling directory)
cd ../frontend
npm install
npm run build
cd ../backend
