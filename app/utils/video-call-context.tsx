"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSocket } from "./context";
import { UserType } from "@/types/object";
import Button from "../components/ui/button";

interface Peers {
  peer: RTCPeerConnection;
  socketId: string;
  remoteDescription?: boolean;
}
interface RemoteStreams {
  stream: MediaStream;
  socketId: string;
}

const VideoCallProvider = createContext<{
  room: string;
  setRoom: React.Dispatch<React.SetStateAction<string>>;
  peerConnections: React.RefObject<Peers[]>;
  remoteStreams: React.RefObject<RemoteStreams[]>;
  streams: RemoteStreams[];
  setStreams: React.Dispatch<React.SetStateAction<RemoteStreams[]>>;
  localStream: React.RefObject<MediaStream | null>;
  stream: MediaStream | null;
  setStream: React.Dispatch<React.SetStateAction<MediaStream | null>>;
  cameraFeed: MediaStreamTrack | null;
  setCameraFeed: React.Dispatch<React.SetStateAction<MediaStreamTrack | null>>;
  rearCameraFeed: MediaStreamTrack | null;
  setRearCameraFeed: React.Dispatch<
    React.SetStateAction<MediaStreamTrack | null>
  >;
  audioFeed: MediaStreamTrack | null;
  setAudioFeed: React.Dispatch<React.SetStateAction<MediaStreamTrack | null>>;
  isCaller: React.RefObject<boolean>;
  isCamerOn: boolean;
  setIsCameraOn: React.Dispatch<React.SetStateAction<boolean>>;
  isMicOn: boolean;
  setIsMicOn: React.Dispatch<React.SetStateAction<boolean>>;
  isRearCameraOn: boolean;
  setIsRearCameraOn: React.Dispatch<React.SetStateAction<boolean>>;
  handleJoinRoom: (roomId: string) => Promise<void>;
  handleDestroyPreviousConnections: (forceClear?: boolean) => Promise<boolean>;
  isScreenShareIsOn: boolean;
  setIsScreenShareIsOn: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  room: "",
  setRoom: () => {},
  peerConnections: { current: [] },
  remoteStreams: { current: [] },
  streams: [],
  setStreams: () => {},
  localStream: { current: null },
  stream: null,
  setStream: () => {},
  cameraFeed: null,
  setCameraFeed: () => {},
  rearCameraFeed: null,
  setRearCameraFeed: () => {},
  audioFeed: null,
  setAudioFeed: () => {},
  isCaller: { current: false },
  isCamerOn: false,
  setIsCameraOn: () => {},
  isMicOn: false,
  setIsMicOn: () => {},
  isRearCameraOn: false,
  setIsRearCameraOn: () => {},
  handleJoinRoom: async () => {},
  handleDestroyPreviousConnections: async (): Promise<boolean> => {
    return await new Promise((resolve) => {
      // some asynchronous code here
      resolve(false);
    });
  },
  isScreenShareIsOn: false,
  setIsScreenShareIsOn: () => {},
});

export default function VideoCallContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const peerConnections = useRef<Peers[]>([]);
  const remoteStreams = useRef<RemoteStreams[]>([]);
  const [streams, setStreams] = useState<RemoteStreams[]>([]);
  const localStream = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<null | MediaStream>(null);
  const [cameraFeed, setCameraFeed] = useState<null | MediaStreamTrack>(null);
  const [rearCameraFeed, setRearCameraFeed] = useState<null | MediaStreamTrack>(
    null
  );
  const [audioFeed, setAudioFeed] = useState<null | MediaStreamTrack>(null);
  const isCaller = useRef(false);
  const [isCamerOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isRearCameraOn, setIsRearCameraOn] = useState(false);
  const [isScreenShareIsOn, setIsScreenShareIsOn] = useState(false);
  const [room, setRoom] = useState("");
  const [invite, setInvite] = useState({
    show: false,
    message: "",
    room: "",
  });
  const socket = useSocket();

  const handleDestroyPreviousConnections = useCallback(
    async (forceClear?: boolean): Promise<boolean> => {
      if (forceClear) {
        if (peerConnections.current.length) {
          peerConnections.current.forEach((peer) => {
            peer.peer.close();
          });
          peerConnections.current = [];
          remoteStreams.current = [];
        }
        localStream.current?.getTracks().forEach((track) => {
          track.stop();
        });
        stream?.getTracks().forEach((track) => {
          track.stop();
        });
        setStream(null);
        localStream.current = null;
        setStreams([]);
        setAudioFeed(null);
        setCameraFeed(null);
        setIsCameraOn(false);
        setIsMicOn(false);
        setRoom("");
        socket?.emit("user-left", room);
        return true;
      }
      if (!forceClear && !peerConnections.current.length) return true;
      return await new Promise((resolve) => {
        peerConnections.current.forEach((peer) => {
          peer.peer.close();
        });
        peerConnections.current = [];
        remoteStreams.current = [];
        localStream.current?.getTracks().forEach((track) => {
          track.stop();
        });
        stream?.getTracks().forEach((track) => {
          track.stop();
        });
        setStream(null);
        localStream.current = null;
        setStreams([]);
        setAudioFeed(null);
        setCameraFeed(null);
        setIsCameraOn(false);
        setIsMicOn(false);
        setRoom("");
        socket?.emit("user-left", room);
        resolve(true);
      });
    },
    [room, socket, stream]
  );

  const handleJoinRoom = async (roomId: string) => {
    await handleDestroyPreviousConnections(false);
    setRoom(roomId);
    socket?.emit("all-users", roomId);
  };

  const handleAcceptInvite = async () => {
    await handleDestroyPreviousConnections();
    setRoom(invite.room);
    socket?.emit("join-room", invite.room);
    socket?.emit("all-users", invite.room);
    setInvite({
      show: false,
      message: "",
      room: "",
    });
  };

  useEffect(() => {
    const handleShowInvite = (roomId: string, caller: UserType) => {
      setInvite({
        show: true,
        message: `${caller.name} has invited you to video call`,
        room: roomId,
      });
    };
    if (socket) {
      socket.on("invite", handleShowInvite);
    }
    return () => {
      if (socket) {
        socket.off("invite", handleShowInvite);
      }
    };
  }, [socket]);

  return (
    <VideoCallProvider.Provider
      value={{
        room,
        setRoom,
        peerConnections,
        remoteStreams,
        streams,
        setStreams,
        localStream,
        stream,
        setStream,
        cameraFeed,
        setCameraFeed,
        rearCameraFeed,
        setRearCameraFeed,
        audioFeed,
        setAudioFeed,
        isCaller,
        isCamerOn,
        setIsCameraOn,
        isMicOn,
        setIsMicOn,
        isRearCameraOn,
        setIsRearCameraOn,
        handleJoinRoom,
        handleDestroyPreviousConnections,
        isScreenShareIsOn,
        setIsScreenShareIsOn,
      }}
    >
      {invite.show && (
        <div className="absolute bottom-1 right-0 border p-3">
          <p>{invite.message}</p>
          <div className="flex items-center gap-x-6">
            <Button
              onClick={() => {
                void handleAcceptInvite();
              }}
            >
              Accept
            </Button>
            <Button
              onClick={() => {
                setInvite({
                  show: false,
                  message: "",
                  room: "",
                });
              }}
            >
              Decline
            </Button>
          </div>
        </div>
      )}
      {children}
    </VideoCallProvider.Provider>
  );
}

export const useVideoCall = () => {
  return useContext(VideoCallProvider);
};
