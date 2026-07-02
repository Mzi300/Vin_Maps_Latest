import { Injectable } from '@nestjs/common';
import { ProviderConfig } from '../config/provider-config.interface';
import { ProviderHealthService } from './provider-health.service';
import { DEFAULT_ROUTING_WEIGHTS } from '../config/default-routing-weights';
import { RoutingWeights } from '../config/routing-weights.interface';

/**
 * Service that calculates a dynamic score for each provider based on
 * configured priority, health factor, latency, success/error rates, and cache efficiency.
 * The weights are configurable via `DEFAULT_ROUTING_WEIGHTS`.
 */
@Injectable()
export class ProviderScoringService {
  constructor(private readonly healthService: ProviderHealthService) {}

  /** Compute the final score for a provider entry */
  computeScore(entry: { key: string; config: ProviderConfig; healthFactor: number }): number {
    const metrics = this.healthService.getMetrics().get(entry.key) ?? {};
    const latency = metrics.avgLatencyMs ?? 0; // lower is better
    const successRate = metrics.successCount && metrics.requestCount ? metrics.successCount / metrics.requestCount : 0;
    const errorRate = metrics.errorCount && metrics.requestCount ? metrics.errorCount / metrics.requestCount : 0;
    const cacheHitRatio = metrics.cacheHitCount && metrics.requestCount ? metrics.cacheHitCount / metrics.requestCount : 0;

    const w: RoutingWeights = DEFAULT_ROUTING_WEIGHTS;

    // Normalize latency: we treat lower latency as higher contribution.
    // For simplicity, invert latency (assuming max reasonable latency 5000ms).
    const maxLatency = 5000;
    const normLatency = 1 - Math.min(latency, maxLatency) / maxLatency; // 0..1

    const priorityScore = entry.config.priority * entry.healthFactor * w.priority;
    const latencyScore = normLatency * w.latency;
    const successScore = successRate * w.success;
    const errorScore = (1 - errorRate) * w.error; // lower error -> higher score
    const cacheScore = cacheHitRatio * w.cache;

    return priorityScore + latencyScore + successScore + errorScore + cacheScore;
  }
}
