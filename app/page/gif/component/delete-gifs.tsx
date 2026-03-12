"use client";
import Button from "@/app/components/ui/button";
import { Context, useSocket } from "@/app/utils/context";
import { getCookie } from "@/app/utils/utils";
import { useMutation } from "@/hooks/useMutation";
import useDisable from "@/hooks/useDisable";
import React, { useContext } from "react";
import toast from "react-hot-toast";

export default function DeleteGIFs() {
  const mutation = useMutation(true);
  const socket = useSocket();
  const { currentTab, user } = useContext(Context);
  const { deleteDisabled } = useDisable("/delete");

  const handleDelete = async () => {
    if (deleteDisabled) return;

    if (currentTab === "public") {
      const confirmDelete = confirm("Are you sure you want to delete ALL public GIFs?");
      if (!confirmDelete) return;

      const res = await mutation<{ message: string }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/gif/delete-public`,
        method: "DELETE",
        headers: {
          Authorization: getCookie("token=") || "",
        },
      });
      if (res?.message) {
        toast.success(res.message);
        socket?.emit("new-file-uploaded-all");
      }
    } else if (currentTab === "private") {
      if (!user) {
        toast.error("Please login to manage private content");
        return;
      }
      const confirmDelete = confirm("Are you sure you want to delete ALL your private GIFs?");
      if (!confirmDelete) return;

      const res = await mutation<{ message: string }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/gif/delete-private`,
        method: "DELETE",
        headers: {
          Authorization: getCookie("token=") || "",
        },
      });
      if (res?.message) {
        toast.success(res.message);
        socket?.emit("new-file-uploaded-all");
      }
    }
  };

  // Show if on Public tab (for everyone) OR on Private tab (only if logged in)
  if (currentTab === "private" && !user) return null;

  return (
    <Button
      onClick={() => {
        void handleDelete();
      }}
      className="lg:text-base text-[12px]"
      disabled={deleteDisabled}
    >
      Delete
    </Button>
  );
}
