import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server } from 'socket.io';

@WebSocketGateway({
  cors: true,
})
export class TrackingGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('location_update')
  handleLocation(@MessageBody() data: any) {
    this.server.emit('technician_location', data);

    return {
      status: 'ok',
    };
  }
}



