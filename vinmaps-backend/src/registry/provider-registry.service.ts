import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { ProviderConfig } from '../config/provider-config.interface';
import { HealthEventService } from './health-event.service';
import { ProviderScoringService } from './provider-scoring.service';
interface ProviderEntry {
  key: string;
  instance: any;
  config: ProviderConfig;
  healthFactor: number; // 1 = healthy, 0 = unavailable, between for degraded
}

@Injectable()
export class ProviderRegistryService {
  private allProviders: ProviderEntry[] = [];
  private providersByCapability: Map<string, ProviderEntry[]> = new Map();

    constructor(
    private readonly healthEventService: HealthEventService,
    private readonly scoringService: ProviderScoringService,
  ) {}

  /** Load providers from a configuration object */
  public loadProviders(configObj: { [key: string]: ProviderConfig }) {
    for (const key of Object.keys(configObj)) {
      const cfg = configObj[key];
      const modulePath = path.resolve(__dirname, '../../', cfg.class);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ProviderClass = require(modulePath).default || require(modulePath);
      const instance = new ProviderClass();
      const entry: ProviderEntry = {
        key,
        instance,
        config: cfg,
        healthFactor: 1,
      };
      this.allProviders.push(entry);
      for (const cap of cfg.capabilities) {
        const list = this.providersByCapability.get(cap) ?? [];
        list.push(entry);
        // Sort descending by effective priority
        list.sort((a, b) => this.effectivePriority(b) - this.effectivePriority(a));
        this.providersByCapability.set(cap, list);
      }
    }
  }

  private effectivePriority(entry: ProviderEntry): number {
    return entry.config.priority * entry.healthFactor;
  }

  private getSelectionReason(entry: ProviderEntry): string {
    if (entry.healthFactor === 1) return 'highest configured priority (healthy)';
    if (entry.healthFactor > 0) return 'health-adjusted priority (degraded)';
    return 'fallback due to unavailable provider';
  }

  setHealthFactor(providerKey: string, factor: number) {
    const entry = this.allProviders.find((e) => e.key === providerKey);
    if (entry) {
      const previous = entry.healthFactor;
      entry.healthFactor = factor;
      // Reorder capability lists after health change
      for (const cap of entry.config.capabilities) {
        const list = this.providersByCapability.get(cap);
        if (list) {
          list.sort((a, b) => this.effectivePriority(b) - this.effectivePriority(a));
        }
      }
      // Emit health change event
      this.healthEventService.emit('provider.health.changed', {
        key: entry.key,
        name: entry.config.name ?? entry.key,
        status: factor === 1 ? 'healthy' : factor === 0 ? 'unhealthy' : 'degraded',
        healthFactor: factor,
        effectivePriority: this.effectivePriority(entry),
        selectionReason: this.getSelectionReason(entry),
        timestamp: new Date().toISOString(),
        capability: null,
      });
      // Emit specific status change events
      if (previous === 1 && factor < 1) {
        this.healthEventService.emit('provider.failed', { key: entry.key, timestamp: new Date().toISOString() });
      } else if (previous < 1 && factor === 1) {
        this.healthEventService.emit('provider.recovered', { key: entry.key, timestamp: new Date().toISOString() });
      }
      // Emit priority update event
      this.healthEventService.emit('provider.priority.updated', {
        key: entry.key,
        name: entry.config.name ?? entry.key,
        status: factor === 1 ? 'healthy' : factor === 0 ? 'unhealthy' : 'degraded',
        healthFactor: factor,
        effectivePriority: this.effectivePriority(entry),
        selectionReason: this.getSelectionReason(entry),
        timestamp: new Date().toISOString(),
        capability: null,
      });
    }
  }

  getByCapability<T>(capability: string): T {
    const list = this.providersByCapability.get(capability);
    if (!list || list.length === 0) {
      throw new Error(`No provider found for capability: ${capability}`);
    }
    return list[0].instance as T;
  }

  selectProvider<T>(capability: string): { instance: T; reason: string } {
    const list = this.providersByCapability.get(capability);
    if (!list || list.length === 0) {
      throw new Error(`No provider found for capability: ${capability}`);
    }
    // Compute scores and pick best
    let bestEntry = list[0];
    let bestScore = this.scoringService.computeScore({
      key: bestEntry.key,
      config: bestEntry.config,
      healthFactor: bestEntry.healthFactor,
    });
    for (const entry of list) {
      const score = this.scoringService.computeScore({
        key: entry.key,
        config: entry.config,
        healthFactor: entry.healthFactor,
      });
      if (score > bestScore || (score === bestScore && entry.key < bestEntry.key)) {
        bestScore = score;
        bestEntry = entry;
      }
    }
    const reason = this.getSelectionReason(bestEntry);
    // Emit selection event
    this.healthEventService.emit('provider.selected', {
      key: bestEntry.key,
      name: bestEntry.config.name ?? bestEntry.key,
      status: bestEntry.healthFactor === 1 ? 'healthy' : bestEntry.healthFactor === 0 ? 'unhealthy' : 'degraded',
      healthFactor: bestEntry.healthFactor,
      effectivePriority: this.effectivePriority(bestEntry),
      selectionReason: reason,
      timestamp: new Date().toISOString(),
      capability,
    });
    return { instance: bestEntry.instance as T, reason };
  }

  getAllByCapability<T>(capability: string): T[] {
    const list = this.providersByCapability.get(capability);
    if (!list) return [];
    return list.map((e) => e.instance as T);
  }

  getProviderInfo<T>(capability: string): Array<{
    key: string;
    instance: T;
    configuredPriority: number;
    effectivePriority: number;
    healthFactor: number;
    capabilities: string[];
  }> {
    const list = this.providersByCapability.get(capability) ?? [];
    return list.map((e) => ({
      key: e.key,
      instance: e.instance as T,
      configuredPriority: e.config.priority,
      effectivePriority: this.effectivePriority(e),
      healthFactor: e.healthFactor,
      capabilities: e.config.capabilities,
    }));
  }

  getAllProvidersInfo(): Array<{
    key: string;
    name: string;
    configuredPriority: number;
    effectivePriority: number;
    healthFactor: number;
    capabilities: string[];
    selectionReason: string;
  }> {
    return this.allProviders.map((e) => ({
      key: e.key,
      name: e.config.name ?? e.key,
      configuredPriority: e.config.priority,
      effectivePriority: this.effectivePriority(e),
      healthFactor: e.healthFactor,
      capabilities: e.config.capabilities,
      selectionReason: this.getSelectionReason(e),
    }));
  }
}
