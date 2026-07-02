// src/services/routingService.ts
/**
 * RoutingService - handles API communication with the /routing endpoint.
 * Includes timeout handling, retry logic (max 2 retries), and structured error capture.
 */

export interface RouteRequest {
  start: { lat: number; lon: number };
  end: { lat: number; lon: number };
}

export interface RouteResponse {
  geojson: any;
  summary: { distance: number; duration: number };
  steps: string[];
}

const DEFAULT_TIMEOUT_MS = 8000; // 8 seconds
const MAX_RETRIES = 2;

/**
 * Performs a fetch with timeout using AbortController.
 */
async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}, timeout = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(input, { ...init, signal: controller.signal });
  clearTimeout(id);
  return response;
}

/**
 * Calls the routing API with built‑in retry and timeout logic.
 * @param payload - start and end coordinates
 * @returns resolved RouteResponse
 * @throws Error with a descriptive message on failure
 */
export async function requestRoute(payload: RouteRequest): Promise<RouteResponse> {
  let attempt = 0;
  let lastError: any = null;
  while (attempt <= MAX_RETRIES) {
    try {
      const response = await fetchWithTimeout('/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Routing API error ${response.status}: ${text}`);
      }

      const data = (await response.json()) as RouteResponse;
      // Basic validation
      if (!data?.geojson) {
        throw new Error('Invalid routing response: missing geojson');
      }
      return data;
    } catch (e: any) {
      // AbortError indicates a timeout
      if (e.name === 'AbortError') {
        lastError = new Error('Routing request timed out');
      } else {
        lastError = e;
      }
      attempt++;
      if (attempt > MAX_RETRIES) {
        throw new Error(`Routing request failed after ${MAX_RETRIES + 1} attempts: ${lastError.message}`);
      }
      // Simple back‑off before retrying
      await new Promise((res) => setTimeout(res, 500 * attempt));
    }
  }
  // Should never reach here
  throw new Error('Unexpected error in requestRoute');
}
