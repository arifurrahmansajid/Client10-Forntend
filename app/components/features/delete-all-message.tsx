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
    const isPrivateMode = localStorage.getItem("chat") === "private";
    const targetId = _currentlyChattingWith?._id;

    // Send a single request targeting ONLY the current context
    const res = await mutation<{ message: string; isPrivate?: boolean }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?isPrivate=${isPrivateMode ? "true" : ""}&chatingWith=${isPrivateMode && targetId ? targetId : ""}`,
      method: "DELETE",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });

    if (res?.message) {
      if (res.isPrivate && _currentlyChattingWith) {
        socket?.emit("private-messages-delete", _currentlyChattingWith.email);
      } else {
        socket?.emit("messages-delete");
      }
      window.dispatchEvent(new Event("message-delete"));
      toast.success(res.message);
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
          {chatingWith.map((user, idx) => {
            if (!user?.name) return;
            return (
              <div
                key={`${user._id}-${idx}`}
                className="flex items-center gap-x-1 p-2 self-center shrink-0 flex-nowrap"
              >
                <Button
                  key={`btn-${user._id}-${idx}`}
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
                        // User wants to keep tabs visible even after closing chats.
                        // So we NO LONGER remove them from `chatingWith`. 
                        // We just deselect them if they were currently selected.
                        if (_currentlyChattingWith?._id === user._id) {
                          setCurrentlyChattingWith(null);
                          handleSetChatType("public");
                          setCurrentPage(Page.chat);
                          socket?.emit("join-room", "public");
                        }
                      })
                      .catch(() => { });
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
