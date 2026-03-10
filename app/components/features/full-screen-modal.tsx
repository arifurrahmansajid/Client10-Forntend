"use client";
import React, { useEffect, useState } from "react";
import Button from "../ui/button";
import { BACKGROUND_TYPE } from "@/app/utils/constant";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { Video } from "@/types/object";

interface ModalData {
  defaultIndex: number;
  allData: Video[];
  type: BACKGROUND_TYPE;
  open?: boolean;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function FullScreenModal({
  allData,
  defaultIndex,
  open,
  setCurrentIndex,
  type,
}: ModalData) {
  const [sildeIndex, setSlideIndex] = useState(defaultIndex + 1);
  const [isOpen, setOpen] = useState(open || false);
  const [activeSlide, setActiveSlide] = useState(defaultIndex);
  const [video, setVideo] = useState<null | HTMLVideoElement>(null);
  const [audio, setAudio] = useState<null | HTMLAudioElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const videofound = document.querySelector(
      `#video-${activeSlide}`
    ) as HTMLVideoElement;
    if (videofound) {
      setVideo(videofound);
    }
  }, [activeSlide, isOpen]);
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const audioFound = document.querySelector(
      `#audio-${activeSlide}`
    ) as HTMLVideoElement;
    if (audioFound) {
      setAudio(audioFound);
    }
  }, [activeSlide, isOpen]);

  useEffect(() => {
    if (video) {
      void video.play();
    }
    return () => {
      video?.pause();
    };
  }, [video]);
  useEffect(() => {
    if (audio) {
      void audio.play();
    }
    return () => {
      audio?.pause();
    };
  }, [audio]);

  return (
    <dialog
      className="w-screen h-screen top-0 z-50 isolate bg-black fixed left-0"
      open={isOpen}
    >
      <div className="w-screen flex items-center justify-between px-4 py-3 absolute z-10 text-white">
        <p>
          {sildeIndex}/{allData.length}
        </p>
        <Button
          className="scale-200"
          onClick={() => {
            setOpen(false);
            setCurrentIndex(null);
            video?.pause();
            setVideo(null);
          }}
        >
          &#10539;
        </Button>
      </div>
      <Swiper
        navigation={true}
        slidesPerView={1}
        spaceBetween={30}
        modules={[Navigation]}
        className="mySwiper"
        pagination={{ clickable: true }}
        loop={true}
        initialSlide={defaultIndex}
        onNavigationNext={() => {
          if (sildeIndex === allData.length) {
            setSlideIndex(1);
          } else {
            setSlideIndex((prev) => prev + 1);
          }
        }}
        onNavigationPrev={() => {
          if (sildeIndex === 1) {
            setSlideIndex(allData.length - 1);
          } else {
            setSlideIndex((prev) => prev - 1);
          }
        }}
        onSlideChange={(swiper) => {
          setActiveSlide(swiper.realIndex);
        }}
      >
        {allData.map((data, idx) => {
          return (
            <SwiperSlide
              key={data._id}
              onClick={() => {
                setOpen(false);
                setCurrentIndex(null);
                video?.pause();
                setVideo(null);
              }}
            >
              {type === BACKGROUND_TYPE.audio ? (
                <div className="h-full flex items-center justify-center relative isolate">
                  <audio
                    src={data.url}
                    controls
                    id={`audio-${idx}`}
                    className="w-[30%]"
                    loop
                  />
                </div>
              ) : null}
              {type === BACKGROUND_TYPE.video ? (
                <div className="h-full flex items-center justify-center relative isolate">
                  <video
                    src={data.url}
                    className="object-contain h-full absolute -z-1 pointer-events-none"
                    controls
                    id={`video-${idx}`}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-screen bg-black overflow-hidden">
                  <img
                    src={data.url}
                    alt=""
                    className="max-w-full max-h-[70%] object-contain"
                  />
                </div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </dialog>
  );
}
