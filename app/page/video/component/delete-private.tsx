"use client";
import Button from "@/app/components/ui/button";
import { Context, useSocket } from "@/app/utils/context";
import { getCookie } from "@/app/utils/utils";
import { useMutation } from "@/hooks/useMutation";
import useDisable from "@/hooks/useDisable";
import React, { useContext } from "react";
import toast from "react-hot-toast";

export default function DeletePrivateVideo() {
  const mutation = useMutation(true);
  const socket = useSocket();
  const { currentTab, user } = useContext(Context);
  const { deleteDisabled } = useDisable("/delete");
  
  const handleDelete = async () => {
    if (currentTab !== "private") {
        toast.error("Please switch to Private tab to delete your private videos");
        return;
    }
    
    const confirmDelete = confirm("Are you sure you want to delete ALL your private videos? This cannot be undone.");
    if (!confirmDelete) return;

    const res = await mutation<{ message: string }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/videos/delete-private`,
      method: "DELETE",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });
    if (res?.message) {
      toast.success(res.message);
      socket?.emit("new-file-uploaded-all");
    }
  };

  if (!user || currentTab !== "private") return null;

  return (
    <Button
      onClick={() => {
        void handleDelete();
      }}
      className="lg:text-base text-[12px] bg-red-600/20 hover:bg-red-600/40 text-red-500 border-red-500/50"
    >
      Delete All Private
    </Button>
  );
}
