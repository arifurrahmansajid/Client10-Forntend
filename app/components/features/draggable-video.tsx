"use client";
import React, { useEffect, useRef } from "react";

interface DragVideo extends React.ComponentProps<"video"> {
  stream: MediaStream;
  muteAudio: boolean;
}

export default function DraggableVideo({
  stream,
  muteAudio,
  ...rest
}: DragVideo) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const initialSize = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (isDragging.current) {
        container.style.left = `${e.clientX - offset.current.x}px`;
        container.style.top = `${e.clientY - offset.current.y}px`;
      }

      if (isResizing.current) {
        const newWidth = e.clientX - container.offsetLeft;
        const newHeight = e.clientY - container.offsetTop;
        container.style.width = `${newWidth}px`;
        container.style.height = `${newHeight}px`;
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;
      document.body.style.userSelect = ""; // re-enable selection
    };

    const handleMouseDown = () => {
      document.body.style.userSelect = "none"; // disable text selection during drag/resize
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute z-50 cursor-grab active:cursor-grabbing"
      style={{ left: "0px", top: "0px", width: "500px", height: "350px" }}
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains("resize-handle")) return; // ignore drag when resizing

        const container = containerRef.current;
        if (!container) return;
        isDragging.current = true;
        offset.current = {
          x: e.clientX - container.offsetLeft,
          y: e.clientY - container.offsetTop,
        };
      }}
    >
      <video
        {...rest}
        className={rest.className}
        autoPlay
        muted
        ref={(ref) => {
          if (ref) ref.srcObject = stream;
        }}
      />
      <audio
        autoPlay
        controls
        muted={muteAudio}
        className="hidden"
        ref={(aud) => {
          if (aud) {
            aud.srcObject = new MediaStream([stream.getAudioTracks()[0]]);
          }
        }}
      />
      {/* Resize handle in bottom-right corner */}
      <div
        className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center flex-col gap-y-0.5"
        onMouseDown={(e) => {
          e.stopPropagation();
          const container = containerRef.current;
          if (!container) return;
          isResizing.current = true;
          initialSize.current = {
            width: container.offsetWidth,
            height: container.offsetHeight,
          };
        }}
      >
        <span className="inline-block border w-3 border-gray-300 -rotate-45 mr-2"></span>
        <span className="inline-block border w-1.5 border-gray-300 -rotate-45 "></span>
      </div>
    </div>
  );
}
