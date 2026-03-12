"use client";
import { UserType, UserWithSocketID } from "@/types/object";
import Image from "next/image";
import React, { useContext, useState } from "react";
import Button from "./button";
import { Context, useSocket } from "@/app/utils/context";
import { useMutation } from "@/hooks/useMutation";
import {
  getCookie,
  handleSetChatType,
  isAlreadyChatingWith,
} from "@/app/utils/utils";
import { Page } from "@/app/utils/constant";
import PictureModal from "../features/picture-modal";
import { useVideoCall } from "@/app/utils/video-call-context";
import toast from "react-hot-toast";

export default function UserCard({
  user,
  _admin,
}: {
  user: UserType | UserWithSocketID;
  _admin?: UserType;
}) {
  const {
    user: currentUser,
    defaultProfilePic,
    setCurrentPage,
    setUser,
    setProfileId,
    setChatingWith,
    chatingWith,
  } = useContext(Context);
  const mutation = useMutation();
  const socket = useSocket();
  const [openModal, setOpenModal] = useState(false);
  const { handleDestroyPreviousConnections } = useVideoCall();

  const handleChatWithThisUser = async () => {
    if (!currentUser || !user.email) return;
    if (user._id === currentUser._id) return;
    if (isAlreadyChatingWith(user, chatingWith)) {
      const event = new CustomEvent("already-chatting", { detail: user });
      window.dispatchEvent(event);
      return;
    }
    if (!chatingWith.length) {
      await handleDestroyPreviousConnections(true);
    }
    setChatingWith((prev) => {
      return [...prev, user];
    });
    const event = new CustomEvent("add-friend", { detail: user });
    window.dispatchEvent(event);
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
        socket?.emit("add-friend", { ...res.friend, friend: user });
      }
      setUser((prev) => {
        return {
          ...prev,
          relationShip: user.name,
        } as UserType;
      });
    }
  };

  const handleAdminDeleteUser = async () => {
    if (!confirm(`Are you sure you want to delete user ${user.name}?`)) return;
    const res = await mutation<{ message: string }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${user._id}`,
      method: "DELETE",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });
    if (res) {
      toast.success(res.message);
      socket?.emit("user-deleted", user);
    }
  };
  return (
    <article className="w-[25rem] flex items-center justify-between my-1 pr-[1rem] overflow-hidden">
      <PictureModal
        open={openModal}
        setOpen={setOpenModal}
        src={user?.profilePic || defaultProfilePic}
      />
      <div className="w-full flex items-center justify-start">
        <div
          className="w-20 h-30 relative shrink-0"
          onClick={() => {
            setOpenModal(true);
          }}
        >
          {user?.profilePic ? (
            <Image
              src={user?.profilePic}
              alt={user.name}
              fill
              className="object-contain"
              unoptimized
            />
          ) : (
            <Image
              src={defaultProfilePic}
              alt={user.name}
              fill
              className="object-contain"
              unoptimized
            />
          )}
        </div>
        <div className="w-full flex items-center justify-start overflow-auto">
          <Button
            className="mx-2"
            onClick={() => {
              void handleChatWithThisUser();
              handleSetChatType("private");
              setCurrentPage(Page.chat);
            }}
            disabled={
              !user._id || user._id === currentUser?._id || !currentUser
            }
          >
            {user.name}
          </Button>
          {currentUser?.roles.includes("admin") && user.ip && (
            <span className="text-xs text-red-500 mx-2">{user.ip}</span>
          )}
          <Button
            className="ml-auto"
            onClick={() => {
              if (user._id) {
                localStorage.setItem("id", user._id);
                setCurrentPage(Page.publicProfile);
                setProfileId(user._id);
              }
            }}
            disabled={!user._id}
          >
            {user.race}
          </Button>
          {currentUser?.roles.includes("admin") &&
            user._id !== currentUser?._id && (
              <Button
                className="ml-2 !bg-red-600 hover:!bg-red-700 text-xs px-2"
                onClick={() => {
                  void handleAdminDeleteUser();
                }}
              >
                Delete
              </Button>
            )}
        </div>
      </div>
    </article>
  );
}
