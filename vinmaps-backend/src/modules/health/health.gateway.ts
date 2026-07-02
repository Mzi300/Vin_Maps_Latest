import { WebSocketGateway, WebSocketServer, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { HealthEventService } from '../../registry/health-event.service';
import { Injectable } from '@nestjs/common';
import { map } from 'rxjs/operators';

/**
 * WebSocket gateway that streams provider health events to connected clients.
 * Clients connect to: ws://<host>:<port>/health/stream
 * Each emitted message follows the strict payload format defined in the spec.
 */
@WebSocketGateway({ path: '/health/stream' })
export class HealthGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly healthEventService: HealthEventService) {}

  afterInit(server: Server) {
    // Subscribe to the internal health event stream and forward as WS messages
    this.healthEventService.events$
      .pipe(
        map(({ event, payload }) => ({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        })),
      )
      .subscribe((msg) => {
        // Emit under the original event name for client filtering
        this.server.emit(msg.event, msg);
      });
  }

  handleConnection(client: any, ...args: any[]) {
    // No special handling needed; connection is accepted automatically
  }

  handleDisconnect(client: any) {
    // Clean up is handled by the underlying socket.io server
  }
}
