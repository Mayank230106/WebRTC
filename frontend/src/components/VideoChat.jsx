import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Fade,
} from '@mui/material';
import {
  VideoCall, Phone, Videocam, VideocamOff, Mic, MicOff, CallEnd, PhoneDisabled
} from '@mui/icons-material';
import { socket } from '../socket/socketClient.js';
import Layout from './Layout.jsx';

export default function VideoChat() {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const pcRef = useRef(null);
  const userName = useRef('User-' + Math.floor(Math.random() * 100000));

  const [offers, setOffers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  // --- Stream Handling ---
  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      localRef.current.srcObject = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Media access error:', error);
      throw error;
    }
  };

  // --- Peer Setup ---
  const setupPeer = (stream, offerObj = null) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('sendIceCandidateToSignalingServer', {
          iceUserName: userName.current,
          iceCandidate: e.candidate,
          didIOffer: !offerObj,
        });
      }
    };

    pc.ontrack = (e) => {
      if (remoteRef.current) {
        remoteRef.current.srcObject = e.streams[0];
      }
    };

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    return pc;
  };

  // --- Call Handlers ---
  const call = async () => {
    setIsLoading(true);
    try {
      const stream = localStream || await startStream();
      const pc = setupPeer(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('newOffer', offer);
    } catch (err) {
      console.error('Call initiation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const answer = async (offerObj) => {
    setIsLoading(true);
    try {
      const stream = localStream || await startStream();
      const pc = setupPeer(stream, offerObj);
      await pc.setRemoteDescription(offerObj.offer);
      const answerSDP = await pc.createAnswer();
      await pc.setLocalDescription(answerSDP);
      offerObj.answer = answerSDP;

      const existingIce = await socket.emitWithAck('newAnswer', offerObj);
      existingIce.forEach((ice) => pc.addIceCandidate(ice));
      setIsInCall(true);
    } catch (err) {
      console.error('Answering error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const hangUp = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteRef.current) remoteRef.current.srcObject = null;
    setIsInCall(false);
  };

  const declineCall = (offerIndex) => {
    setOffers((prev) => prev.filter((_, i) => i !== offerIndex));
  };

  // --- Toggle Audio/Video ---
  const toggleVideo = () => {
    const track = localStream?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsVideoEnabled(track.enabled);
    }
  };

  const toggleAudio = () => {
    const track = localStream?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsAudioEnabled(track.enabled);
    }
  };

  // --- Socket Lifecycle ---
  useEffect(() => {
    socket.auth = { userName: userName.current, password: 'x' };
    socket.connect();

    const handleAnswer = async (offerObj) => {
      try {
        await pcRef.current.setRemoteDescription(offerObj.answer);
        setIsInCall(true);
      } catch (e) {
        console.error('Remote description error:', e);
      }
    };

    const handleCandidate = async (candidate) => {
      try {
        await pcRef.current?.addIceCandidate(candidate);
      } catch (e) {
        console.error('Add ICE error:', e);
      }
    };

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('availableOffers', setOffers);
    socket.on('newOfferAwaiting', setOffers);
    socket.on('answerResponse', handleAnswer);
    socket.on('receivedIceCandidateFromServer', handleCandidate);

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('availableOffers');
      socket.off('newOfferAwaiting');
      socket.off('answerResponse', handleAnswer);
      socket.off('receivedIceCandidateFromServer', handleCandidate);
      socket.disconnect();
    };
  }, []);

  // --- Auto-start camera on mount ---
  useEffect(() => {
    const init = async () => {
      try {
        await startStream();
      } catch (_) {}
    };
    init();

    return () => {
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // --- Render ---
  return (
    <Layout title="StreamConnect">
      <Box sx={{ position: 'relative', width: '100%', height: 'calc(100vh - 120px)' }}>
        {/* Remote Stream */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#111'
        }}>
          <video ref={remoteRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {!isInCall && (
            <Box sx={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#111'
            }}>
              <VideoCall sx={{ fontSize: 80, color: '#333', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#666' }}>No active call</Typography>
            </Box>
          )}
        </Box>

        {/* Local Stream */}
        <Box sx={{
          position: 'absolute', top: 20, right: 20, width: 280, height: 158,
          borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#111', zIndex: 10
        }}>
          <video ref={localRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {!isVideoEnabled && (
            <Box sx={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111'
            }}>
              <VideocamOff sx={{ fontSize: 32, color: '#666' }} />
            </Box>
          )}
        </Box>

        {/* Status & Controls */}
        <Box sx={{
          position: 'absolute', top: 20, left: 20, p: 1.5, px: 2,
          backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 1, border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)'
        }}>
          <Typography variant="caption" sx={{ color: '#888' }}>{userName.current}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Box sx={{
              width: 6, height: 6, borderRadius: '50%',
              backgroundColor: isConnected ? '#00ff88' : '#ff4444'
            }} />
            <Typography variant="caption" sx={{ color: '#fff', fontSize: '0.7rem' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Typography>
          </Box>
        </Box>

        {/* Call Controls */}
        <Box sx={{
          position: 'absolute', bottom: 30, left: '50%',
          transform: 'translateX(-50%)', display: 'flex', gap: 2,
          backgroundColor: 'rgba(0,0,0,0.8)', px: 3, py: 2,
          borderRadius: 3, backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {!isInCall && (
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              onClick={call}
              disabled={!isConnected || isLoading}
              sx={{
                backgroundColor: '#fff', color: '#000',
                px: 3, py: 1, borderRadius: 2, fontWeight: 500,
                '&:hover': { backgroundColor: '#eee' },
                '&:disabled': { backgroundColor: '#333', color: '#666' }
              }}
            >
              {isLoading ? 'Starting...' : 'Start Call'}
            </Button>
          )}
          {localStream && (
            <>
              <IconButton onClick={toggleVideo} sx={{
                backgroundColor: isVideoEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(255,68,68,0.2)',
                color: isVideoEnabled ? '#fff' : '#ff4444'
              }}>
                {isVideoEnabled ? <Videocam /> : <VideocamOff />}
              </IconButton>
              <IconButton onClick={toggleAudio} sx={{
                backgroundColor: isAudioEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(255,68,68,0.2)',
                color: isAudioEnabled ? '#fff' : '#ff4444'
              }}>
                {isAudioEnabled ? <Mic /> : <MicOff />}
              </IconButton>
              {isInCall && (
                <IconButton onClick={hangUp} sx={{ backgroundColor: '#ff4444', color: '#fff' }}>
                  <CallEnd />
                </IconButton>
              )}
            </>
          )}
        </Box>

        {/* Incoming Offers */}
        {offers.length > 0 && (
          <Fade in>
            <Box sx={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)',
              p: 4, borderRadius: 3, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center'
            }}>
              <Phone sx={{ fontSize: 48, color: '#fff', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
                Incoming Call
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                {offers.map((offer, index) => (
                  <React.Fragment key={index}>
                    <Button
                      variant="contained"
                      onClick={() => answer(offer)}
                      startIcon={<Phone />}
                      disabled={isLoading}
                      sx={{
                        backgroundColor: '#00ff88', color: '#000', fontWeight: 500,
                        px: 3, py: 1.5, borderRadius: 2,
                        '&:hover': { backgroundColor: '#00dd77' }
                      }}
                    >
                      Answer
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<PhoneDisabled />}
                      onClick={() => declineCall(index)}
                      sx={{
                        borderColor: '#ff4444', color: '#ff4444', fontWeight: 500,
                        px: 3, py: 1.5, borderRadius: 2,
                        '&:hover': { backgroundColor: 'rgba(255,68,68,0.1)', borderColor: '#ff3333' }
                      }}
                    >
                      Decline
                    </Button>
                  </React.Fragment>
                ))}
              </Box>
              <Typography variant="caption" sx={{ color: '#888', mt: 2 }}>
                from {offers[0]?.offererUserName}
              </Typography>
            </Box>
          </Fade>
        )}
      </Box>
    </Layout>
  );
}
