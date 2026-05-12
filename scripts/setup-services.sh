#!/bin/bash

# Service configuration: name:port:description
services=(
  "profile-management:3002:Profile Management Domain Service"
  "service-discovery:3003:Service Discovery Domain Service"
  "job-posting-matching:3004:Job Posting & Matching Domain Service"
  "booking-scheduling:3005:Booking & Scheduling Domain Service"
  "payment-processing:3006:Payment Processing Domain Service"
  "communication:3007:Communication Domain Service"
  "review-rating:3008:Review & Rating Domain Service"
  "dispute-resolution:3009:Dispute Resolution Domain Service"
  "safety-verification:3010:Safety & Verification Domain Service"
  "notification:3011:Notification Domain Service"
  "content-management:3012:Content Management Domain Service"
)

for service_config in "${services[@]}"; do
  IFS=':' read -r service port desc <<< "$service_config"
  service_dir="apps/$service"
  
  echo "Setting up $service (port $port)..."
  
  # Update package.json
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$service_dir/package.json', 'utf8'));
    pkg.name = '@welpco/$service';
    pkg.description = '$desc';
    pkg.scripts.dev = 'nest start --watch';
    pkg.scripts['type-check'] = 'tsc --noEmit';
    if (!pkg.dependencies['@nestjs/terminus']) {
      pkg.dependencies['@nestjs/terminus'] = '^11.0.1';
    }
    fs.writeFileSync('$service_dir/package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  
  # Update main.ts
  cat > "$service_dir/src/main.ts" << EOF
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? $port;
  await app.listen(port);
  console.log(\`$desc is running on: http://localhost:\${port}\`);
}
bootstrap();
EOF

  # Create health module
  mkdir -p "$service_dir/src/health"
  
  cat > "$service_dir/src/health/health.controller.ts" << 'HEALTHCONTROLLER'
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);
  }
}
HEALTHCONTROLLER

  cat > "$service_dir/src/health/health.module.ts" << 'HEALTHMODULE'
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
HEALTHMODULE

  # Update app.module.ts
  node -e "
    const fs = require('fs');
    let content = fs.readFileSync('$service_dir/src/app.module.ts', 'utf8');
    if (!content.includes('HealthModule')) {
      const lines = content.split('\n');
      const importIndex = lines.findIndex(l => l.includes('from') && l.includes('@nestjs/common'));
      if (importIndex >= 0) {
        lines.splice(importIndex + 1, 0, \"import { HealthModule } from './health/health.module';\");
      }
      const importsIndex = lines.findIndex(l => l.includes('imports:'));
      if (importsIndex >= 0) {
        lines[importsIndex] = lines[importsIndex].replace('imports: []', 'imports: [HealthModule]');
      }
      fs.writeFileSync('$service_dir/src/app.module.ts', lines.join('\n'));
    }
  "
  
  # Update tsconfig.json
  node -e "
    const fs = require('fs');
    const tsconfig = JSON.parse(fs.readFileSync('$service_dir/tsconfig.json', 'utf8'));
    tsconfig.extends = '../../tsconfig.json';
    fs.writeFileSync('$service_dir/tsconfig.json', JSON.stringify(tsconfig, null, 2) + '\n');
  "
done

echo "All services configured!"
