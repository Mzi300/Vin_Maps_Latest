// src/registry/provider-health.service.ts (updated)
@@
   private metrics: Map<string, ProviderMetrics> = new Map();
@@
   constructor(private readonly registry: ProviderRegistryService) {
@@
   }
@@
   private initializeMetrics() {
@@
   }
+
+  /** Public accessor for the collected metrics */
+  getMetrics(): Map<string, ProviderMetrics> {
+    return this.metrics;
+  }
@@
   @Cron('*/30 * * * * *') // every 30 seconds
   async performHealthCheck() {
@@
   }
@@
   private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
@@
   }
 }
@@
 class TimeoutError extends Error {
   constructor(message: string) {
     super(message);
     this.name = 'TimeoutError';
   }
 }
