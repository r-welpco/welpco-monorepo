import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
  type HealthIndicatorResult,
} from '@nestjs/terminus';
import { DataSource } from 'typeorm';

const DATABASE_PING_TIMEOUT_MS = 3000;

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => ({
        bff: {
          status: 'up',
          timestamp: new Date().toISOString(),
        },
      }),
      () => this.pingDatabase(),
    ]);
  }

  private async pingDatabase(): Promise<HealthIndicatorResult> {
    const query = this.dataSource.query('SELECT 1');
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Database ping timeout')),
        DATABASE_PING_TIMEOUT_MS,
      );
    });

    try {
      await Promise.race([query, timeout]);
      return { database: { status: 'up' } };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new HealthCheckError('Database check failed', {
        database: { status: 'down', message },
      });
    }
  }
}
