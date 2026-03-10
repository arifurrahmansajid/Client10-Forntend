"use client";
import { Message } from "@/types/object";
import React from "react";
import Button from "../ui/button";
import { useUser } from "@/app/utils/context";

import { getCookie } from "@/app/utils/utils";
import { useMutation } from "@/hooks/useMutation";
import toast from "react-hot-toast";

export default function DeleteChat({
  message,
  setMessages,
}: {
  message: Message;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const mutation = useMutation();
  const user = useUser();
  const handleDelete = async () => {
    const res = await mutation<{ message: string }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/${message._id}`,
      method: "DELETE",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });
    if (res?.message) {
      setMessages((prev) => prev.filter((msg) => msg._id !== message._id));
      toast.success(res.message);
    }
  };
  return (
    <Button
      disabled={!user || user._id !== message.user?._id}
      onClick={() => {
        void handleDelete();
      }}
    >
      Delete
    </Button>
  );
}
