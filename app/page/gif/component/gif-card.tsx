"use client";
import Button from "@/app/components/ui/button";
import { BACKGROUN_STYLE, Page } from "@/app/utils/constant";
import { Context, useSocket } from "@/app/utils/context";
import { getCookie } from "@/app/utils/utils";
import useDisable from "@/hooks/useDisable";
import { useMutation } from "@/hooks/useMutation";
import { GIF } from "@/types/object";
import React, { useContext } from "react";
import toast from "react-hot-toast";

export default function GIFCard({
  gif,
  setGifs,
  idx,
  setCurrentIndex,
  showOptionalButton,
}: {
  gif: GIF;
  setGifs: React.Dispatch<React.SetStateAction<GIF[]>>;
  idx: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number | null>>;
  showOptionalButton: boolean;
}) {
  const mutation = useMutation();
  const socket = useSocket();
  const {
    setBackgroundStyle,
    user,
    currentPage,
    currentTab,
    setBackgroundType,
  } = useContext(Context);
  const { backgroundDisabled } = useDisable("/bg");
  const { deleteDisabled } = useDisable("/delete");
  const handleDelete = async () => {
    if (deleteDisabled && currentTab === "public") {
      toast.error("Delete is currently disabled for public content");
      return;
    }
    const res = await mutation<{ message: string }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/gif/delete-gif/${gif._id}`,
      method: "DELETE",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });
    if (res) {
      toast.success(res.message);
      socket?.emit("new-file-uploaded");
      setGifs((prev) => {
        return prev.filter((prevGif) => prevGif._id !== gif._id);
      });
    }
  };
  const handleSetbackground = async () => {
    const body =
      gif?.style === BACKGROUN_STYLE.gif
        ? BACKGROUN_STYLE.gifFullScreen
        : gif?.style === BACKGROUN_STYLE.gifFullScreen
        ? BACKGROUN_STYLE.gifRepeat
        : gif.style === BACKGROUN_STYLE.gifRepeat
        ? BACKGROUN_STYLE.gifRepeat2
        : gif.style === BACKGROUN_STYLE.gifRepeat2
        ? null
        : gif.style === null
        ? BACKGROUN_STYLE.gif
        : null;
    const res = await mutation<{ message: string; updatedGifs: GIF }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/gif/set-background/${gif._id}?type=${currentTab}`,
      method: "PUT",
      headers: {
        Authorization: getCookie("token=") || "",
      },
      body: JSON.stringify({ style: gif.style ? body : BACKGROUN_STYLE.gif }),
    });
    if (res?.message) {
      setBackgroundType(currentTab);
      setGifs((prev) => {
        return prev.map((prevGif) => {
          if (prevGif._id === gif._id) {
            return res.updatedGifs;
          }
          return { ...prevGif, style: null };
        }) as GIF[];
      });
      socket?.on("set-background", (data: GIF) => {
        setGifs((prev) => {
          return prev.map((prevGif) => {
            if (prevGif._id === gif._id) {
              return data;
            }
            return { ...prevGif, style: null };
          }) as GIF[];
        });
      });
      if (!res.updatedGifs.setAsBackground) {
        socket?.emit(user ? "background-private" : "background", {
          ...res.updatedGifs,
          url: "",
        });
        setBackgroundStyle({ style: BACKGROUN_STYLE.default, url: "" });
        toast.success("Bacground removed successfully");
        return;
      }
      toast.success(res.message);
      setBackgroundStyle({
        style: res.updatedGifs.style,
        url: res.updatedGifs.url,
      });
      socket?.emit(user ? "background-private" : "background", res.updatedGifs);
    }
  };
  return (
    <section>
      <img
        src={gif.url}
        className="m-auto h-[300px] object-contain"
        loading="lazy"
        alt=""
        onClick={() => {
          setCurrentIndex(idx);
        }}
      ></img>
      <div className="flex items-center justify-start gap-x-6 mt-1">
        <Button
          className="cursor-pointer"
          onClick={() => {
            setCurrentIndex(idx);
          }}
        >
          View
        </Button>
        {currentPage === Page.publicProfile ? null : (
          <>
            <Button
              className="cursor-pointer"
              onClick={() => {
                void handleSetbackground();
              }}
              disabled={backgroundDisabled}
            >
              Background
            </Button>
            <Button
              className="cursor-pointer"
              onClick={(e) => {
                if (deleteDisabled && currentTab === "public" && user?.roles !== "admin") {
                  e.preventDefault();
                  return;
                }
                void handleDelete();
              }}
              disabled={deleteDisabled && currentTab === "public" && user?.roles !== "admin"}
            >
              Delete
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
