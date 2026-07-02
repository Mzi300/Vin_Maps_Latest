import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable, Subject } from 'rxjs';

/**
 * Service that wraps EventEmitter2 and provides both direct emit methods and an RxJS Observable
 * for streaming events to WebSocket gateways or Server‑Sent Events controllers.
 */
@Injectable()
export class HealthEventService {
  private readonly eventSubject = new Subject<{ event: string; payload: any }>();

  constructor(private readonly eventEmitter: EventEmitter2) {
    // Forward any emitted event to the observable subject
    this.eventEmitter.onAny((event: string, payload: any) => {
      this.eventSubject.next({ event, payload });
    });
  }

  /** Emit a generic event */
  emit(event: string, payload: any): void {
    this.eventEmitter.emit(event, payload);
  }

  /** Emit a provider status change (convenience wrapper) */
  emitProviderStatusChange(data: {
    key: string;
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    healthFactor: number;
    effectivePriority: number;
    selectionReason: string;
    capability: string | null;
    timestamp: string;
  }) {
    this.emit('provider.status.change', data);
  }

  /** Observable stream of all health‑related events */
  get events$(): Observable<{ event: string; payload: any }> {
    return this.eventSubject.asObservable();
  }
}
