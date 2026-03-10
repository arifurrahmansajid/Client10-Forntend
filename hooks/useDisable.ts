"use client";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "./useQuery";
import { useMutation } from "./useMutation";
import { useSocket } from "@/app/utils/context";
import { getCookie } from "@/app/utils/utils";

export default function useDisable(path: string) {
  const [chatDisabled, setChatDisabled] = useState(false);
  const [uploadDisabled, setUploadDisabled] = useState(false);
  const [deleteDisabled, setDeleteDisabled] = useState(false);
  const [musicDisabled, setMusicDisabled] = useState(false);
  const [backgroundDisabled, setBackgroundDisabled] = useState(false);

  const query = useQuery();
  const mutation = useMutation();
  const socket = useSocket();

  const handleSetDisable = useCallback(
    (disabled: boolean) => {
      switch (path) {
        case "/chat":
          setChatDisabled(disabled);
          break;
        case "/upload":
          setUploadDisabled(disabled);
          break;
        case "/delete":
          setDeleteDisabled(disabled);
          break;
        case "/music":
          setMusicDisabled(disabled);
          break;
        case "/bg":
          setBackgroundDisabled(disabled);
          break;
        default:
          break;
      }
    },
    [path]
  );

  useEffect(() => {
    const handleGetDisbaleData = async () => {
      const res = await query<{ disabled: boolean }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/${path}`,
        method: "GET",
      });
      if (res) {
        handleSetDisable(res.disabled);
      }
    };
    void handleGetDisbaleData();
  }, [handleSetDisable, path]);

  const handleDisbale = async () => {
    const res = await mutation<{ disabled: boolean }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/${path}`,
      method: "POST",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });
    if (res) {
      handleSetDisable(res.disabled);
      socket?.emit("disable", { path: path, disabled: res.disabled });
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handleRealtimeDisbale = (realTimepath: string, disabled: boolean) => {
      switch (realTimepath) {
        case "/chat":
          setChatDisabled(disabled);
          break;
        case "/upload":
          setUploadDisabled(disabled);
          break;
        case "/delete":
          setDeleteDisabled(disabled);
          break;
        case "/music":
          setMusicDisabled(disabled);
          break;
        case "/bg":
          setBackgroundDisabled(disabled);
          break;
        default:
          break;
      }
    };
    socket.on("disable", handleRealtimeDisbale);
    return () => {
      socket.off("disable", handleRealtimeDisbale);
    };
  }, [socket]);

  return {
    chatDisabled,
    uploadDisabled,
    deleteDisabled,
    musicDisabled,
    backgroundDisabled,
    handleDisbale,
  };
}
