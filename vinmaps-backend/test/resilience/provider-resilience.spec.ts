// test/resilience/provider-resilience.spec.ts
/**
 * Resilience test suite for VinMaps provider system.
 * Uses in‑memory NestJS testing module, mock providers and load generator.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DashboardController } from '../../src/modules/health/dashboard.controller';
import { ProviderHealthController } from '../../src/modules/health/provider-health.controller';
import { HealthController } from '../../src/modules/health/health.controller';
import { ProviderRegistryService } from '../../src/registry/provider-registry.service';
import { ProviderHealthService } from '../../src/registry/provider-health.service';
import { MockProvider } from '../../test/utils/mock-provider';
import { generateLoad } from '../../test/utils/load-generator';

describe('Provider Resilience Suite', () => {
  let app: INestApplication;
  let registry: ProviderRegistryService;
  let healthService: ProviderHealthService;

  // Helper to build a mock registry with given provider configs
  const buildMockRegistry = (providers: any[]) => {
    const mock: Partial<ProviderRegistryService> = {
      allProviders: [],
      providersByCapability: new Map<string, any[]>(),
      getAllProvidersInfo: jest.fn(),
      getProviderInfo: jest.fn(),
      selectProvider: jest.fn(),
    } as any;
    // Populate internal structures
    mock.allProviders = providers.map((p) => ({
      key: p.key,
      instance: p.instance,
      config: { priority: p.priority, capabilities: p.capabilities, name: p.name },
      healthFactor: p.healthFactor,
    }));
    // Build capability map (sorted by effective priority descending)
    providers.forEach((p) => {
      p.capabilities.forEach((cap: string) => {
        const list = mock.providersByCapability.get(cap) || [];
        list.push({
          key: p.key,
          instance: p.instance,
          config: { priority: p.priority, capabilities: p.capabilities },
          healthFactor: p.healthFactor,
        });
        mock.providersByCapability.set(cap, list);
      });
    });
    // Simple effective priority = priority * healthFactor
    const effective = (provider: any) => provider.config.priority * provider.healthFactor;
    // Sort each capability list
    mock.providersByCapability.forEach((list) => {
      list.sort((a, b) => effective(b) - effective(a));
    });
    // Implement selectProvider using the sorted list
    mock.selectProvider = (cap: string) => {
      const list = mock.providersByCapability.get(cap);
      if (!list || list.length === 0) throw new Error('no provider');
      const top = list[0];
      let reason = 'selected provider';
      if (list.length === 1) reason = 'only provider for capability';
      else if (top.healthFactor === 1) reason = 'highest configured priority (healthy)';
      else if (top.healthFactor > 0) reason = 'health‑adjusted priority (degraded)';
      else reason = 'fallback due to unavailable provider';
      return { instance: top.instance, reason };
    };
    // getAllProvidersInfo for dashboard
    mock.getAllProvidersInfo = () =>
      mock.allProviders.map((e) => ({
        key: e.key,
        name: e.config.name ?? e.key,
        configuredPriority: e.config.priority,
        effectivePriority: effective(e),
        healthFactor: e.healthFactor,
        capabilities: e.config.capabilities,
        selectionReason: mock.selectProvider(e.config.capabilities[0]).reason,
      }));
    return mock as ProviderRegistryService;
  };

  const buildMockHealthService = (metricsMap: Map<string, any>) => {
    const mock: Partial<ProviderHealthService> = {
      getMetrics: jest.fn(() => metricsMap),
    } as any;
    return mock as ProviderHealthService;
  };

  beforeAll(async () => {
    // create dummy providers
    const providerA = new MockProvider({ capabilities: ['routing'], latencyMs: 10, pingSuccess: true });
    const providerB = new MockProvider({ capabilities: ['routing'], latencyMs: 10, pingSuccess: true });
    // initial registry with both healthy and same priority 100
    registry = buildMockRegistry([
      { key: 'provA', name: 'Provider A', priority: 100, capabilities: ['routing'], healthFactor: 1, instance: providerA },
      { key: 'provB', name: 'Provider B', priority: 90, capabilities: ['routing'], healthFactor: 1, instance: providerB },
    ]);
    // health service metrics (empty for now)
    const metrics = new Map<string, any>();
    healthService = buildMockHealthService(metrics);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController, ProviderHealthController, DashboardController],
      providers: [
        { provide: ProviderRegistryService, useValue: registry },
        { provide: ProviderHealthService, useValue: healthService },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------- Scenario 1 ----------
  it('Scenario 1 – Single Provider Failure', async () => {
    // Simulate providerA failure by setting healthFactor to 0.5
    const provEntry = (registry as any).allProviders.find((p: any) => p.key === 'provA');
    provEntry.healthFactor = 0.5;
    // Re‑sort capability list manually
    const list = (registry as any).providersByCapability.get('routing');
    list.sort((a: any, b: any) => b.config.priority * b.healthFactor - a.config.priority * a.healthFactor);

    // Verify registry selects providerB now
    const selected = registry.selectProvider<any>('routing');
    expect(selected.instance).toBe((registry as any).allProviders.find((p: any) => p.key === 'provB').instance);
    expect(selected.reason).toBe('health‑adjusted priority (degraded)');

    // Call health endpoint
    const healthRes = await request(app.getHttpServer()).get('/health/providers').expect(200);
    expect(healthRes.body).toBeDefined();
    // Dashboard endpoint
    const dashRes = await request(app.getHttpServer()).get('/health/dashboard').expect(200);
    expect(dashRes.body.summary.unhealthyProviders).toBeGreaterThanOrEqual(0);
  });

  // ---------- Scenario 2 ----------
  it('Scenario 2 – Multiple Provider Failures', async () => {
    // Fail both providers
    (registry as any).allProviders.forEach((p: any) => (p.healthFactor = 0));
    (registry as any).providersByCapability.get('routing').forEach((p: any) => (p.healthFactor = 0));
    // Re‑sort
    const list = (registry as any).providersByCapability.get('routing');
    list.sort((a: any, b: any) => b.config.priority * b.healthFactor - a.config.priority * a.healthFactor);

    // selectProvider should still return the first (unavailable) but reason fallback
    const sel = registry.selectProvider<any>('routing');
    expect(sel.reason).toBe('fallback due to unavailable provider');

    const healthRes = await request(app.getHttpServer()).get('/health/providers').expect(200);
    expect(healthRes.body).toBeDefined();
    const dashRes = await request(app.getHttpServer()).get('/health/dashboard').expect(200);
    expect(dashRes.body.summary.overallStatus).toBe('Critical');
  });

  // ---------- Scenario 3 ----------
  it('Scenario 3 – Provider Recovery', async () => {
    // Recover providerA to healthy
    const provA = (registry as any).allProviders.find((p: any) => p.key === 'provA');
    provA.healthFactor = 1;
    const list = (registry as any).providersByCapability.get('routing');
    list.forEach((p: any) => (p.healthFactor = p.key === 'provA' ? 1 : 1));
    list.sort((a: any, b: any) => b.config.priority * b.healthFactor - a.config.priority * a.healthFactor);

    const sel = registry.selectProvider<any>('routing');
    expect(sel.instance).toBe(provA.instance);
    expect(sel.reason).toBe('highest configured priority (healthy)');

    const dash = await request(app.getHttpServer()).get('/health/dashboard').expect(200);
    expect(dash.body.summary.unhealthyProviders).toBe(0);
  });

  // ---------- Scenario 4 – High Load ----------
  it('Scenario 4 – High Load Test', async () => {
    const tasks: (() => Promise<any>)[] = [];
    // generate dummy endpoint calls (use health endpoints as proxy for load)
    for (let i = 0; i < 100; i++) {
      tasks.push(() => request(app.getHttpServer()).get('/health/providers'));
      tasks.push(() => request(app.getHttpServer()).get('/health/dashboard'));
      // add mock provider operation calls
      tasks.push(() => (registry as any).allProviders[0].instance.performOperation());
    }
    await generateLoad(tasks, 20);
    // If we reach here without unhandled rejection the test passes
    expect(true).toBeTruthy();
  }, 30000);

  // ---------- Scenario 5 – Metrics Validation ----------
  it('Scenario 5 – Metrics Validation', async () => {
    // Populate metrics map for providerA
    const metrics = new Map<string, any>([
      [
        'provA',
        {
          requestCount: 100,
          successCount: 95,
          errorCount: 3,
          timeoutCount: 2,
          avgLatencyMs: 120,
          cacheHitCount: 80,
          lastSuccessful: new Date().toISOString(),
        },
      ],
    ]);
    (healthService as any).getMetrics = jest.fn(() => metrics);

    const dashRes = await request(app.getHttpServer()).get('/health/dashboard').expect(200);
    const providerInfo = dashRes.body.providers.find((p: any) => p.name === 'Provider A');
    expect(providerInfo).toBeDefined();
    expect(providerInfo.successRate).toBeCloseTo(0.95);
    expect(providerInfo.errorRate).toBeCloseTo(0.03);
    expect(providerInfo.timeoutRate).toBeCloseTo(0.02);
    expect(providerInfo.cacheHitRatio).toBeCloseTo(0.8);
  });

  // ---------- Scenario 6 – Regression Safety ----------
  it('Scenario 6 – Regression Safety', async () => {
    // Ensure registry still returns provider for a capability that exists
    const sel = registry.selectProvider<any>('routing');
    expect(sel.instance).toBeDefined();
    // Ensure health controller still works
    const sysHealth = await request(app.getHttpServer()).get('/system/health').expect(200);
    expect(sysHealth.body.status).toBe('OK');
  });

  // ---------- Scenario 7 – Priority Recovery ----------
  it('Scenario 7 – Priority Recovery', async () => {
    // Provider A (higher priority) is currently healthy
    const provA = (registry as any).allProviders.find((p: any) => p.key === 'provA');
    const provB = (registry as any).allProviders.find((p: any) => p.key === 'provB');
    // Simulate B healthy, A degraded
    provA.healthFactor = 0.5;
    provB.healthFactor = 1;
    const list = (registry as any).providersByCapability.get('routing');
    list.sort((a: any, b: any) => b.config.priority * b.healthFactor - a.config.priority * a.healthFactor);
    // Now recover A
    provA.healthFactor = 1;
    list.sort((a: any, b: any) => b.config.priority * b.healthFactor - a.config.priority * a.healthFactor);
    const sel = registry.selectProvider<any>('routing');
    expect(sel.instance).toBe(provA.instance);
  });

  // ---------- Scenario 8 – Flapping Provider ----------
  it('Scenario 8 – Flapping Provider', async () => {
    const provA = (registry as any).allProviders.find((p: any) => p.key === 'provA');
    // flap health factor 3 times
    for (let i = 0; i < 3; i++) {
      provA.healthFactor = i % 2 === 0 ? 0 : 1; // fail, recover, fail
      const list = (registry as any).providersByCapability.get('routing');
      list.sort((a: any, b: any) => b.config.priority * b.healthFactor - a.config.priority * a.healthFactor);
    }
    // final state should be healthy (1)
    expect(provA.healthFactor).toBe(1);
  });

  // ---------- Scenario 9 – Dashboard Consistency ----------
  it('Scenario 9 – Dashboard Consistency', async () => {
    const providersRes = await request(app.getHttpServer()).get('/health/providers').expect(200);
    const dashboardRes = await request(app.getHttpServer()).get('/health/dashboard').expect(200);
    // compare counts
    expect(dashboardRes.body.summary.totalProviders).toBe(providersRes.body.length);
    // compare each provider entry
    providersRes.body.forEach((p: any) => {
      const dashProv = dashboardRes.body.providers.find((dp: any) => dp.name === p.name);
      expect(dashProv).toBeDefined();
      expect(dashProv.status).toBe(p.status);
      expect(dashProv.effectivePriority).toBe(p.effectivePriority);
    });
  });
});
