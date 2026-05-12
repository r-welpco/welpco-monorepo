#!/bin/bash

# Pretty dev script with better log formatting
# Usage: ./scripts/dev-pretty.sh [service-name]

if [ -z "$1" ]; then
  # Run all services with pretty formatting
  pnpm dev:pretty
else
  # Run specific service
  pnpm --filter "$1" dev
fi

