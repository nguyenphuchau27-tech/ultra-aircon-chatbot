const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('connected:', socket.id);
});

socket.on('technician_location_update', payload => {
  console.log('technician_location_update:', payload);
});

socket.on('new_order', payload => {
  console.log('new_order:', payload);
});

socket.on('disconnect', reason => {
  console.log('disconnect:', reason);
});