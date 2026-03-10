"use client";
import React, { useContext, useEffect, useState } from "react";
import GIFCard from "./gif-card";
import { Context, useSocket } from "@/app/utils/context";
import { useQuery } from "@/hooks/useQuery";
import { GIF } from "@/types/object";
import { getCookie } from "@/app/utils/utils";
import FullScreenModal from "@/app/components/features/full-screen-modal";
import { BACKGROUND_TYPE, Page } from "@/app/utils/constant";

export default function GifContainer() {
  const { currentTab, dataDeleted, currentPage, profileID } =
    useContext(Context);
  const [gifs, setGifs] = useState<GIF[]>([]);
  const [currentIndex, setCurrentIndex] = useState<null | number>(null);
  const query = useQuery();
  const socket = useSocket();

  useEffect(() => {
    const getGifs = async () => {
      if (profileID) {
        setGifs([]);
        const res = await query<{ gifs: GIF[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/gif/public-data?user=${profileID}`,
          method: "GET",
        });
        if (res?.gifs) {
          setGifs(res.gifs);
        }
        return;
      }
      if (currentTab === "public") {
        const res = await query<{ gifs: GIF[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/gif`,
          method: "GET",
        });
        if (res) {
          setGifs(res.gifs);
        }
      } else if (currentTab === "private") {
        const res = await query<{ gifs: GIF[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/gif/private`,
          method: "GET",
          headers: {
            Authorization: getCookie("token=") || "",
          },
        });
        if (res) {
          setGifs(res.gifs);
        }
      }
    };
    void getGifs();
    socket?.on("new-file-uploaded-all", () => {
      void getGifs();
    });
    return () => {
      socket?.off("new-file-uploaded-all");
    };
  }, [currentTab, socket, currentPage, profileID]);
  useEffect(() => {
    if (dataDeleted) setGifs([]);
  }, [dataDeleted]);
  return (
    <div className="mt-1.5 lg:pr-2 p-1 lg:p-0 grid grid-cols-1 lg:grid-cols-2 gap-2 overflow-y-auto h-[85vh] auto-rows-min items-start">
      <FullScreenModal
        allData={gifs}
        defaultIndex={currentIndex || 0}
        type={BACKGROUND_TYPE.gif}
        open={currentIndex !== null}
        key={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />
      {gifs.map((gif, idx) => {
        return (
          <GIFCard
            key={gif._id}
            gif={gif}
            idx={idx}
            setCurrentIndex={setCurrentIndex}
            setGifs={setGifs}
            showOptionalButton={currentPage !== Page.admin}
          />
        );
      })}
    </div>
  );
}
