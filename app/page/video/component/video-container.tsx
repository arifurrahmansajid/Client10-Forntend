"use client";
import React, { useContext, useEffect, useState } from "react";
import VideoCard from "./video-card";
import { Context, useSocket } from "@/app/utils/context";
import { Video } from "@/types/object";
import { useQuery } from "@/hooks/useQuery";
import { getCookie } from "@/app/utils/utils";
import { BACKGROUND_TYPE, Page } from "@/app/utils/constant";
import FullScreenModal from "@/app/components/features/full-screen-modal";

export default function VideoContainer() {
  const { currentTab, dataDeleted, currentPage, profileID } =
    useContext(Context);
  const query = useQuery();
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState<null | number>(null);
  const socket = useSocket();
  useEffect(() => {
    const getVideos = async () => {
      if (profileID) {
        setVideos([]);
        const res = await query<{ videos: Video[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/videos/public-data?user=${profileID}`,
          method: "GET",
        });
        if (res?.videos) {
          setVideos(res.videos);
        }
        return;
      }
      if (currentTab === "public") {
        const res = await query<{ videos: Video[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/videos`,
          method: "GET",
        });
        if (res) {
          setVideos(res.videos);
        }
      } else if (currentTab === "private") {
        const res = await query<{ videos: Video[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/videos/private`,
          method: "GET",
          headers: {
            Authorization: getCookie("token=") || "",
          },
        });
        if (res) {
          setVideos(res.videos);
        }
      }
    };
    void getVideos();
    socket?.on("new-file-uploaded-all", () => {
      void getVideos();
    });
    return () => {
      socket?.off("new-file-uploaded-all");
    };
  }, [currentTab, currentPage, socket, profileID]);

  useEffect(() => {
    if (dataDeleted) setVideos([]);
  }, [dataDeleted]);
  return (
    <div className="mt-1.5 lg:pr-2 p-1 lg:p-0 grid grid-cols-1 lg:grid-cols-2 gap-2 overflow-y-auto h-[85vh] auto-rows-min items-start">
      <FullScreenModal
        allData={videos}
        defaultIndex={currentIndex || 0}
        type={BACKGROUND_TYPE.video}
        open={currentIndex !== null}
        key={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />
      {videos.map((video, idx) => {
        return (
          <VideoCard
            key={video._id}
            video={video}
            setVideos={setVideos}
            idx={idx}
            setCurrentIndex={setCurrentIndex}
            showOptionalButton={currentPage !== Page.admin}
          />
        );
      })}
    </div>
  );
}
