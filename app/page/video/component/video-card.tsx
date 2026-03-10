"use client";
import Button from "@/app/components/ui/button";
import { BACKGROUN_STYLE, Page } from "@/app/utils/constant";
import { Context, useSocket } from "@/app/utils/context";
import { getCookie } from "@/app/utils/utils";
import useDisable from "@/hooks/useDisable";
import { useMutation } from "@/hooks/useMutation";
import { Video } from "@/types/object";
import React, { useContext } from "react";
import toast from "react-hot-toast";

export default function VideoCard({
  video,
  setVideos,
  idx,
  setCurrentIndex,
  showOptionalButton,
}: {
  video: Video;
  setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
  idx: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number | null>>;
  showOptionalButton: boolean;
}) {
  const mutation = useMutation();
  const {
    setBackgroundStyle,
    user,
    currentPage,
    setBackgroundType,
    currentTab,
  } = useContext(Context);
  const socket = useSocket();
  const { backgroundDisabled } = useDisable("/bg");
  const { deleteDisabled } = useDisable("/delete");
  const handleDelete = async () => {
    if (deleteDisabled && currentTab === "public") {
      toast.error("Delete is currently disabled for public content");
      return;
    }
    const res = await mutation<{ message: string }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/videos/delete-video/${video._id}`,
      method: "DELETE",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });
    if (res) {
      toast.success(res.message);
      socket?.emit("new-file-uploaded");
      setVideos((prev) => {
        return prev.filter((vid) => vid._id !== video._id);
      });
    }
  };
  const handleSetAsBackground = async () => {
    const body = !video.style
      ? BACKGROUN_STYLE.video
      : video.style === BACKGROUN_STYLE.video
      ? BACKGROUN_STYLE.videoFullScreen
      : null;
    const res = await mutation<{ message: string; updatedVideo: Video }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/videos/set-background/${video._id}?type=${currentTab}`,
      method: "PUT",
      headers: {
        Authorization: getCookie("token=") || "",
      },
      body: JSON.stringify({ style: body }),
    });
    if (res?.message) {
      setBackgroundType(currentTab);
      setVideos((prev) => {
        return prev.map((vid) => {
          return vid._id === video._id
            ? res.updatedVideo
            : { ...vid, style: null };
        }) as Video[];
      });
      socket?.on("set-background", (data: Video) => {
        setVideos((prev) => {
          return prev.map((vid) => {
            return vid._id === video._id ? data : { ...vid, style: null };
          }) as Video[];
        });
      });
      if (!res.updatedVideo.setAsBackground) {
        setBackgroundStyle({
          style: BACKGROUN_STYLE.default,
          url: "",
        });
        socket?.emit(user ? "background-private" : "background", {
          ...res.updatedVideo,
          url: "",
        });
        toast.success("Background removed successfully");
      } else {
        toast.success(res.message);
        setBackgroundStyle({
          style: res.updatedVideo.style,
          url: res.updatedVideo.url,
        });
        socket?.emit(
          user ? "background-private" : "background",
          res.updatedVideo
        );
      }
    }
  };
  return (
    <section>
      <video
        src={video.url}
        controls
        className="m-auto aspect-square w-full h-[300px] object-contain"
      ></video>
      <div className="flex items-center justify-start gap-x-6 mt-1">
        <Button className="cursor-pointer" onClick={() => setCurrentIndex(idx)}>
          View
        </Button>
        {currentPage === Page.publicProfile ? null : (
          <>
            <Button
              className="cursor-pointer"
              onClick={() => {
                void handleSetAsBackground();
              }}
              disabled={backgroundDisabled}
            >
              Background
            </Button>
            {showOptionalButton && (
              <Button
                className="cursor-pointer"
                onClick={(e) => {
                  if (deleteDisabled && currentTab === "public") {
                    e.preventDefault();
                    return;
                  }
                  void handleDelete();
                }}
                disabled={deleteDisabled && currentTab === "public"}
              >
                Delete
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
