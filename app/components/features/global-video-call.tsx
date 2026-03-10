"use client";
import { useVideoCall } from "@/app/utils/video-call-context";
import React from "react";
import DraggableVideo from "./draggable-video";

export default function GlobalVideoCall() {
  const { stream, streams, isScreenShareIsOn } = useVideoCall();
  return (
    <>
      {stream ? (
        <DraggableVideo
          stream={stream}
          className={`w-full h-full object-fill ${
            isScreenShareIsOn ? "" : "rotate-y-180"
          } `}
          muteAudio={true}
        />
      ) : null}
      {streams.map((remoteStream) => {
        return (
          <DraggableVideo
            stream={remoteStream.stream}
            key={remoteStream.socketId}
            className="!w-full !h-full !object-fill"
            muteAudio={false}
          />
        );
      })}
    </>
  );
}
