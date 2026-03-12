"use client";
import {
  BACKGROUN_STYLE,
  IMAGE_REPEAT_X,
  IMAGE_REPEAT_Y,
} from "@/app/utils/constant";
import { Context, useSocket } from "@/app/utils/context";
import { getCookie } from "@/app/utils/utils";
import useBodyDimensions from "@/hooks/useBodyDimensions";
import { useQuery } from "@/hooks/useQuery";
import { GIF, Picture, Video } from "@/types/object";
import Image from "next/image";
import React, { useCallback, useContext, useEffect, useState } from "react";

export default function GlobalbackGround() {
  const {
    backgrundStyle,
    setBackgroundStyle,
    user,
    profileID,
    backgroundType,
    setBackgroundType,
  } = useContext(Context);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [backgroundReady, setBackgroundReady] = useState(false);
  const query = useQuery();
  const socket = useSocket();
  const bodyDimensions = useBodyDimensions();
  const handleSetbackGround = useCallback(
    async (
      id: string,
      abort?: AbortController
    ): Promise<Video | GIF | Picture | null | undefined> => {
      let data: Video | Picture | GIF | undefined | null = undefined;
      const getVideoBackground = async () => {
        const video = await query<{ video: Video }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/videos/background?user=${id}`,
          method: "GET",
          signal: abort,
        });
        if (video?.video) {
          data = video?.video;
        }
      };
      const getPictureBackground = async () => {
        const image = await query<{ image: Picture }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/images/background?user=${id}`,
          method: "GET",
          signal: abort,
        });
        if (image?.image) {
          data = image?.image;
        }
      };

      const getGifBackground = async () => {
        const gif = await query<{ gifs: GIF }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/gif/background?user=${id}`,
          method: "GET",
          signal: abort,
        });
        if (gif?.gifs) {
          data = gif?.gifs;
        }
      };
      await Promise.all([
        getVideoBackground(),
        getPictureBackground(),
        getGifBackground(),
      ]);
      if (data) return data;
    },
    []
  );
  useEffect(() => {
    const cookie = getCookie("token=");
    const abort = new AbortController();
    if (!profileID) {
      if (backgroundType === "private") {
        if (!user?._id) return; // Wait for user to load on refresh
        handleSetbackGround(user?._id ?? "", abort)
          .then((res) => {
            if (!res) {
              setBackgroundStyle({
                style: BACKGROUN_STYLE.default,
                url: "",
              });
            } else {
              setBackgroundStyle({
                style: res.style,
                url: res.url,
              });
            }
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error(err);
          });
      } else {
        handleSetbackGround("", abort)
          .then((res) => {
            if (!res) {
              setBackgroundStyle({
                style: BACKGROUN_STYLE.default,
                url: "",
              });
            } else {
              setBackgroundStyle({
                style: res.style,
                url: res.url,
              });
            }
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.error(err);
          });
      }
    } else if (profileID) {
      handleSetbackGround(profileID, abort)
        .then((res) => {
          if (!res) {
            setBackgroundStyle({
              style: BACKGROUN_STYLE.default,
              url: "",
            });
          } else {
            setBackgroundStyle({
              style: res.style,
              url: res.url,
            });
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(err);
        });
    }

    socket?.on("set-private-background", () => {
      if (!profileID) return;
      handleSetbackGround(profileID)
        .then((res) => {
          setBackgroundType("private");
          if (!res) {
            setBackgroundStyle({
              style: BACKGROUN_STYLE.default,
              url: "",
            });
          } else {
            setBackgroundStyle({
              style: res.style,
              url: res.url,
            });
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(err);
        });
    });
    socket?.on("set-background", () => {
      if (cookie) return;
      handleSetbackGround("")
        .then((res) => {
          setBackgroundType("public");
          if (!res) {
            setBackgroundStyle({
              style: BACKGROUN_STYLE.default,
              url: "",
            });
          } else {
            setBackgroundStyle({
              style: res.style,
              url: res.url,
            });
          }
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error(err);
        });
    });
    return () => {
      socket?.off("set-private-background");
      socket?.off("set-background");
      abort.abort();
    };
  }, [
    socket,
    user,
    profileID,
    backgroundType,
    handleSetbackGround,
    setBackgroundStyle,
    setBackgroundType,
  ]);

  useEffect(() => {
    setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    const abort = new AbortController();
    window.addEventListener(
      "resize",
      () => {
        setScreenSize({ width: window.innerWidth, height: window.innerHeight });
      },
      abort
    );
    return () => {
      abort.abort();
    };
  }, []);

  useEffect(() => {
    if (backgrundStyle.style !== BACKGROUN_STYLE.default) {
      setBackgroundReady(true);
    }
  }, [backgrundStyle]);

  if (backgrundStyle.style === BACKGROUN_STYLE.default) {
    return <div className="w-screen h-screen absolute z-[-1] bg-primary"></div>;
  }
  if (!backgroundReady) return null;
  if (backgrundStyle.style === BACKGROUN_STYLE.video && backgrundStyle.url) {
    return (
      <div
        className="absolute z-[-1]"
        style={{ width: bodyDimensions.width, height: bodyDimensions.height }}
      >
        <video
          src={backgrundStyle.url}
          autoPlay
          loop
          controls={false}
          className="w-full h-full object-contain"
        ></video>
      </div>
    );
  }
  if (
    backgrundStyle.style === BACKGROUN_STYLE.videoFullScreen &&
    backgrundStyle.url
  ) {
    return (
      <div
        className="absolute z-[-1]"
        style={{ width: bodyDimensions.width, height: bodyDimensions.height }}
      >
        <video
          src={backgrundStyle.url}
          autoPlay
          loop
          controls={false}
          className="w-full h-full object-fill"
        ></video>
      </div>
    );
  }
  if (
    (backgrundStyle.style === BACKGROUN_STYLE.image ||
      backgrundStyle.style === BACKGROUN_STYLE.gif) &&
    backgrundStyle.url
  ) {
    return (
      <div
        className="absolute z-[-1]"
        style={{ width: bodyDimensions.width, height: bodyDimensions.height }}
      >
        <Image
          src={backgrundStyle.url}
          layout="fill"
          objectFit="contain"
          alt=""
          unoptimized
        />
      </div>
    );
  }
  if (
    (backgrundStyle.style === BACKGROUN_STYLE.imageFullScreen ||
      backgrundStyle.style === BACKGROUN_STYLE.gifFullScreen) &&
    backgrundStyle.url
  ) {
    return (
      <div
        className="absolute z-[-1]"
        style={{ width: bodyDimensions.width, height: bodyDimensions.height }}
      >
        <Image
          src={backgrundStyle.url}
          layout="fill"
          objectFit="fill"
          alt=""
          unoptimized
        />
      </div>
    );
  }
  if (
    backgrundStyle.style === BACKGROUN_STYLE.imageRepeat ||
    backgrundStyle.style === BACKGROUN_STYLE.gifRepeat
  ) {
    return (
      <div
        className="w-screen h-screen absolute z-[-1]"
        style={{
          backgroundImage: `url(${backgrundStyle.url})`,
          backgroundSize: `${bodyDimensions.width / IMAGE_REPEAT_X}px ${
            screenSize.height / IMAGE_REPEAT_Y
          }px`,
          width: bodyDimensions.width,
          height: bodyDimensions.height,
        }}
      ></div>
    );
  }
  if (
    backgrundStyle.style === BACKGROUN_STYLE.imageRepeat2 ||
    backgrundStyle.style === BACKGROUN_STYLE.gifRepeat2
  ) {
    return (
      <div
        className="w-screen h-screen absolute z-[-1]"
        style={{
          backgroundImage: `url(${backgrundStyle.url})`,
          backgroundSize: "20rem 18rem",
          width: bodyDimensions.width,
          height: bodyDimensions.height,
        }}
      ></div>
    );
  }
}
