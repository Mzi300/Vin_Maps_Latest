export interface RoutingWeights {
  /** Weight for configured priority * health factor */
  priority: number;
  /** Weight for latency (lower latency => higher score) */
  latency: number;
  /** Weight for success rate */
  success: number;
  /** Weight for error rate (subtracted) */
  error: number;
  /** Weight for cache efficiency */
  cache: number;
}
