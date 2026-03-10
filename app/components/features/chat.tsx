"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import Button from "../ui/button";
import { Message, UserType } from "@/types/object";
import { useMutation } from "@/hooks/useMutation";
import { getCookie, handleSetChatType } from "@/app/utils/utils";
import MessageCard from "../ui/message-card";
import { useQuery } from "@/hooks/useQuery";
import DeleteAllMessages from "./delete-all-message";
import { Context, useSocket } from "@/app/utils/context";
import UploadChatFiles, { MessageFiles } from "./upload-chat-files";
import { useVideoCall } from "@/app/utils/video-call-context";
import Room from "@/app/page/video-call/video-call";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import useDisable from "@/hooks/useDisable";

export default function Chat() {
  const [messages, setMessage] = useState<Message[]>([]);
  const [messageFiles, setMessageFiles] = useState<MessageFiles[]>([]);
  const [message, setMsg] = useState("");
  const [previews, setPreviews] = useState<MessageFiles[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);

  const mutation = useMutation();
  const query = useQuery();
  const ref = useRef<HTMLButtonElement | null>(null);
  const messageRef = useRef<null | HTMLDivElement>(null);
  const textAreaRef = useRef<null | HTMLTextAreaElement>(null);
  const inputRef = useRef<null | HTMLInputElement>(null);
  const socket = useSocket();
  const {
    friends,
    chatingWith,
    setChatingWith,
    currentlyChattingWith,
    setCurrentlyChattingWith,
  } = useContext(Context);
  const { room, setRoom } = useVideoCall();
  const { chatDisabled } = useDisable("/chat");

  const handleSendMessage = async (
    e?: React.FormEvent<HTMLFormElement>,
    roomId?: string
  ) => {
    e?.preventDefault();
    
    // Prevent multiple submissions
    if (isSendingRef.current) {
      return;
    }
    
    const formData = new FormData(e?.currentTarget);
    const message = formData.get("message") as string;
    if (!message && !previews.length) return;
    
    // Set sending state
    setIsSending(true);
    isSendingRef.current = true;
    
    try {
      const res = await mutation<{ chat: Message; user: UserType | null }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat`,
      method: "POST",
      headers: {
        Authorization: getCookie("token=") || "",
      },
        body: JSON.stringify({
          message: roomId || message,
          sentTo: currentlyChattingWith?._id,
          files: previews.map((file) => file.url),
          token: getCookie("access_token="),
        }),
      });
      if (res?.chat) {
        previews.forEach((file) => URL.revokeObjectURL(file.preview!));
        setMsg("");
        setMessageFiles([]);
        if (textAreaRef.current) {
          textAreaRef.current.value = "";
        }
        if (currentlyChattingWith) {
          socket?.emit("personal-message", {
            ...res.chat,
            sentBy: res.user,
            user: res.user,
            sentTo: currentlyChattingWith,
          });
          setMessage((prev) => [
            ...prev,
            {
              ...res.chat,
              sentBy: res.user,
              user: res.user,
            },
          ]);
          return;
        }

        socket?.emit("message-all", {
          ...res.chat,
          sentBy: res.user,
          user: res.user,
        });
      }
    } finally {
      // Reset sending state
      setIsSending(false);
      isSendingRef.current = false;
    }
  };
  useEffect(() => {
    const chat = localStorage.getItem("chat") as string;
    if (chat === "private") {
      if (!currentlyChattingWith) return;
      const getChats = async () => {
        const res = await query<{ chats: Message[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?chatingWith=${currentlyChattingWith._id}`,
          method: "GET",
          headers: {
            Authorization: getCookie("token=") || "",
          },
        });
        if (res?.chats) {
          setMessage(res.chats);
        }
      };
      void getChats();
    } else {
      const getChats = async () => {
        const res = await query<{ chats: Message[] }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat?chatingWith=`,
          method: "GET",
          headers: {
            Authorization: getCookie("token=") || "",
          },
        });
        if (res?.chats) {
          setMessage(res.chats);
        }
      };
      void getChats();
    }
  }, [currentlyChattingWith, friends]);

  useEffect(() => {
    const abort = new AbortController();
    window.addEventListener(
      "message-delete",
      () => {
        setMessage([]);
      },
      abort
    );
    window.addEventListener(
      "already-chatting",
      (e) => {
        const event = e as CustomEvent<UserType>;
        setCurrentlyChattingWith(event.detail);
      },
      abort
    );
    return () => {
      abort.abort();
    };
  }, [setCurrentlyChattingWith]);

  useEffect(() => {
    const chat = localStorage.getItem("chat") as string;
    setChatingWith(friends);
    if (chat === "private") {
      handleSetChatType("private");
      setCurrentlyChattingWith(friends[friends.length - 1]);
    } else {
      setCurrentlyChattingWith(null);
      handleSetChatType("public");
    }
  }, [friends, setChatingWith, setCurrentlyChattingWith]);

  useEffect(() => {
    if (!currentlyChattingWith?._id) {
      socket?.emit("join-room", "public");
      setRoom("public");
    }
  }, [currentlyChattingWith, socket, setRoom]);

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (showPicker) {
      const removeBorderRadius = () => {
        // Find the em-emoji-picker custom element
        const emojiPicker = document.querySelector("em-emoji-picker");
        if (emojiPicker) {
          // Access the shadow root
          const shadowRoot = emojiPicker.shadowRoot;
          if (shadowRoot) {
            // Find the #root element inside shadow DOM
            const rootElement = shadowRoot.querySelector("#root") as HTMLElement;
            if (rootElement) {
              rootElement.style.borderRadius = "0";
              rootElement.style.setProperty("border-radius", "0", "important");
            }
            
            // Also inject a style tag into shadow root to override all border-radius
            let styleTag = shadowRoot.querySelector("style#custom-border-radius") as HTMLStyleElement;
            if (!styleTag) {
              styleTag = document.createElement("style");
              styleTag.id = "custom-border-radius";
              shadowRoot.appendChild(styleTag);
            }
            styleTag.textContent = `
              #root {
                border-radius: 0 !important;
              }
              #root * {
                border-radius: 0 !important;
              }
            `;
          }
        }
      };

      // Run immediately and after delays to ensure shadow DOM is ready
      removeBorderRadius();
      const timeout1 = setTimeout(removeBorderRadius, 50);
      const timeout2 = setTimeout(removeBorderRadius, 150);
      const timeout3 = setTimeout(removeBorderRadius, 300);

      // Use MutationObserver to catch when shadow DOM is added
      const observer = new MutationObserver(() => {
        removeBorderRadius();
      });

      // Observe document body for when emoji picker is added
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
        clearTimeout(timeout3);
        observer.disconnect();
      };
    }
  }, [showPicker]);

  useEffect(() => {
    socket?.on("message-to-all", (data: Message) => {
      setMessage((prev) => [...prev, data]);
    });
    socket?.on("messages-delete-all", () => {
      setMessage([]);
    });
    socket?.on("personal-message-to-user", (data: Message) => {
      setMessage((prev) => [...prev, data]);
    });
    socket?.on("all-private-messages-delete", () => {
      setMessage([]);
    });
    socket?.on("message-update-all", (data: Message) => {
      setMessage((prev) => {
        return prev.map((message) => {
          if (message._id === data._id) {
            return data;
          }
          return message;
        });
      });
    });
    socket?.on("removefriend", () => {});

    return () => {
      socket?.off("message-to-all");
      socket?.off("messages-delete-all");
      socket?.off("personal-message-to-user");
      socket?.off("all-private-messages-delete");
      socket?.off("message-update-all");
    };
  }, [socket]);

  const filesWithoutURL = previews.find((file) => !file.url);

  return (
    <section className="h-[calc(100vh_-_8rem)] p-1 lg:p-0 flex flex-col justify-start self-start mt-1.5 relative">
      <DeleteAllMessages
        chatingWith={chatingWith}
        _setChatingWith={setChatingWith}
        setCurrentlyChattingWith={setCurrentlyChattingWith}
        _currentlyChattingWith={currentlyChattingWith}
      />
      <div className="h-[50vh] overflow-y-auto scroll-smooth w-full grow">
        {messages.map((message, idx) => {
          if (message.roomId) return null;
          return (
            <MessageCard
              message={message}
              key={`${message._id}-${message.message}`}
              ref={idx === messages.length - 1 ? messageRef : null}
              setMessage={setMessage}
            />
          );
        })}
      </div>
      <form
        className="h-auto flex justify-between w-full items-stretch flex-col relative"
        onSubmit={(e) => {
          void handleSendMessage(e);
        }}
      >
        <UploadChatFiles
          files={messageFiles}
          previews={previews}
          setPreviews={setPreviews}
        />
        <div className="h-auto flex justify-between w-full items-stretch relative flex-wrap">
          {showPicker && (
            <div className="absolute z-50 left-0 bottom-full">
              <Picker
                data={data}
                onEmojiSelect={(emoji: { native: string }) => {
                  setMsg(message + emoji.native);
                }}
                theme="dark"
              />
            </div>
          )}
          <textarea
            className="min-h-32 h-auto min-w-40 resize-y flex-grow border-2 outline-none flex-1 max-h-[240px] focus:!outline-0 focus:!border-2 focus:!bg-transparent"
            name="message"
            ref={textAreaRef}
            value={message}
            onChange={(e) => {
              setMsg(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                e.preventDefault();
                // Prevent submission if already sending
                if (isSendingRef.current) {
                  return;
                }
                const form = e.currentTarget.closest("form");
                if (form) {
                  form.requestSubmit();
                }
              }
            }}
          ></textarea>
          <Button
            type="submit"
            className="!px-6 border-2 border-l-0 h-auto"
            ref={ref}
            disabled={
              (filesWithoutURL && !message) ||
              (!previews.length && !message) ||
              chatDisabled ||
              isSending
            }
            onClick={() => {
              setShowPicker(false);
            }}
          >
            Send
          </Button>
          <Button
            className="!px-6 border-2 border-l-0 h-auto"
            onClick={(e) => {
              e.preventDefault();
              setShowPicker((prev) => !prev);
            }}
            disabled={chatDisabled}
          >
            Emoji
          </Button>
          <Button
            className="!px-6 border-2 border-l-0 h-auto"
            onClick={(e) => {
              e.preventDefault();
              if (inputRef.current) {
                inputRef.current.value = "";
              }
              inputRef.current?.click();
            }}
            disabled={chatDisabled}
          >
            File
          </Button>
          <Room
            roomId={room}
            sendRoomMessage={handleSendMessage}
            chattingWith={currentlyChattingWith}
          />
          <input
            type="file"
            ref={inputRef}
            multiple
            className="hidden"
            onChange={(e) => {
              if (!e.target.files) return;
              setMessageFiles([]);
              for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                setMessageFiles((prev) => {
                  return [...prev, { file, aborted: false, progress: 0 }];
                });
              }
            }}
          />
        </div>
      </form>
    </section>
  );
}
