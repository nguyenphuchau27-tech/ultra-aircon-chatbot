import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: true,
})
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('send_message')
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    // broadcast cho tất cả trừ sender
    client.broadcast.emit('receive_message', data);

    // gửi lại cho sender
    client.emit('receive_message', data);

    return {
      status: 'delivered',
      data,
    };
  }
}



