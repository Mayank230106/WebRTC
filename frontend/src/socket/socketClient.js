import { io } from 'socket.io-client';

export const socket = io('https://localhost:8181', {
  autoConnect: false,
  transports: ['websocket']
});

// Helper to safely connect with updated auth
export function connectSocketWithAuth(auth) {
  if (socket.connected || socket.connecting) return;
  socket.auth = auth;
  socket.connect();
}
