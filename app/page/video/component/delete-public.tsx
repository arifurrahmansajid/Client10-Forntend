"use client";
import Button from "@/app/components/ui/button";
import { Context, useSocket } from "@/app/utils/context";
import { getCookie } from "@/app/utils/utils";
import { useMutation } from "@/hooks/useMutation";
import useDisable from "@/hooks/useDisable";
import React, { useContext } from "react";
import toast from "react-hot-toast";

export default function DeletePublic() {
  const mutation = useMutation(true);
  const socket = useSocket();
  const { currentTab } = useContext(Context);
  const { deleteDisabled } = useDisable("/delete");
  const handleDelete = async () => {
    if (deleteDisabled) return;
    // Only delete public content when on public tab
    if (currentTab !== "public") {
      toast.error("Please switch to Public tab to delete public content");
      return;
    }
    const res = await mutation<{ message: string }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/videos/delete-public`,
      method: "DELETE",
      // Don't send Authorization header for public delete
    });
    if (res?.message) {
      socket?.emit("new-file-uploaded-all");
      toast.success(res.message);
    }
  };
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
