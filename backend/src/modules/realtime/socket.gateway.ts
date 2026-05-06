import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

type RegisterTechnicianPayload = {
  techId: number;
};

type TechnicianLocationPayload = {
  id: number;
  lat: number;
  lng: number;
};

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway {
  @WebSocketServer()
  server: Server;

  private readonly technicians: Record<number, string> = {};

  handleConnection(socket: Socket) {
    console.log('Client connected', socket.id);
  }

  handleDisconnect(socket: Socket) {
    console.log('Client disconnected', socket.id);

    for (const [techId, socketId] of Object.entries(this.technicians)) {
      if (socketId === socket.id) {
        delete this.technicians[Number(techId)];
      }
    }
  }

  @SubscribeMessage('register_technician')
  registerTech(
    @MessageBody() data: RegisterTechnicianPayload,
    @ConnectedSocket() socket: Socket,
  ) {
    this.technicians[data.techId] = socket.id;

    return {
      success: true,
      techId: data.techId,
    };
  }

  sendOrderToTech(techId: number, order: unknown) {
    const socketId = this.technicians[techId];

    if (socketId) {
      this.server.to(socketId).emit('new_order', order);
    }
  }

  emitTechnicianLocationUpdate(payload: TechnicianLocationPayload) {
    this.server.emit('technician_location_update', payload);
  }
}