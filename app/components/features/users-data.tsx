"use client";
import React, { useContext, useEffect } from "react";
import { UserType } from "@/types/object";
import UserTabs from "../ui/user-tabs";
import { useQuery } from "@/hooks/useQuery";
import { Context, useSocket } from "@/app/utils/context";

export default function UsersData() {
  const query = useQuery();
  const socket = useSocket();
  const { allUsers, setAllUsers, user } = useContext(Context);
  useEffect(() => {
    const getUsers = async () => {
      const res = await query<{ users: UserType[] }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users`,
        method: "GET",
      });
      if (res?.users) {
        setAllUsers(res.users);
      }
    };
    void getUsers();
    socket?.on("new-user-registered-all", getUsers);
    socket?.on("user-deleted-all", (deletedUser: UserType) => {
      setAllUsers((prev) => prev.filter((u) => u._id !== deletedUser._id));
    });
    return () => {
      socket?.off("new-user-registered-all", getUsers);
      socket?.off("user-deleted-all");
    };
  }, [socket]);

  useEffect(() => {
    if (user) {
      if (socket) {
        socket?.emit("new-user-registered");
      }
      setAllUsers((prev) => {
        return prev.map((u) => {
          if (u._id === user._id) {
            return user;
          }
          return u;
        });
      });
    }
  }, [setAllUsers, user, socket]);

  return (
    <>
      <UserTabs users={allUsers} />
    </>
  );
}
