"use client";
import React, { useContext, useEffect, useState } from "react";
import MusicCard from "./music-card";
import { Musics } from "@/types/object";
import { useQuery } from "@/hooks/useQuery";
import { Context, useSocket } from "@/app/utils/context";
import { getCookie } from "@/app/utils/utils";
import { BACKGROUND_TYPE, Page } from "@/app/utils/constant";
import FullScreenModal from "@/app/components/features/full-screen-modal";

export default function MusicContainer() {
  const [musics, setMusics] = useState<Musics[]>([]);
  const { currentTab, dataDeleted, currentPage, profileID } =
    useContext(Context);
  const [currentIndex, setCurrentIndex] = useState<null | number>(null);
  const query = useQuery();
  const socket = useSocket();

  useEffect(() => {
    const getMusics = async () => {
      if (profileID) {
        setMusics([]);
        const res = await query<{ musics: Musics[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/music/public-data?user=${profileID}`,
          method: "GET",
        });
        if (res?.musics) {
          setMusics(res.musics);
        }
        return;
      }
      if (currentTab === "public") {
        const auido = await query<{ musics: Musics[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/music`,
          method: "GET",
        });
        if (auido) {
          setMusics(auido.musics);
        }
      } else if (currentTab === "private") {
        const auido = await query<{ musics: Musics[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/music/private`,
          method: "GET",
          headers: {
            Authorization: getCookie("token=") || "",
          },
        });
        if (auido) {
          setMusics(auido.musics);
        }
      }
    };
    void getMusics();
    socket?.on("new-file-uploaded-all", () => {
      void getMusics();
    });
    return () => {
      socket?.off("new-file-uploaded-all");
    };
  }, [currentTab, socket]);

  useEffect(() => {
    if (dataDeleted) {
      setMusics([]);
    }
  }, [dataDeleted]);

  return (
    <div className="h-[85vh] overflow-auto">
      <div className="lg:pr-3 p-2 lg:p-0 mt-1.5 flex items-start justify-between gap-2 flex-wrap h-fit overflow-y-auto">
        <FullScreenModal
          allData={musics}
          defaultIndex={currentIndex || 0}
          type={BACKGROUND_TYPE.audio}
          open={currentIndex !== null}
          key={currentIndex}
          setCurrentIndex={setCurrentIndex}
        />
        {musics.map((music, idx) => {
          return (
            <MusicCard
              key={music._id}
              music={music}
              setMusic={setMusics}
              showOptionalButton={currentPage !== Page.admin}
              setCurrentIndex={setCurrentIndex}
              idx={idx}
            />
          );
        })}
      </div>
    </div>
  );
}
