import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthCheckResult } from '@nestjs/terminus';

/**
 * Health check controller for container orchestration and load balancers.
 *
 * Endpoints:
 * - GET /health - Overall health status
 * - GET /ready - Readiness check (can accept traffic)
 *
 * Add this module to your AppModule:
 * ```ts
 * import { HealthModule } from './health/health.module';
 *
 * @Module({
 *   imports: [HealthModule],
 * })
 * export class AppModule {}
 * ```
 */
@Controller()
export class HealthController {
  constructor(private health: HealthCheckService) {}

  /**
   * Health check endpoint - indicates the service is running
   */
  @Get('health')
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Add health indicators here
      // Example: Database check
      // () => this.db.pingCheck('database'),

      // Example: Memory check
      // () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Example: Disk check
      // () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }

  /**
   * Readiness check - indicates the service can accept traffic
   * Use this for Kubernetes readiness probes
   */
  @Get('ready')
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      // Add readiness checks here
      // These should verify that the service can handle requests
      // Example: Check database connection
      // () => this.db.pingCheck('database'),
    ]);
  }
}
