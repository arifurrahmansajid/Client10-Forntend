"use client";
import React, { useContext, useEffect, useState } from "react";
import Button from "./button";
import { Friend, UserType, UserWithSocketID } from "@/types/object";
import UserCard from "./user-card";
import { Context, useSocket } from "@/app/utils/context";
import { useQuery } from "@/hooks/useQuery";
import { getCookie } from "@/app/utils/utils";

export default function UserTabs({ users }: { users: UserType[] }) {
  const [tabs, setTabs] = useState<"online" | "registered" | "friends">(
    "online"
  );
  const socket = useSocket();
  const query = useQuery();
  const {
    user: currentUser,
    onlineUsers,
    setOnlineUsers,
    profileID,
    setFriends,
    friends,
  } = useContext(Context);

  useEffect(() => {
    socket?.on("online-users", (data: UserWithSocketID[]) => {
      setOnlineUsers(data);
    });
    socket?.on("friend", (data: UserType) => {
      setFriends((prev) => [...prev, data]);
    });
    socket?.on("user-deleted-all", (deletedUser: UserType) => {
      setOnlineUsers((prev) => prev.filter((u) => u._id !== deletedUser._id));
      setFriends((prev) => prev.filter((u) => u._id !== deletedUser._id));
    });
    return () => {
      socket?.off("online-users");
      socket?.off("friend");
      socket?.off("user-deleted-all");
    };
  }, [socket]);

  useEffect(() => {
    const abort = new AbortController();
    window.addEventListener(
      "add-friend",
      (e) => {
        const event = e as CustomEvent<UserType>;
        setFriends((prev) => {
          return [...prev, event.detail];
        });
      },
      abort
    );
    window.addEventListener(
      "remove-friend",
      (e) => {
        const event = e as CustomEvent<UserType>;
        setFriends((prev) => {
          return prev.filter((user) => user?._id !== event.detail?._id);
        });
      },
      abort
    );
    return () => {
      abort.abort();
    };
  }, []);

  useEffect(() => {
    const getFriends = async () => {
      if (profileID) {
        const res = await query<{
          friends: Friend[];
        }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/profile-friend?user=${profileID}`,
          method: "GET",
        });
        if (res?.friends) {
          setFriends(res.friends.map((friend) => friend.friend));
        }
      } else {
        const res = await query<{
          friends: Friend[];
        }>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/friend`,
          method: "GET",
          headers: {
            Authorization: getCookie("token=") || "",
          },
        });
        if (res?.friends) {
          setFriends(res.friends.map((friend) => friend.friend));
        }
      }
    };
    void getFriends();
    socket?.on("removefriend", getFriends);
    socket?.on("friend-added", getFriends);
    return () => {
      socket?.off("removefriend", getFriends);
      socket?.off("friend-added", getFriends);
    };
  }, [socket, profileID, setFriends, currentUser]);

  return (
    <section className="p-2 w-full lg:w-[30%] self-start lg:mt-19.5">
      <div className={`m-auto flex items-center justify-start gap-x-12`}>
        <Button
          onClick={() => {
            setTabs("online");
          }}
          className="flex gap-x-1"
        >
          Online <span>{Object.keys(onlineUsers).length}</span>
        </Button>
        <Button
          onClick={() => {
            setTabs("registered");
          }}
          className="flex gap-x-1"
        >
          Registered <span>{users.length}</span>
        </Button>
        <Button
          onClick={() => {
            setTabs("friends");
          }}
          className="flex gap-x-1"
          disabled={!currentUser && !profileID}
        >
          Friend <span>{friends.length}</span>
        </Button>
      </div>
      {tabs === "registered" && (
        <div className="w-full h-[calc(100vh_-_9.5rem)] overflow-y-auto">
          {users.map((user) => (
            <UserCard key={user._id} user={user} />
          ))}
        </div>
      )}
      {tabs === "online" && (
        <div className="w-full h-[calc(100vh_-_9.5rem)] overflow-y-auto">
          {onlineUsers.map((user) => {
            return (
              <UserCard
                key={user?._id ?? user?.socketID}
                user={user}
                _admin={currentUser}
              />
            );
          })}
        </div>
      )}
      {tabs === "friends" && (
        <div className="w-full h-[calc(100vh_-_9.5rem)] overflow-y-auto">
          {friends.map((user) => (
            <UserCard key={user._id} user={user} />
          ))}
        </div>
      )}
    </section>
  );
}
