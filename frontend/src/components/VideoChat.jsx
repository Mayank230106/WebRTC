import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../socket/socketClient.js';

export default function VideoChat() {
  const localRef = useRef();
  const remoteRef = useRef();
  const pcRef = useRef(null);

  const [offers, setOffers] = useState([]);
  const userName = useRef('User-' + Math.floor(Math.random() * 100000));

  useEffect(() => {
    socket.auth = { userName: userName.current, password: 'x' };
    socket.connect();

    socket.on("connect", () => {
    console.log("Connected to signaling server");
    });


    socket.on('availableOffers', setOffers);
    socket.on('newOfferAwaiting', setOffers);

    socket.on('answerResponse', async offerObj => {
      await pcRef.current.setRemoteDescription(offerObj.answer);
    });

    socket.on('receivedIceCandidateFromServer', async candidate => {
      try {
        await pcRef.current.addIceCandidate(candidate);
      } catch (e) { console.error(e); }
    });

    return () => socket.disconnect();
  }, []);

  const startStream = async () => {
    const st = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    localRef.current.srcObject = st;
    return st;
  };

  const setupPeer = (stream, offerObj = null) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pcRef.current = pc;

    pc.onicecandidate = e => {
      if (e.candidate) {
        socket.emit('sendIceCandidateToSignalingServer', {
          iceUserName: userName.current,
          iceCandidate: e.candidate,
          didIOffer: !offerObj
        });
      }
    };

    pc.ontrack = e => {
      remoteRef.current.srcObject = e.streams[0];
    };

    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    return pc;
  };

  const call = async () => {
    console.log("Call button clicked");
    
    const stream = await startStream();
    const pc = setupPeer(stream);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('newOffer', offer);
  };

  const answer = async offerObj => {
    const stream = await startStream();
    const pc = setupPeer(stream, offerObj);

    await pc.setRemoteDescription(offerObj.offer);
    const answerSDP = await pc.createAnswer();
    await pc.setLocalDescription(answerSDP);

    offerObj.answer = answerSDP;
    const existingIce = await socket.emitWithAck('newAnswer', offerObj);
    existingIce.forEach(c => pc.addIceCandidate(c));
  };

  return (
    <div className="text-center">
      <h4>Your ID: <b>{userName.current}</b></h4>
      <button className="btn btn-primary m-2" onClick={call}>Call</button>
      <div className="mt-3">
        {offers.map((o, i) => (
          <button key={i} className="btn btn-success m-1" onClick={() => answer(o)}>
            Answer {o.offererUserName}
          </button>
        ))}
      </div>
      <div className="mt-4 d-flex justify-content-center gap-3">
        <video ref={localRef} autoPlay playsInline muted width="300" />
        <video ref={remoteRef} autoPlay playsInline width="300" />
      </div>
    </div>
  );
}
