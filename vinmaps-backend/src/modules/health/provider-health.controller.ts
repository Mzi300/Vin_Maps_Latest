// src/modules/health/provider-health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ProviderRegistryService } from '../../registry/provider-registry.service';
import { ProviderHealthService } from '../../registry/provider-health.service';

interface ProviderInfo {
  key: string;
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  configuredPriority: number;
  effectivePriority: number;
  healthFactor: number;
  capabilities: string[];
  selectionReason: string;
  metrics: any;
}

@Controller('health')
export class ProviderHealthController {
  constructor(
    private readonly registry: ProviderRegistryService,
    private readonly healthService: ProviderHealthService,
  ) {}

  @Get('providers')
  getProvidersHealth() {
    const now = new Date().toISOString();
    // Gather provider details from registry
    const providerDetails = this.registry.getAllProvidersInfo();
    // Get metrics map
    const metricsMap = this.healthService.getMetrics();

    const providers: ProviderInfo[] = providerDetails.map((p) => {
      const metric = metricsMap.get(p.key) || {};
      const status = p.healthFactor === 1 ? 'healthy' : p.healthFactor === 0 ? 'unhealthy' : 'degraded';
      return {
        key: p.key,
        name: p.name,
        status,
        configuredPriority: p.configuredPriority,
        effectivePriority: p.effectivePriority,
        healthFactor: p.healthFactor,
        capabilities: p.capabilities,
        selectionReason: p.selectionReason,
        metrics: {
          availability: metric.availability,
          avgLatencyMs: metric.avgLatencyMs,
          successCount: metric.successCount,
          errorCount: metric.errorCount,
          timeoutCount: metric.timeoutCount,
          rateLimitCount: metric.rateLimitCount,
          authFailureCount: metric.authFailureCount,
          requestCount: metric.requestCount,
          cacheHitCount: metric.cacheHitCount,
          consecutiveFailures: metric.consecutiveFailures,
          lastSuccessful: metric.lastSuccessful,
          lastFailed: metric.lastFailed,
        },
      } as ProviderInfo;
    });

    // Summary
    const total = providers.length;
    const healthy = providers.filter((p) => p.status === 'healthy').length;
    const degraded = providers.filter((p) => p.status === 'degraded').length;
    const unhealthy = providers.filter((p) => p.status === 'unhealthy').length;

    const summary = {
      overallStatus: unhealthy > 0 ? 'unhealthy' : degraded > 0 ? 'degraded' : 'healthy',
      totalProviders: total,
      healthyProviders: healthy,
      degradedProviders: degraded,
      unhealthyProviders: unhealthy,
      timestamp: now,
    };

    return { summary, providers };
  }
}

// Note: The ProviderRegistryService must expose a method getAllProvidersInfo() returning an array of
// { key, name, configuredPriority, effectivePriority, healthFactor, capabilities, selectionReason }.
