#!/usr/bin/env bash
set -e
npm ci
cd backend && npm ci && npm run build && cd ..
cd frontend && npm ci && npm run build && cd ..
