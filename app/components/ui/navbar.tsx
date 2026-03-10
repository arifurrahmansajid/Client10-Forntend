"use client";
import { Page } from "@/app/utils/constant";
import React, { useContext } from "react";
import Button from "./button";
import { Context, useSocket } from "@/app/utils/context";
import { handleSetChatType } from "@/app/utils/utils";
import { useVideoCall } from "@/app/utils/video-call-context";

export default function Navbar() {
  const {
    setCurrentPage,
    user,
    setCurrentTab,
    setProfileId,
    setCurrentlyChattingWith,
    currentlyChattingWith,
  } = useContext(Context);
  const { handleDestroyPreviousConnections } = useVideoCall();
  const socket = useSocket();
  return (
    <header className="h-16 w-full py-2 p-2 lg:p-0 lg:pr-2">
      <nav className="w-full m-auto">
        <ul className="h-16 w-full flex items-center justify-between flex-wrap">
          <li>
            <Button
              onClick={() => {
                if (socket) {
                  socket.emit("join-room", "public");
                }
                if (currentlyChattingWith) {
                  void handleDestroyPreviousConnections(true).then(() => {
                    setCurrentPage(Page.chat);
                    setCurrentTab("public");
                    setProfileId("");
                    setCurrentlyChattingWith(null);
                    handleSetChatType("public");
                  });
                }
                setCurrentPage(Page.chat);
                setCurrentTab("public");
                setProfileId("");
                setCurrentlyChattingWith(null);
                handleSetChatType("public");
              }}
            >
              Chat
            </Button>
          </li>
          <li>
            <Button
              onClick={() => {
                setCurrentPage(Page.image);
                setCurrentTab("public");
                setProfileId("");
              }}
            >
              Picture
            </Button>
          </li>
          <li>
            <Button
              onClick={() => {
                setCurrentPage(Page.gif);
                setCurrentTab("public");
                setProfileId("");
              }}
            >
              Gif
            </Button>
          </li>
          <li>
            <Button
              onClick={() => {
                setCurrentPage(Page.video);
                setCurrentTab("public");
                setProfileId("");
              }}
            >
              Video
            </Button>
          </li>
          <li>
            <Button
              onClick={() => {
                setCurrentPage(Page.music);
                setCurrentTab("public");
                setProfileId("");
              }}
            >
              Music
            </Button>
          </li>
          {user?.roles.includes("admin") && (
            <li>
              <Button
                onClick={() => {
                  setCurrentPage(Page.admin);
                  setProfileId("");
                  setCurrentTab("");
                }}
              >
                Admin
              </Button>
            </li>
          )}
          <li>
            <Button
              onClick={() => {
                setCurrentPage(Page.register);
                setProfileId("");
                if (user) {
                  setCurrentTab("profile");
                } else {
                  setCurrentTab("");
                }
              }}
            >
              User
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
