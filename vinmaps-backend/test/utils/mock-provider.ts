// test/utils/mock-provider.ts
/**
 * Simple mock provider used for resilience tests.
 * It implements a minimal subset of the real provider interface:
 * - ping(): Promise<void>
 * - any capability method (e.g., performOperation) – returns resolved value.
 * The behavior can be configured via the constructor.
 */
export class MockProvider {
  private latencyMs: number;
  private pingSuccess: boolean;
  private shouldTimeout: boolean;
  public capabilities: string[];

  constructor(options: {
    capabilities: string[];
    latencyMs?: number;
    pingSuccess?: boolean;
    shouldTimeout?: boolean;
  }) {
    this.capabilities = options.capabilities;
    this.latencyMs = options.latencyMs ?? 0;
    this.pingSuccess = options.pingSuccess ?? true;
    this.shouldTimeout = options.shouldTimeout ?? false;
  }

  /** Simulate the health‑check ping */
  async ping(): Promise<void> {
    if (this.shouldTimeout) {
      return new Promise((_resolve, reject) => {
        setTimeout(() => reject(new Error('Timeout')), this.latencyMs || 1000);
      });
    }
    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    if (this.pingSuccess) {
      return;
    }
    throw new Error('Ping failed');
  }

  /** Generic operation used by routing/search/etc. */
  async performOperation(): Promise<string> {
    // Simulate latency but always succeed for the test.
    await new Promise((resolve) => setTimeout(resolve, this.latencyMs));
    return 'ok';
  }
}
