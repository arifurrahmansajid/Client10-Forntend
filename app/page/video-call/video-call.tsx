/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";
import Button from "@/app/components/ui/button";
import { Context, useSocket } from "@/app/utils/context";
import { useVideoCall } from "@/app/utils/video-call-context";
import { UserType } from "@/types/object";
import Image from "next/image";
import React, { useCallback, useContext, useEffect } from "react";

export default function Room({
  roomId,
  sendRoomMessage,
  chattingWith,
}: {
  roomId: string;
  sendRoomMessage: (
    e?: React.FormEvent<HTMLFormElement>,
    roomId?: string
  ) => Promise<void>;
  chattingWith: UserType | null;
}) {
  const socket = useSocket();
  const {
    peerConnections,
    remoteStreams,
    setStreams,
    localStream,
    setStream,
    cameraFeed,
    setCameraFeed,
    setRearCameraFeed,
    audioFeed,
    setAudioFeed,
    isCaller,
    isCamerOn,
    setIsCameraOn,
    isMicOn,
    setIsMicOn,
    room,
    handleJoinRoom,
    handleDestroyPreviousConnections,
    setIsScreenShareIsOn,
  } = useVideoCall();
  const { user } = useContext(Context);

  const handleSendInvite = useCallback(() => {
    if (socket && chattingWith) {
      socket.emit("invite", user?._id, chattingWith.email);
    }
  }, [chattingWith, socket, user?._id]);

  const handleGetDummyVideoTrack = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    const dummyVideoStream = canvas.captureStream(10); // 10 fps
    return dummyVideoStream;
  }, []);

  const handleDummyStream = useCallback((): Promise<MediaStream> => {
    return new Promise((resolve) => {
      const AudioCTX = new AudioContext();
      const buffer = AudioCTX.createBuffer(1, 1, 22050); // 1 frame of silence
      const source = AudioCTX.createBufferSource();
      source.buffer = buffer;
      source.connect(AudioCTX.destination);
      source.start();

      const dst = AudioCTX.createMediaStreamDestination();
      source.connect(dst);
      const audio = dst.stream.getAudioTracks()[0];
      // Create a dummy video track (blank frame)
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      const dummyVideoStream = handleGetDummyVideoTrack();
      resolve(new MediaStream([audio, dummyVideoStream.getVideoTracks()[0]]));
    });
  }, [handleGetDummyVideoTrack]);

  const handleCreatePeerConnections = useCallback(() => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    return peer;
  }, []);

  const handleCreateOffer = useCallback(async (peer: RTCPeerConnection) => {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  }, []);

  const handleAddtrackToStream = useCallback(
    async (peer: RTCPeerConnection, stream: MediaStream) => {
      await new Promise((resolve) => {
        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });
        resolve(true);
      });
    },
    []
  );

  const handleCreateAnswer = useCallback(
    async (
      offer: RTCSessionDescriptionInit,
      peer: RTCPeerConnection,
      stream: MediaStream
    ) => {
      await peer.setRemoteDescription(offer);
      await handleAddtrackToStream(peer, stream);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      return answer;
    },
    [handleAddtrackToStream]
  );

  const handlePeerExists = useCallback(
    (socketId: string) => {
      return peerConnections.current?.find((peer) => peer.socketId === socketId);
    },
    [peerConnections]
  );

  const handleCall = useCallback(
    async (socketId: string, stream: MediaStream) => {
      if (handlePeerExists(socketId)) return;

      const peer = handleCreatePeerConnections();
      peerConnections.current.push({ peer, socketId });
      peer.addEventListener("track", (e) => {
        console.log(e.streams);
        const streamExists = remoteStreams.current.find(
          (stream) => stream.socketId === socketId
        );
        if (!streamExists) {
          remoteStreams.current.push({
            stream: e.streams[0],
            socketId: socketId,
          });
          setStreams([...remoteStreams.current]);
        }
      });
      peer.addEventListener("icecandidate", (e) => {
        if (socket) {
          socket.emit("ice-candiate", e.candidate, socketId);
        }
      });

      if (!stream) return;
      await handleAddtrackToStream(peer, stream);
      const offer = await handleCreateOffer(peer);
      if (socket) {
        socket.emit("seding-offer", { offer, sendTo: socketId });
      }
    },
    [
      handleAddtrackToStream,
      handleCreateOffer,
      handleCreatePeerConnections,
      handlePeerExists,
      peerConnections,
      remoteStreams,
      setStreams,
      socket,
    ]
  );

  const handleAcceptAnswer = useCallback(
    async (socketId: string, answer: RTCSessionDescriptionInit) => {
      const peer = handlePeerExists(socketId);
      if (peer && !peer.remoteDescription) {
        console.log("Accepting Answer");
        peer.remoteDescription = true;
        await peer.peer.setRemoteDescription(answer);
      }
    },
    [handlePeerExists]
  );

  const handleTurnOnCamera = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    setIsScreenShareIsOn(false);
    const videoTracks = stream.getVideoTracks()[0];
    if (!localStream.current) {
      const dummyStream = await handleDummyStream();
      const newStream = new MediaStream([
        dummyStream.getAudioTracks()[0],
        videoTracks,
      ]);
      localStream.current = newStream;
      setStream(newStream);
      setCameraFeed(videoTracks);
      setIsCameraOn(true);
      await handleJoinRoom(roomId);
      if (!room) {
        void sendRoomMessage(undefined, roomId);
      }
      return;
    }
    const dummStream = await handleDummyStream();
    const dummyVideoTrack = dummStream.getVideoTracks()[0];
    peerConnections.current.forEach(async (peer) => {
      const sender = peer.peer.getSenders();
      const videoSender = sender.find(
        (sender) => sender.track?.kind === videoTracks.kind
      );
      console.log(videoSender);
      if (videoSender) {
        if (cameraFeed) {
          await videoSender.replaceTrack(dummyVideoTrack);
        } else {
          await videoSender.replaceTrack(videoTracks);
        }
      }
    });
    if (cameraFeed) {
      localStream.current?.getVideoTracks()[0].stop();
      localStream.current?.removeTrack(localStream.current.getVideoTracks()[0]);
      stream.getVideoTracks()[0].stop();
      localStream.current?.addTrack(dummyVideoTrack);
      setStream(new MediaStream(localStream.current.getTracks()));
      setIsCameraOn(false);
      setRearCameraFeed(null);
      setCameraFeed(null);
    } else {
      localStream.current?.removeTrack(localStream.current.getVideoTracks()[0]);
      localStream.current?.addTrack(videoTracks);
      setStream(new MediaStream(localStream.current.getTracks()));
      setCameraFeed(videoTracks);
      setRearCameraFeed(null);
      setIsCameraOn(true);
    }
  }, [
    cameraFeed,
    handleDummyStream,
    handleJoinRoom,
    localStream,
    peerConnections,
    room,
    roomId,
    sendRoomMessage,
    setCameraFeed,
    setIsCameraOn,
    setIsScreenShareIsOn,
    setRearCameraFeed,
    setStream,
  ]);

  const handleToggleMic = useCallback(async () => {
    const audio = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true,
    });
    const dummyStream = await handleDummyStream();
    const audioTrack = audio.getAudioTracks()[0];
    if (!localStream.current) {
      console.log("No stream");
      const newStream = new MediaStream([
        audioTrack,
        dummyStream.getVideoTracks()[0],
      ]);
      setAudioFeed(audioTrack);
      localStream.current = newStream;
      setStream(newStream);
      setIsMicOn(true);
      await handleJoinRoom(roomId);
      if (!room) {
        void sendRoomMessage(undefined, roomId);
      }
      return;
    }
    peerConnections.current.forEach(async (peer) => {
      const audioSender = peer.peer
        .getSenders()
        .find((sender) => sender.track?.kind === audioTrack.kind);
      if (!audioSender) return peer.peer.addTrack(audioTrack);
      if (audioFeed) {
        await audioSender.replaceTrack(dummyStream.getAudioTracks()[0]);
      } else {
        await audioSender.replaceTrack(audioTrack);
      }
    });
    if (audioFeed) {
      localStream.current.getAudioTracks()[0].stop();
      audio.getAudioTracks()[0].stop();
      localStream.current.removeTrack(localStream.current.getAudioTracks()[0]);
      localStream.current.addTrack(dummyStream.getAudioTracks()[0]);
      setStream(new MediaStream(localStream.current.getTracks()));
      setAudioFeed(null);
      setIsMicOn(false);
    } else {
      localStream.current.removeTrack(localStream.current.getAudioTracks()[0]);
      localStream.current.addTrack(audioTrack);
      setStream(new MediaStream(localStream.current.getTracks()));
      setAudioFeed(audioTrack);
      setIsMicOn(true);
    }
  }, [
    audioFeed,
    handleDummyStream,
    handleJoinRoom,
    localStream,
    peerConnections,
    room,
    roomId,
    sendRoomMessage,
    setAudioFeed,
    setIsMicOn,
    setStream,
  ]);

  const handleScreenShare = async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    setIsScreenShareIsOn(true);
    if (!localStream.current) {
      const dummyStream = await handleDummyStream();
      const newStream = new MediaStream([
        dummyStream.getAudioTracks()[0],
        screenStream.getVideoTracks()[0],
      ]);
      localStream.current = newStream;
      setStream(newStream);
      await handleJoinRoom(roomId);
      if (!room) {
        void sendRoomMessage(undefined, roomId);
      }
      return;
    }
    const screenVideoTrack = screenStream.getVideoTracks()[0];
    peerConnections.current.forEach(async (peer) => {
      const sender = peer.peer.getSenders();
      const videoSender = sender.find(
        (sender) => sender.track?.kind === screenVideoTrack.kind
      );
      if (videoSender) {
        await videoSender.replaceTrack(screenVideoTrack);
      }
      localStream.current?.removeTrack(localStream.current.getVideoTracks()[0]);
      localStream.current?.addTrack(screenVideoTrack);
      setStream(new MediaStream(localStream.current!.getTracks()));
    });
    screenVideoTrack.onended = () => {
      peerConnections.current.forEach(async (peer) => {
        const sender = peer.peer.getSenders();
        const videoSender = sender.find(
          (sender) => sender.track?.kind === screenVideoTrack.kind
        );
        if (videoSender) {
          if (cameraFeed) {
            await videoSender.replaceTrack(cameraFeed);
            localStream.current?.removeTrack(
              localStream.current.getVideoTracks()[0]
            );
            localStream.current?.addTrack(cameraFeed);
            setStream(new MediaStream(localStream.current!.getTracks()));
          } else {
            const dummyStream = await handleDummyStream();
            const dummyVideoTrack = dummyStream.getVideoTracks()[0];
            await videoSender.replaceTrack(dummyVideoTrack);
            localStream.current?.removeTrack(
              localStream.current.getVideoTracks()[0]
            );
            localStream.current?.addTrack(dummyVideoTrack);
            setStream(new MediaStream(localStream.current!.getTracks()));
          }
        }
      });
    };
  };

  useEffect(() => {
    if (!socket) return;
    const handleCallAllUsers = async (users: string[]) => {
      if (!users.length) return;
      isCaller.current = true;
      const stream = await handleDummyStream();
      if (!localStream.current) localStream.current = stream;
      setStream(localStream.current);
      users.forEach(async (userId) => {
        await handleCall(userId, localStream.current!);
      });
    };
    const handleOfferReceived = async ({
      offer,
      sentBy,
    }: {
      offer: RTCSessionDescriptionInit;
      sentBy: string;
    }) => {
      if (handlePeerExists(sentBy)) return;
      const stream = await handleDummyStream();
      if (!localStream.current) {
        console.log("No stream found, creating a dummy stream");
        localStream.current = stream;
      }
      setStream(localStream.current);
      const peer = handleCreatePeerConnections();
      peerConnections.current.push({ peer, socketId: sentBy });
      peer.addEventListener("track", (e) => {
        console.log(e.streams);
        const streamExists = remoteStreams.current.find(
          (stream) => stream.socketId === sentBy
        );
        if (!streamExists) {
          remoteStreams.current.push({
            stream: e.streams[0],
            socketId: sentBy,
          });
          setStreams([...remoteStreams.current]);
        }
      });
      peer.addEventListener("icecandidate", (e) => {
        if (socket) {
          socket.emit("ice-candiate", e.candidate, sentBy);
        }
      });

      const answer = await handleCreateAnswer(offer, peer, localStream.current);

      if (socket) {
        socket.emit("sending-answer", { answer, sentTo: sentBy });
      }
    };
    const handleAddIceCandidate = async (
      iceCandiate: RTCIceCandidate | null,
      socketId: string
    ) => {
      const peer = handlePeerExists(socketId);
      if (peer) {
        if (iceCandiate) await peer.peer.addIceCandidate(iceCandiate);
      }
    };

    const handleRemoveUser = (socketId: string) => {
      peerConnections.current = peerConnections.current.filter(
        (peer) => peer.socketId !== socketId
      );
      remoteStreams.current = remoteStreams.current.filter(
        (stream) => stream.socketId !== socketId
      );
      if (peerConnections.current.length === 0) {
        void handleDestroyPreviousConnections(true);
      }
      setStreams([...remoteStreams.current]);
    };
    socket.on("all-users", handleCallAllUsers);
    socket.on("offer-received", handleOfferReceived);

    socket.on("ice-candidate", handleAddIceCandidate);
    socket.on("user-left", handleRemoveUser);
    return () => {
      if (socket) {
        socket.off("all-users", handleCallAllUsers);
        socket.off("offer-received", handleOfferReceived);
        socket.off("user-left", handleRemoveUser);
        socket.off("ice-candidate", handleAddIceCandidate);
      }
    };
  }, [
    handleAcceptAnswer,
    handleAddtrackToStream,
    handleCall,
    handleCreateAnswer,
    handleCreatePeerConnections,
    handleDestroyPreviousConnections,
    handleDummyStream,
    handlePeerExists,
    isCaller,
    localStream,
    peerConnections,
    remoteStreams,
    setStream,
    setStreams,
    socket,
  ]);

  useEffect(() => {
    if (socket) socket.on("answer-received", handleAcceptAnswer);
    return () => {
      if (socket) socket.off("answer-received", handleAcceptAnswer);
    };
  }, [handleAcceptAnswer, socket]);

  return (
    <section className="!px-6 border-2 lg:border-l-0 h-auto flex items-center justify-center grow lg:grow-0 p-4 lg:p-0">
      <div className="flex items-center justify-center gap-x-6 w-auto">
        <Button onClick={handleSendInvite} disabled={!chattingWith}>
          <Image
            src="/icons/invite.png"
            width={48}
            height={48}
            alt="Invite User"
            priority
          />
        </Button>
        <Button onClick={handleTurnOnCamera}>
          {isCamerOn ? (
            <Image
              src="/icons/camera-off.png"
              alt="turn on camera"
              width={48}
              height={48}
            />
          ) : (
            <Image
              src="/icons/camera-on.png"
              alt="turn on camera"
              width={48}
              height={48}
            />
          )}
        </Button>
        <Button onClick={handleToggleMic}>
          {isMicOn ? (
            <Image
              src="/icons/unmute.png"
              width={48}
              height={48}
              alt="Mute Mic"
            />
          ) : (
            <Image
              src="/icons/mute.png"
              width={48}
              height={48}
              alt="unmute mic"
            />
          )}
        </Button>
        <Button onClick={handleScreenShare}>
          <Image
            src="/icons/screen-share.png"
            width={48}
            height={48}
            alt="Share Screen"
          />
        </Button>
        <Button
          onClick={() => {
            if (peerConnections.current.length) {
              void handleDestroyPreviousConnections();
            } else {
              void handleDestroyPreviousConnections(true);
            }
          }}
        >
          <Image
            src="/icons/hangup.png"
            width={48}
            height={48}
            alt="leave Video Call"
          />
        </Button>
      </div>
    </section>
  );
}
