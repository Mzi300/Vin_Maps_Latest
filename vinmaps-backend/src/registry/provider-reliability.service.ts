import { Injectable, OnModuleInit } from '@nestjs/common';
import { HealthEventService } from './health-event.service';
import { ProviderHealthService } from './provider-health.service';

/**
 * Service that maintains long‑term reliability statistics for each provider.
 * It updates its internal state based on health events and exposes a simple
 * reliability report.
 */
@Injectable()
export class ProviderReliabilityService implements OnModuleInit {
  private readonly stats = new Map<string, {
    uptimeMs: number;
    lastSeen: number; // timestamp of last health event
    latencySum: number;
    latencyCount: number;
    failureCount: number;
    recoveryCount: number;
  }>();

  constructor(
    private readonly healthEventService: HealthEventService,
    private readonly healthService: ProviderHealthService,
  ) {}

  onModuleInit() {
    // Subscribe to health changes
    this.healthEventService.events$.subscribe(({ event, payload }) => {
      if (event === 'provider.health.changed') {
        const { key, healthFactor, timestamp } = payload as any;
        const now = new Date(timestamp).getTime();
        const entry = this.stats.get(key) ?? {
          uptimeMs: 0,
          lastSeen: now,
          latencySum: 0,
          latencyCount: 0,
          failureCount: 0,
          recoveryCount: 0,
        };
        // Update uptime based on health factor (1 = fully up, 0 = down)
        const delta = now - entry.lastSeen;
        entry.uptimeMs += delta * healthFactor;
        entry.lastSeen = now;
        // Update latency stats from ProviderHealthService metrics
        const metrics = this.healthService.getMetrics().get(key) ?? {};
        if (metrics.avgLatencyMs !== undefined) {
          entry.latencySum += metrics.avgLatencyMs;
          entry.latencyCount++;
        }
        // Track failures / recoveries
        if (healthFactor === 0) entry.failureCount++;
        if (healthFactor === 1) entry.recoveryCount++;
        this.stats.set(key, entry);
      }
    });
  }

  /**
   * Returns a reliability summary for a provider.
   */
  getReliability(key: string) {
    const entry = this.stats.get(key);
    if (!entry) return null;
    const avgLatency = entry.latencyCount ? entry.latencySum / entry.latencyCount : 0;
    const uptimePct = entry.uptimeMs / (entry.lastSeen || 1);
    const reliabilityScore = uptimePct * 100; // 0‑100 scale
    const stabilityIndex = (entry.recoveryCount - entry.failureCount) * 10; // simple metric
    const performanceTrend = entry.latencyCount > 5 ? (avgLatency < 200 ? 'improving' : avgLatency > 500 ? 'degrading' : 'stable') : 'stable';
    return {
      reliabilityScore,
      stabilityIndex,
      performanceTrend,
    };
  }
}
