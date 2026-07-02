import { Injectable } from '@nestjs/common';
import { ProviderScoringService } from '../registry/provider-scoring.service';
import { HealthEventService } from '../registry/health-event.service';
import { ProviderHealthService } from '../registry/provider-health.service';

/**
 * Module that bundles health‑related providers.
 */
import { Module } from '@nestjs/common';
import { HealthGateway } from './health.gateway';
import { HealthController } from './health.controller';
import { ProviderHealthController } from './provider-health.controller';
import { DashboardController } from './dashboard.controller';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { IncidentsModule } from '../incidents/incidents.module';

@Module({
  imports: [TelemetryModule, IncidentsModule],
  controllers: [HealthController, ProviderHealthController, DashboardController],
  providers: [HealthGateway, ProviderScoringService, ProviderHealthService, HealthEventService],
})
export class HealthModule {}
