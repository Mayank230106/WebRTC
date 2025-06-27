import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Container,
  Fade,
} from '@mui/material';
import {
  VideoCall,
  Phone,
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  CallEnd,
  PhoneDisabled,
} from '@mui/icons-material';
import { socket } from '../socket/socketClient.js';
import Layout from './Layout.jsx';

export default function VideoChat() {
  const localRef = useRef();
  const remoteRef = useRef();
  const pcRef = useRef(null);

  const [offers, setOffers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  const userName = useRef('User-' + Math.floor(Math.random() * 100000));

  useEffect(() => {
    socket.auth = { userName: userName.current, password: 'x' };
    socket.connect();

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('availableOffers', setOffers);
    socket.on('newOfferAwaiting', setOffers);

    socket.on('answerResponse', async (offerObj) => {
      await pcRef.current.setRemoteDescription(offerObj.answer);
      setIsInCall(true);
    });

    socket.on('receivedIceCandidateFromServer', async (candidate) => {
      try {
        await pcRef.current.addIceCandidate(candidate);
      } catch (e) {
        console.error(e);
      }
    });

    return () => socket.disconnect();
  }, []);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      localRef.current.srcObject = stream;
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  };

  // Start local camera on component mount
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        await startStream();
      } catch (error) {
        console.error('Failed to initialize camera:', error);
      }
    };
    
    initializeCamera();
    
    // Cleanup on unmount
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
      remoteRef.current.srcObject = e.streams[0];
    };

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    return pc;
  };

  const call = async () => {
    setIsLoading(true);
    try {
      // Use existing stream if available, otherwise start new one
      const stream = localStream || await startStream();
      const pc = setupPeer(stream);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('newOffer', offer);
    } catch (error) {
      console.error('Error starting call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const answer = async (offerObj) => {
    setIsLoading(true);
    try {
      // Use existing stream if available, otherwise start new one
      const stream = localStream || await startStream();
      const pc = setupPeer(stream, offerObj);
      await pc.setRemoteDescription(offerObj.offer);
      const answerSDP = await pc.createAnswer();
      await pc.setLocalDescription(answerSDP);
      offerObj.answer = answerSDP;
      const existingIce = await socket.emitWithAck('newAnswer', offerObj);
      existingIce.forEach((c) => pc.addIceCandidate(c));
      setIsInCall(true);
    } catch (error) {
      console.error('Error answering call:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hangUp = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    // Don't stop local stream - keep camera running
    if (localRef.current) {
      // Keep local video running
    }
    if (remoteRef.current) remoteRef.current.srcObject = null;
    setIsInCall(false);
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  return (
    <Layout title="StreamConnect">
      {/* Video Container */}
      <Box sx={{ position: 'relative', width: '100%', height: 'calc(100vh - 120px)' }}>
        {/* Remote Video (Main) */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#111111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {!isInCall && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#111111',
              }}
            >
              <VideoCall sx={{ fontSize: 80, color: '#333333', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#666666', fontWeight: 400 }}>
                No active call
              </Typography>
            </Box>
          )}
        </Box>

        {/* Local Video (Picture-in-Picture) */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 280,
            height: 158,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: '#111111',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 10,
          }}
        >
          <video
            ref={localRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          {!isVideoEnabled && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#111111',
              }}
            >
              <VideocamOff sx={{ fontSize: 32, color: '#666666' }} />
            </Box>
          )}
        </Box>

        {/* User Info */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            left: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px)',
            px: 2,
            py: 1,
            borderRadius: 1,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Typography variant="caption" sx={{ color: '#888888' }}>
            {userName.current}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: isConnected ? '#00ff88' : '#ff4444',
              }}
            />
            <Typography variant="caption" sx={{ color: '#ffffff', fontSize: '0.7rem' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Typography>
          </Box>
        </Box>

        {/* Bottom Controls */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(20px)',
            px: 3,
            py: 2,
            borderRadius: 3,
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Start Call Button */}
          {!isInCall && (
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              onClick={call}
              disabled={!isConnected || isLoading}
              sx={{
                backgroundColor: '#ffffff',
                color: '#000000',
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 500,
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                },
                '&:disabled': {
                  backgroundColor: '#333333',
                  color: '#666666',
                },
              }}
            >
              {isLoading ? 'Starting...' : 'Start Call'}
            </Button>
          )}

          {/* Call Controls - Always show camera/mic controls when we have a stream */}
          {localStream && (
            <>
              <IconButton
                onClick={toggleVideo}
                sx={{
                  backgroundColor: isVideoEnabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 68, 68, 0.2)',
                  color: isVideoEnabled ? '#ffffff' : '#ff4444',
                  width: 48,
                  height: 48,
                  '&:hover': {
                    backgroundColor: isVideoEnabled ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 68, 68, 0.3)',
                  },
                }}
              >
                {isVideoEnabled ? <Videocam /> : <VideocamOff />}
              </IconButton>

              <IconButton
                onClick={toggleAudio}
                sx={{
                  backgroundColor: isAudioEnabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 68, 68, 0.2)',
                  color: isAudioEnabled ? '#ffffff' : '#ff4444',
                  width: 48,
                  height: 48,
                  '&:hover': {
                    backgroundColor: isAudioEnabled ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 68, 68, 0.3)',
                  },
                }}
              >
                {isAudioEnabled ? <Mic /> : <MicOff />}
              </IconButton>

              {isInCall && (
                <IconButton
                  onClick={hangUp}
                  sx={{
                    backgroundColor: '#ff4444',
                    color: '#ffffff',
                    width: 48,
                    height: 48,
                    '&:hover': {
                      backgroundColor: '#ff3333',
                    },
                  }}
                >
                  <CallEnd />
                </IconButton>
              )}
            </>
          )}
        </Box>

        {/* Incoming Calls */}
        {offers.length > 0 && (
          <Fade in>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(20px)',
                p: 4,
                borderRadius: 3,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center',
                minWidth: 300,
              }}
            >
              <Phone sx={{ fontSize: 48, color: '#ffffff', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#ffffff', mb: 3, fontWeight: 400 }}>
                Incoming Call
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                {offers.map((offer, index) => (
                  <React.Fragment key={index}>
                    <Button
                      variant="contained"
                      startIcon={<Phone />}
                      onClick={() => answer(offer)}
                      disabled={isLoading}
                      sx={{
                        backgroundColor: '#00ff88',
                        color: '#000000',
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        fontWeight: 500,
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: '#00dd77',
                        },
                      }}
                    >
                      Answer
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<PhoneDisabled />}
                      sx={{
                        borderColor: '#ff4444',
                        color: '#ff4444',
                        borderRadius: 2,
                        px: 3,
                        py: 1.5,
                        fontWeight: 500,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#ff3333',
                          backgroundColor: 'rgba(255, 68, 68, 0.1)',
                        },
                      }}
                    >
                      Decline
                    </Button>
                  </React.Fragment>
                ))}
              </Box>
              <Typography variant="caption" sx={{ color: '#888888', mt: 2, display: 'block' }}>
                from {offers[0]?.offererUserName}
              </Typography>
            </Box>
          </Fade>
        )}
      </Box>
    </Layout>
  );
}