import { RoutingWeights } from './routing-weights.interface';

export const DEFAULT_ROUTING_WEIGHTS: RoutingWeights = {
  priority: 0.4, // importance of configured priority * health factor
  latency: 0.2, // lower latency improves score
  success: 0.2, // higher success rate improves score
  error: 0.1, // higher error rate penalizes score
  cache: 0.1, // cache hit ratio improves score
};
