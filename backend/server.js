import fs from 'fs';
import https from 'https';
import express from 'express';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "../frontend/dist")));

const key = fs.readFileSync(path.join(__dirname, 'certs', 'cert.key'));
const cert = fs.readFileSync(path.join(__dirname, 'certs', 'cert.crt'));
const server = https.createServer({ key, cert }, app);

const io = new SocketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const offers = [];
const connectedSockets = [];

io.on("connection", socket => {
  const userName = socket.handshake.auth.userName;
  const password = socket.handshake.auth.password;

  console.log("Client connected:", userName);


  if (password !== "x") {
    socket.disconnect(true);
    return;
  }

  connectedSockets.push({ socketId: socket.id, userName });

  socket.emit("availableOffers", offers);


  socket.on("newOffer", offer => {
    offers.push({
      offererUserName: userName,
      offer,
      offerIceCandidates: [],
      answererUserName: null,
      answer: null,
      answererIceCandidates: []
    });
    console.log("New offer received from", userName);
    console.log("Broadcasting offers:", offers);

    io.emit("availableOffers", offers);
  });

  socket.on("newAnswer", (offerObj, ack) => {
    const socketToAnswer = connectedSockets.find(s => s.userName === offerObj.offererUserName);
    const offerToUpdate = offers.find(o => o.offererUserName === offerObj.offererUserName);

    if (!socketToAnswer || !offerToUpdate) return;

    ack(offerToUpdate.offerIceCandidates);
    offerToUpdate.answer = offerObj.answer;
    offerToUpdate.answererUserName = userName;

    socket.to(socketToAnswer.socketId).emit("answerResponse", offerToUpdate);
  });

  socket.on("sendIceCandidateToSignalingServer", obj => {
    const { didIOffer, iceUserName, iceCandidate } = obj;
    let offerObj;

    if (didIOffer) {
      offerObj = offers.find(o => o.offererUserName === iceUserName);
      offerObj?.offerIceCandidates.push(iceCandidate);
      const recipient = connectedSockets.find(s => s.userName === offerObj?.answererUserName);
      if (recipient) {
        socket.to(recipient.socketId).emit("receivedIceCandidateFromServer", iceCandidate);
      }
    } else {
      offerObj = offers.find(o => o.answererUserName === iceUserName);
      offerObj?.answererIceCandidates.push(iceCandidate);
      const recipient = connectedSockets.find(s => s.userName === offerObj?.offererUserName);
      if (recipient) {
        socket.to(recipient.socketId).emit("receivedIceCandidateFromServer", iceCandidate);
      }
    }
  });
});

server.listen(8181, () => console.log("Server running on https://localhost:8181"));
