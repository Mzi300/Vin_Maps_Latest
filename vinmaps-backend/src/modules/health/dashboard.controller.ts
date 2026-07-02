// src/modules/health/dashboard.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ProviderRegistryService } from '../../registry/provider-registry.service';
import { ProviderHealthService } from '../../registry/provider-health.service';

interface CapabilityInfo {
  capability: string;
  selectedProvider: string;
  selectionReason: string;
  effectivePriority: number;
  configuredPriority: number;
  healthFactor: number;
}

interface ProviderDashboardInfo {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  averageLatency: number | null;
  successRate: number | null;
  errorRate: number | null;
  timeoutRate: number | null;
  cacheHitRatio: number | null;
  requestsProcessed: number | null;
  lastPing: string | null;
}

interface DashboardResponse {
  summary: {
    overallStatus: 'Healthy' | 'Degraded' | 'Critical';
    timestamp: string;
    uptime: number;
    totalProviders: number;
    healthyProviders: number;
    degradedProviders: number;
    unhealthyProviders: number;
    activeCapabilities: string[];
    averageLatency: number | null;
    averageSuccessRate: number | null;
    averageErrorRate: number | null;
    averageTimeoutRate: number | null;
    overallCacheHitRatio: number | null;
    degradedProviderCount: number;
    unavailableProviderCount: number;
  };
  capabilities: CapabilityInfo[];
  providers: ProviderDashboardInfo[];
}

/**
 * Dashboard endpoint aggregating health information for external monitoring tools.
 * Read‑only – does not affect provider selection or any runtime behaviour.
 */
@Controller('health')
export class DashboardController {
  constructor(
    private readonly registry: ProviderRegistryService,
    private readonly healthService: ProviderHealthService,
  ) {}

  @Get('dashboard/snapshot')
  getSnapshot(): DashboardResponse {
    // Reuse existing dashboard logic for snapshot
    return this.getDashboard();
  }

    const now = new Date().toISOString();
    const uptime = Number(process.uptime());

    // --- Providers overview -------------------------------------------------
    const allProviders = this.registry.getAllProvidersInfo();
    const providerMap = new Map<string, typeof allProviders[0]>(
      allProviders.map((p) => [p.key, p]),
    );

    const healthMetrics = this.healthService.getMetrics();

    let healthyProviders = 0;
    let degradedProviders = 0;
    let unhealthyProviders = 0;

    const providerSummaries: ProviderDashboardInfo[] = allProviders.map((p) => {
      if (p.healthFactor === 1) healthyProviders++;
      else if (p.healthFactor > 0) degradedProviders++;
      else unhealthyProviders++;

      const metric = healthMetrics.get(p.key) ?? {};
      const requestCount = metric.requestCount ?? 0;
      const successCount = metric.successCount ?? 0;
      const errorCount = metric.errorCount ?? 0;
      const timeoutCount = metric.timeoutCount ?? 0;
      const cacheHitCount = metric.cacheHitCount ?? 0;

      const successRate = requestCount ? successCount / requestCount : null;
      const errorRate = requestCount ? errorCount / requestCount : null;
      const timeoutRate = requestCount ? timeoutCount / requestCount : null;
      const cacheHitRatio = requestCount ? cacheHitCount / requestCount : null;

      return {
        name: p.name,
        status:
          p.healthFactor === 1
            ? 'healthy'
            : p.healthFactor > 0
            ? 'degraded'
            : 'unhealthy',
        averageLatency: metric.avgLatencyMs ?? null,
        successRate,
        errorRate,
        timeoutRate,
        cacheHitRatio,
        requestsProcessed: requestCount || null,
        lastPing: metric.lastSuccessful ?? null,
      };
    });

    // --- Capability overview ------------------------------------------------
    const capabilitySet = new Set<string>();
    allProviders.forEach((p) => p.capabilities?.forEach((c) => capabilitySet.add(c)));
    const activeCapabilities = Array.from(capabilitySet);

    const capabilityInfos: CapabilityInfo[] = activeCapabilities.map((cap) => {
      // Selected provider info (the highest‑priority entry for this capability)
      const selectedInfoList = this.registry.getProviderInfo<any>(cap);
      const selectedInfo = selectedInfoList[0]; // sorted by effective priority
      const selectionReason = this.registry.selectProvider<any>(cap).reason;

      const providerName = providerMap.get(selectedInfo?.key ?? '')?.name ?? selectedInfo?.key ?? '';

      return {
        capability: cap,
        selectedProvider: providerName,
        selectionReason,
        effectivePriority: selectedInfo?.effectivePriority ?? 0,
        configuredPriority: selectedInfo?.configuredPriority ?? 0,
        healthFactor: selectedInfo?.healthFactor ?? 0,
      };
    });

    // --- Summary calculations ----------------------------------------------
    const totalProviders = allProviders.length;
    const overallStatus =
      unhealthyProviders > 0
        ? 'Critical'
        : degradedProviders > 0
        ? 'Degraded'
        : 'Healthy';

    const avgLatency =
      providerSummaries.reduce((sum, p) => sum + (p.averageLatency ?? 0), 0) /
      providerSummaries.filter((p) => p.averageLatency !== null).length || null;

    const avgSuccessRate =
      providerSummaries.reduce((sum, p) => sum + (p.successRate ?? 0), 0) /
      providerSummaries.filter((p) => p.successRate !== null).length || null;

    const avgErrorRate =
      providerSummaries.reduce((sum, p) => sum + (p.errorRate ?? 0), 0) /
      providerSummaries.filter((p) => p.errorRate !== null).length || null;

    const avgTimeoutRate =
      providerSummaries.reduce((sum, p) => sum + (p.timeoutRate ?? 0), 0) /
      providerSummaries.filter((p) => p.timeoutRate !== null).length || null;

    const overallCacheHitRatio =
      providerSummaries.reduce((sum, p) => sum + (p.cacheHitRatio ?? 0), 0) /
      providerSummaries.filter((p) => p.cacheHitRatio !== null).length || null;

    return {
      summary: {
        overallStatus,
        timestamp: now,
        uptime,
        totalProviders,
        healthyProviders,
        degradedProviders,
        unhealthyProviders,
        activeCapabilities,
        averageLatency: avgLatency,
        averageSuccessRate: avgSuccessRate,
        averageErrorRate: avgErrorRate,
        averageTimeoutRate: avgTimeoutRate,
        overallCacheHitRatio,
        degradedProviderCount: degradedProviders,
        unavailableProviderCount: unhealthyProviders,
      },
      capabilities: capabilityInfos,
      providers: providerSummaries,
    };
  }
}
