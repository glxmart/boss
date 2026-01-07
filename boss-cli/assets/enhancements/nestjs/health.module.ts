import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * Health module providing health check endpoints.
 *
 * Provides:
 * - GET /health - Overall health status
 * - GET /ready - Readiness check
 *
 * Usage:
 * Import this module in your AppModule to enable health checks.
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
