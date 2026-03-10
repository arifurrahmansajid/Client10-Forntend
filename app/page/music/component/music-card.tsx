"use client";
import Button from "@/app/components/ui/button";
import { Page } from "@/app/utils/constant";
import { Context, useSocket } from "@/app/utils/context";
import { getCookie } from "@/app/utils/utils";
import useDisable from "@/hooks/useDisable";
import { useMutation } from "@/hooks/useMutation";
import { Musics } from "@/types/object";
import React, { SetStateAction, useContext } from "react";
import toast from "react-hot-toast";

export default function MusicCard({
  music,
  setMusic,
  showOptionalButton,
  setCurrentIndex,
  idx,
}: {
  music: Musics;
  setMusic: React.Dispatch<SetStateAction<Musics[]>>;
  showOptionalButton: boolean;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number | null>>;
  idx: number;
}) {
  const mutation = useMutation();
  const {
    setBackgroundMusic,
    currentPage,
    token,
    currentTab,
    setBackgroundType,
  } = useContext(Context);
  const socket = useSocket();
  const { musicDisabled } = useDisable("/music");
  const { deleteDisabled } = useDisable("/delete");
  const handleDelete = async () => {
    if (deleteDisabled && currentTab === "public") {
      toast.error("Delete is currently disabled for public content");
      return;
    }
    const res = await mutation<{ message: string; deleteAudio: Musics }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/music/delete-audio/${music._id}`,
      method: "DELETE",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });
    if (res?.message) {
      if (res.deleteAudio.setAsBackground) {
        socket?.emit("background-audio-deleted", token ? "private" : "public");
      }
      toast.success(res.message);
      socket?.emit("new-file-uploaded");
      setMusic((prev) => {
        return prev.filter((mus) => mus._id !== music._id);
      });
    }
  };
  const handleSetBackground = async () => {
    const res = await mutation<{ message: string; updatedAudio: Musics }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/music/set-background/${music._id}?type=${currentTab}`,
      method: "PUT",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });
    if (res) {
      setBackgroundType(currentTab);
      if (res.updatedAudio.setAsBackground) {
        toast.success(res.message);
        socket?.emit(!token ? "music" : "private-music", res.updatedAudio.url);
        setBackgroundMusic(res.updatedAudio.url);
      } else {
        socket?.emit(!token ? "music" : "private-music", "");
        setBackgroundMusic("");
        toast.success("Music removed successfully");
      }
    }
  };
  return (
    <div className="w-full lg:w-[49%] h-fit self-start">
      {music.url ? (
        <audio src={music.url} controls className="w-full" />
      ) : (
        <div className="w-full h-[54px] bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-white/40 italic text-sm">
          Invalid audio source
        </div>
      )}
      <div className="flex items-center justify-start gap-x-6 mt-1">
        <Button
          onClick={() => {
            setCurrentIndex(idx);
          }}
        >
          View
        </Button>
        {currentPage === Page.publicProfile ? null : (
          <>
            <Button
              onClick={() => {
                void handleSetBackground();
              }}
              disabled={musicDisabled}
            >
              Background
            </Button>
            {showOptionalButton && (
              <Button
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
    </div>
  );
}
