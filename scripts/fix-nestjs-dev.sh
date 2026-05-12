#!/bin/bash

# Fix dev scripts for all NestJS services
services=(
  "user-management"
  "profile-management"
  "service-discovery"
  "job-posting-matching"
  "booking-scheduling"
  "payment-processing"
  "communication"
  "review-rating"
  "dispute-resolution"
  "safety-verification"
  "notification"
  "content-management"
)

for service in "${services[@]}"; do
  service_dir="apps/$service"
  
  echo "Fixing dev script for $service..."
  
  # Update package.json dev script to build first, then start in watch mode
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$service_dir/package.json', 'utf8'));
    // Use nest start --watch which should compile on the fly
    // But ensure it works by using the correct command
    pkg.scripts.dev = 'nest start --watch';
    pkg.scripts['start:dev'] = 'nest start --watch';
    fs.writeFileSync('$service_dir/package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  
  # Update nest-cli.json to ensure proper watch mode
  node -e "
    const fs = require('fs');
    const nestCli = JSON.parse(fs.readFileSync('$service_dir/nest-cli.json', 'utf8'));
    nestCli.compilerOptions = nestCli.compilerOptions || {};
    nestCli.compilerOptions.deleteOutDir = false;
    nestCli.compilerOptions.watchAssets = true;
    fs.writeFileSync('$service_dir/nest-cli.json', JSON.stringify(nestCli, null, 2) + '\n');
  "
done

echo "All NestJS services updated!"
