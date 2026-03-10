"use client";
import { Message, UserType } from "@/types/object";
import Image from "next/image";
import React, { useContext, useEffect, useRef, useState } from "react";
import Button from "./button";
import { Context, useSocket } from "@/app/utils/context";
import useDebounce from "@/hooks/useDebounce";
import { useMutation } from "@/hooks/useMutation";
import {
  formatDate,
  getCookie,
  handleSetChatType,
  isAlreadyChatingWith,
} from "@/app/utils/utils";
import { Page } from "@/app/utils/constant";
import ShowMessageFilePreview from "../features/show-message-file-preview";
import PictureModal from "../features/picture-modal";
import { useVideoCall } from "@/app/utils/video-call-context";
import DeleteChat from "../features/delete-chat";

export default function MessageCard({
  message,
  ref,
  setMessage: setMessages,
}: {
  message: Message;
  ref: React.Ref<HTMLDivElement>;
  setMessage: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const {
    user,
    defaultProfilePic,
    setCurrentPage,
    setUser,
    setProfileId,
    setChatingWith,
    chatingWith,
  } = useContext(Context);
  const [Message, setMessage] = useState(message.message);
  const [messageUpdate, setMessageUpdate] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const debounceMessage = useDebounce(Message);
  const mutation = useMutation();
  const socket = useSocket();
  const editableRef = useRef<HTMLParagraphElement>(null);
  const { handleDestroyPreviousConnections } = useVideoCall();

  const handleChatWith = async () => {
    if (!user || !message.user?.email) return;
    if (user._id === message.user._id) return;
    if (isAlreadyChatingWith(message.user, chatingWith)) return;
    if (!chatingWith.length) {
      await handleDestroyPreviousConnections(true);
    }
    setChatingWith((prev) => {
      return [...prev, user];
    });
    const res = await mutation<{
      friend: { user: UserType; friend: UserType };
      removed: boolean;
      new: boolean;
    } | null>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/friend/${user._id}?add=true`,
      method: "POST",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });
    if (res?.friend && !res.removed) {
      if (res.new) {
        socket?.emit("add-friend", { ...res.friend, friend: message.user });
        const event = new CustomEvent("add-friend", { detail: message.user });
        window.dispatchEvent(event);
      }
      setUser((prev) => {
        return {
          ...prev,
          relationShip: user.relationShip,
        } as UserType;
      });
    }
  };

  useEffect(() => {
    if (!debounceMessage || !messageUpdate) return;
    const abort = new AbortController();
    const updateMessage = async () => {
      const res = await mutation<{ chat: Message | null }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/${message._id}`,
        method: "PUT",
        body: JSON.stringify({ message: debounceMessage }),
        abort,
      });
      if (res?.chat) {
        socket?.emit("message-update", res.chat);
      }
    };
    void updateMessage();
    return () => {
      abort.abort();
    };
  }, [debounceMessage, messageUpdate]);

  useEffect(() => {
    if (
      editableRef.current &&
      editableRef.current.innerText !== message.message
    ) {
      editableRef.current.innerText = message.message;
    }
  }, [message.message]);

  return (
    <>
      <article
        className="flex w-full items-start justify-start gap-x-2 my-2"
        ref={ref}
      >
        <PictureModal
          open={openModal}
          setOpen={setOpenModal}
          src={message.user?.profilePic || defaultProfilePic}
        />
        <div className="flex items-center justify-start">
          {message.user?.profilePic ? (
            <div
              className="w-20 h-30 relative"
              onClick={() => {
                setOpenModal(true);
              }}
            >
              <Image
                fill
                src={message.user?.profilePic}
                alt={message.message}
                objectFit="contain"
                unoptimized
              />
            </div>
          ) : (
            <div
              className="w-20 h-30 relative"
              onClick={() => {
                setOpenModal(true);
              }}
            >
              <Image
                fill
                src={defaultProfilePic}
                alt={message.message}
                style={{ objectFit: "cover" }}
                unoptimized
              />
            </div>
          )}
          <Button
            className="ml-2"
            onClick={() => {
              void handleChatWith();
              handleSetChatType("private");
            }}
            disabled={
              !message.user?._id || !user?._id || user._id === message.user._id
            }
          >
            {message.user?.name || "User"}
          </Button>
        </div>
        <div className="border-2 p-2 w-fit">
          <div className="flex items-center justify-between">
            <DeleteChat message={message} setMessages={setMessages} />
            <Button
              className="!text-right !w-full"
              onClick={() => {
                if (message.user?._id) {
                  localStorage.setItem("id", message.user._id);
                  setProfileId(message.user._id);
                  setCurrentPage(Page.publicProfile);
                }
              }}
              disabled={!message.user?._id}
            >
              {message.user?.race || "Race"}
            </Button>
          </div>
          <p
            className="whitespace-pre-wrap !outline-none !border-0 resize-none break-all min-w-48 my-3 focus:!bg-transparent"
            onInput={(e) => {
              setMessage(e.currentTarget.innerText);
            }}
            onClick={() => {
              setMessageUpdate(true);
            }}
            contentEditable
            suppressContentEditableWarning
            ref={editableRef}
          />

          <p className="text-sm flex gap-x-4 justify-between">
            <span>{formatDate(new Date(message.createdAt)).time}</span>
            <span>{formatDate(new Date(message.createdAt)).date}</span>
          </p>
        </div>
      </article>
      {message.files.length ? (
        <div className="w-fit max-w-full h-40 flex items-center overflow-x-auto gap-x-3 mb-4">
          {message.files.map((file) => {
            return (
              <div
                key={file}
                className="h-full min-w-36  shrink-0 flex items-center justify-center flex-col relative"
              >
                <ShowMessageFilePreview file={file} />
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
