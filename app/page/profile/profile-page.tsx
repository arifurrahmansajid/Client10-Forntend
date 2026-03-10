"use client";
import TabsContent, { Tabs } from "@/app/components/ui/tabs";
import React, { Suspense, useContext, useEffect, useState } from "react";
import ProfileForm from "./components/profile-form";
import { Context, useSocket, useUser } from "@/app/utils/context";
import { UserType } from "@/types/object";
import { BACKGROUN_STYLE, Page } from "@/app/utils/constant";
import { useMutation } from "@/hooks/useMutation";
import Upload from "@/app/components/features/upload";
import Image from "next/image";
import { getCookie, handleSetChatType } from "@/app/utils/utils";
import Button from "@/app/components/ui/button";
import toast from "react-hot-toast";

export default function Profile() {
  const user = useUser();
  const [userDetails, setUserDetails] = useState<UserType | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [deleting, _setDeleting] = useState(false);
  const mutation = useMutation();
  const { setCurrentPage, setUser, setBackgroundStyle } = useContext(Context);
  const socket = useSocket();

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    const token = Date.now();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 3);
    document.cookie = `tmpToken=${token};expires=${expiryDate.toUTCString()}`;
    handleSetChatType("public");
    setCurrentPage(Page.chat);
    socket?.emit("user-disconnected", { id: user?._id, socketId: socket.id });
    setBackgroundStyle({ style: BACKGROUN_STYLE.default, url: "" });
    setUser(undefined);
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await mutation<{ updatedUser: UserType; message: string }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/update-profile`,
      method: "PUT",
      body: JSON.stringify(userDetails),
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });
    setLoading(false);
    if (res) {
      toast.success(res.message);
      setUserDetails(res.updatedUser);
      setUser(res.updatedUser);
      socket?.emit("connected", { ...res.updatedUser, socketID: socket.id });
    }
  };

  const handleDeleteUser = async () => {
    const res = await mutation<{ message: string }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/delete-profile`,
      method: "DELETE",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });
    if (res?.message) {
      toast.success(res.message);
      socket?.emit("user-deleted", user);
      handleLogout();
    }
  };

  useEffect(() => {
    setUserDetails({ ...user, password: "" } as UserType);
  }, [user]);
  return (
    <Suspense>
      <Tabs
        label={["Upload"]}
        defaultValue="Profile"
        className="!justify-center"
        position="start"
      >
        <Button className="cursor-pointer" onClick={handleLogout}>
          Logout
        </Button>
        <Button
          className="cursor-pointer"
          onClick={() => {
            void handleSave();
          }}
          disabled={loading}
        >
          Save
        </Button>
        <Button
          className="cursor-pointer"
          disabled={deleting}
          onClick={() => {
            void handleDeleteUser();
          }}
        >
          Delete
        </Button>
      </Tabs>
      <TabsContent tabValue="Profile">
        <ProfileForm
          userDetails={userDetails}
          setUserDetails={setUserDetails}
        />
      </TabsContent>
      <TabsContent tabValue="Upload">
        <div className="p-6">
          <Upload
            text="Upload Picture"
            accept=".jpg , .jpeg , .png, .svg, .webp, .gif"
            url={`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/update-profile-pic`}
            method="PUT"
            cb={() => {
              window.dispatchEvent(new Event("new-profile-pic"));
            }}
          />
          {userDetails?.profilePic ? (
            <div className="relative w-full h-[48vh] my-3">
              <Image
                src={userDetails?.profilePic}
                fill
                alt="profile pic"
                className="object-contain"
                unoptimized
              />
            </div>
          ) : null}
        </div>
      </TabsContent>
    </Suspense>
  );
}
