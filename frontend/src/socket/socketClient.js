import { io } from 'socket.io-client';
export const socket = io('https://localhost:8181', {
  autoConnect: false,
  transports: ['websocket']
});
