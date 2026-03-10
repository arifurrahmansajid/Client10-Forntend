"use client";
import { Context, useSocket } from "@/app/utils/context";
import { useQuery } from "@/hooks/useQuery";
import React, { useCallback, useContext, useEffect, useState } from "react";
import Button from "../ui/button";
import Upload from "./upload";
import { useMutation } from "@/hooks/useMutation";
import { getCookie } from "@/app/utils/utils";
import toast from "react-hot-toast";
import useDisable from "@/hooks/useDisable";

export default function GlobalAudioPlayer() {
  const [audioSrc, setAudioSrc] = useState("");
  const [tab, setTab] = useState("");
  const [currentMusicId, setCurrentMusicId] = useState<string | null>(null);
  const query = useQuery();
  const mutation = useMutation();
  const {
    backgroundMusic,
    user,
    profileID,
    token,
    setBackgroundType,
    backgroundType,
    setBackgroundMusic,
  } = useContext(Context);
  const socket = useSocket();
  const { deleteDisabled } = useDisable("/delete");
  const getAudio = useCallback(async () => {
    if (backgroundType === "public") {
      const audio = await query<{ audio: string }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/music/background`,
        method: "GET",
      });
      if (audio?.audio) {
        setAudioSrc(audio.audio);
      } else {
        setAudioSrc("");
      }
    } else if (profileID) {
      const audio = await query<{ audio: string }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/music/background?user=${profileID}`,
        method: "GET",
      });
      if (audio?.audio) {
        setAudioSrc(audio.audio);
      } else {
        setAudioSrc("");
      }
    } else {
      const audio = await query<{ audio: string }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/music/background?user=${
          user?._id || ""
        }`,
        method: "GET",
      });
      if (audio?.audio) {
        setAudioSrc(audio.audio);
      } else {
        setAudioSrc("");
      }
    }
  }, [backgroundType, profileID, user?._id]);
  useEffect(() => {
    void getAudio();
  }, [getAudio]);
  useEffect(() => {
    setAudioSrc(backgroundMusic);
    // Find music ID when backgroundMusic changes
    if (backgroundMusic) {
      const findMusicId = async () => {
        try {
          const url = backgroundType === "public"
            ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/music`
            : `${process.env.NEXT_PUBLIC_BACKEND_URL}/music/private`;
          const musics = await query<{ musics: Array<{ _id: string; url: string }> }>({
            url,
            method: "GET",
            headers: backgroundType === "private" ? {
              Authorization: getCookie("token=") || "",
            } : {},
          });
          if (musics?.musics) {
            const foundMusic = musics.musics.find((m) => m.url === backgroundMusic);
            if (foundMusic) {
              setCurrentMusicId(foundMusic._id);
            }
          }
        } catch (error) {
          // Silently fail if can't find music
        }
      };
      void findMusicId();
    } else {
      setCurrentMusicId(null);
    }
  }, [backgroundMusic, backgroundType]);

  useEffect(() => {
    socket?.on("set-music", (music: string) => {
      if (!token) {
        setAudioSrc(music);
      }
    });
    socket?.on("private-music-set", (music: string) => {
      if (profileID) {
        setAudioSrc(music);
      }
    });
    socket?.on("new-bacground-music", () => {
      void getAudio();
    });
    return () => {
      socket?.off("set-music");
      socket?.off("new-bacground-music");
      socket?.off("private-music-set");
    };
  }, [socket, token, profileID]);

  useEffect(() => {
    setTab("private");
  }, [profileID]);

  useEffect(() => {
    if (token) setTab("private");
    else setTab("public");
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    const handleRemovePublicAudio = () => {
      if (!token) {
        setAudioSrc("");
      }
    };
    const handleRemovePrivateAudio = () => {
      setAudioSrc("");
    };
    socket.on("background-audio-deleted-public", handleRemovePublicAudio);
    socket.on("background-audio-deleted-private", handleRemovePrivateAudio);

    return () => {
      socket.off("background-audio-deleted-public", handleRemovePublicAudio);
      socket.off("background-audio-deleted-private", handleRemovePrivateAudio);
    };
  }, [socket, token]);

  return (
    <div className="w-full lg:w-[30%] grow-0 flex items-center justify-center flex-col relative h-[80vh] lg:h-[calc(100vh_-_9.5rem)]">
      <div className="flex items-center justify-center gap-x-6 w-full justify-self-start absolute top-10.5">
        <Button
          onClick={() => {
            window.open("https://paypal.me/AnimeDisney", "_blank");
          }}
        >
          Donate
        </Button>
        <Button className="opacity-0 pointer-events-none">Private</Button>
      </div>
      <audio
        src={!audioSrc.length ? "" : audioSrc}
        key={audioSrc}
        controls
        autoPlay
        loop
        preload="auto"
      ></audio>

      <div className="flex items-center justify-center gap-x-6 mt-3 w-full">
        <Button
          onClick={() => {
            setBackgroundType("public");
            setTab("public");
          }}
        >
          Public
        </Button>
        <Button
          disabled={!user && !profileID}
          onClick={() => {
            setBackgroundType("private");
            setTab("private");
          }}
        >
          Private
        </Button>
        <Button
          onClick={async (e) => {
            if (deleteDisabled && backgroundType === "public") {
              e.preventDefault();
              toast.error("Delete is currently disabled for public content");
              return;
            }
            if (!audioSrc) {
              toast.error("No music selected to delete");
              return;
            }
            
            // Find music ID if not already found
            let musicId = currentMusicId;
            if (!musicId) {
              try {
                const url = backgroundType === "public"
                  ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/music`
                  : `${process.env.NEXT_PUBLIC_BACKEND_URL}/music/private`;
                const musics = await query<{ musics: Array<{ _id: string; url: string }> }>({
                  url,
                  method: "GET",
                  headers: backgroundType === "private" ? {
                    Authorization: getCookie("token=") || "",
                  } : {},
                });
                if (musics?.musics) {
                  const foundMusic = musics.musics.find((m) => m.url === audioSrc);
                  if (foundMusic) {
                    musicId = foundMusic._id;
                    setCurrentMusicId(foundMusic._id);
                  }
                }
              } catch (error) {
                toast.error("Could not find music to delete");
                return;
              }
            }

            if (!musicId) {
              toast.error("Could not find music ID");
              return;
            }

            const res = await mutation<{ message: string; deleteAudio: any }>({
              url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/music/delete-audio/${musicId}`,
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
              setAudioSrc("");
              setCurrentMusicId(null);
              setBackgroundMusic("");
            }
          }}
          disabled={deleteDisabled && backgroundType === "public"}
          className={deleteDisabled && backgroundType === "public" ? "cursor-auto" : "cursor-pointer"}
        >
          Delete
        </Button>
      </div>
      <div className="absolute -bottom-10">
        <Upload
          className="border-none"
          key={tab}
          accept="audio/*"
          text="Upload Music"
          cb={() => {
            if (tab === "private") {
              void getAudio();
            } else {
              socket?.emit("new-backgroun-music-upload");
            }
          }}
          method="POST"
          url={`${process.env.NEXT_PUBLIC_BACKEND_URL}/music/upload-as-bacground?tab=${tab}`}
          showAddMoreFile={false}
          showXbutton={false}
        />
      </div>
    </div>
  );
}
