import { WebSocketGateway, WebSocketServer, SubscribeMessage, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/live' })
export class LiveGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join')
  join(@ConnectedSocket() client: Socket, @MessageBody() body: { caregiverId: string }) {
    if (!body?.caregiverId) return;
    void client.join(`caregiver:${body.caregiverId}`);
    client.emit('joined', { room: `caregiver:${body.caregiverId}` });
  }

  emitAlert(caregiverId: string, alert: unknown) {
    this.server?.to(`caregiver:${caregiverId}`).emit('alert', alert);
  }

  emitSync(caregiverId: string, payload: unknown) {
    this.server?.to(`caregiver:${caregiverId}`).emit('sync', payload);
  }
}
