"use client";
import React, { useContext, useEffect, useState } from "react";
import ImageCard from "./image-card";
import { Context, useSocket } from "@/app/utils/context";
import { useQuery } from "@/hooks/useQuery";
import { Picture } from "@/types/object";
import { getCookie } from "@/app/utils/utils";
import FullScreenModal from "@/app/components/features/full-screen-modal";
import { BACKGROUND_TYPE, Page } from "@/app/utils/constant";

export default function ImageContainer() {
  const { currentTab, dataDeleted, currentPage, profileID } =
    useContext(Context);
  const [images, setImages] = useState<Picture[]>([]);
  const [currentIndex, setCurrentIndex] = useState<null | number>(null);
  const query = useQuery();
  const socket = useSocket();

  useEffect(() => {
    const getImages = async () => {
      if (profileID) {
        setImages([]);
        const res = await query<{ images: Picture[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/images/public-data?user=${profileID}`,
          method: "GET",
        });
        if (res?.images) {
          setImages(res.images);
        }
        return;
      }
      if (currentTab === "public") {
        const res = await query<{ images: Picture[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/images`,
          method: "GET",
        });
        if (res) {
          setImages(res.images);
        }
      } else if (currentTab === "private") {
        const res = await query<{ images: Picture[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/images/private`,
          method: "GET",
          headers: {
            Authorization: getCookie("token=") || "",
          },
        });
        if (res) {
          setImages(res.images);
        }
      }
    };
    void getImages();
    socket?.on("new-file-uploaded-all", () => {
      void getImages();
    });
  }, [currentTab, socket, currentPage, profileID]);

  useEffect(() => {
    if (dataDeleted) {
      setImages([]);
    }
  }, [dataDeleted]);

  return (
    <div className="mt-1.5 lg:pr-2 p-1 lg:p-0 grid grid-cols-1 lg:grid-cols-2 gap-2 overflow-y-auto h-[85vh] auto-rows-min items-start">
      <FullScreenModal
        allData={images}
        defaultIndex={currentIndex || 0}
        type={BACKGROUND_TYPE.image}
        open={currentIndex !== null}
        key={currentIndex}
        setCurrentIndex={setCurrentIndex}
      />
      {images.map((image, idx) => {
        return (
          <ImageCard
            image={image}
            key={image._id}
            idx={idx}
            setCurrentIndex={setCurrentIndex}
            setImages={setImages}
            showOptionlButton={currentPage !== Page.admin}
          />
        );
      })}
    </div>
  );
}
