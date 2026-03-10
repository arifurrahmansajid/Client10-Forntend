"use client";
import React, { SetStateAction, useContext } from "react";
import Button from "../ui/button";
import { useMutation } from "@/hooks/useMutation";
import { UserType } from "@/types/object";
import toast from "react-hot-toast";
import { Context, useSocket } from "@/app/utils/context";
import { getCookie, handleSetChatType } from "@/app/utils/utils";
import { useVideoCall } from "@/app/utils/video-call-context";
import { Page } from "@/app/utils/constant";
import DisbaleFeature from "./disable-feature";
import useDisable from "@/hooks/useDisable";

export default function DeleteAllMessages({
  chatingWith,
  _setChatingWith,
  setCurrentlyChattingWith,
  _currentlyChattingWith,
}: {
  chatingWith: UserType[];
  _setChatingWith: React.Dispatch<SetStateAction<UserType[]>>;
  setCurrentlyChattingWith: React.Dispatch<SetStateAction<UserType | null>>;
  _currentlyChattingWith: UserType | null;
}) {
  const mutation = useMutation();
  const socket = useSocket();
  const { user: currentUser, setUser, setCurrentPage } = useContext(Context);
  const { handleDestroyPreviousConnections } = useVideoCall();
  const { deleteDisabled } = useDisable("/delete");

  const handleDeleteAllChat = async () => {
    if (!chatingWith.length) {
      const res = await mutation<{ message: string; isPrivate?: boolean }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?isPrivate=`,
        method: "DELETE",
        headers: {
          Authorization: getCookie("token=") || "",
        },
      });
      if (res?.message) {
        window.dispatchEvent(new Event("message-delete"));
        socket?.emit("messages-delete");
        toast.success(res.message);
      }
    }
    for (let i = 0; i < chatingWith.length; i++) {
      const user = chatingWith[i];
      const res = await mutation<{ message: string; isPrivate?: boolean }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?isPrivate=${
          chatingWith ? "true" : ""
        }`,
        method: "DELETE",
        headers: {
          Authorization: getCookie("token=") || "",
        },
      });
      if (res?.message) {
        if (res.isPrivate) {
          socket?.emit("private-messages-delete", user.email);
          window.dispatchEvent(new Event("message-delete"));
          toast.success(res.message);
          return;
        }
        window.dispatchEvent(new Event("message-delete"));
        socket?.emit("messages-delete");
        toast.success(res.message);
      }
    }
  };
  const handleRemoveFriend = async (id: string) => {
    const friend = chatingWith.find((u) => u._id === id);
    if (chatingWith.length === 1) {
      handleSetChatType("public");
      setCurrentPage(Page.chat);
      if (socket) {
        socket.emit("join-room", "public");
      }
    }
    const event = new CustomEvent("remove-friend", {
      detail: friend,
    });
    window.dispatchEvent(event);
    const res = await mutation<{
      friend: { user: UserType; friend: UserType };
      removed: boolean;
    } | null>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/friend/${id}?remove=true`,
      method: "POST",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });

    if (res?.friend) {
      socket?.emit("remove-friend", {
        ...res.friend,
        friend: friend,
      });
      setUser((prev) => {
        return {
          ...prev,
          relationShip: "",
        } as UserType;
      });
    }
  };

  return (
    <div className="flex items-center gap-x-4 h-14 w-full overflow-x-auto">
      <Button
        onClick={() => {
          void handleDeleteAllChat();
        }}
        disabled={deleteDisabled}
      >
        Delete
      </Button>
      {chatingWith.length && currentUser ? (
        <>
          {chatingWith.map((user) => {
            if (!user?.name) return;
            return (
              <div
                key={user._id}
                className="flex items-center gap-x-1 p-2 self-center shrink-0 flex-nowrap"
              >
                <Button
                  key={user._id}
                  onClick={() => {
                    setCurrentlyChattingWith(user);
                    handleSetChatType("private");
                  }}
                >
                  {user.name}{" "}
                </Button>
                <Button
                  onClick={() => {
                    handleDestroyPreviousConnections(true)
                      .then(() => {
                        void handleRemoveFriend(user._id);
                      })
                      .catch(() => {});
                  }}
                >
                  X
                </Button>
              </div>
            );
          })}
        </>
      ) : null}
      <DisbaleFeature path="/chat" />
      <DisbaleFeature path="/delete" />
    </div>
  );
}
