"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { UserType, UserWithSocketID } from "@/types/object";
import { useQuery } from "@/hooks/useQuery";
import { getCookie } from "./utils";
import { BACKGROUN_STYLE, Page } from "./constant";
import { Socket, io } from "socket.io-client";

export const Context = createContext<{
  user?: UserType;
  backgroundMusic: string;
  setBackgroundMusic: React.Dispatch<React.SetStateAction<string>>;
  currentPage: Page;
  setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
  currentTab: string;
  setCurrentTab: React.Dispatch<React.SetStateAction<string>>;
  backgrundStyle: { style: BACKGROUN_STYLE; url: string };
  setBackgroundStyle: React.Dispatch<
    React.SetStateAction<{ style: BACKGROUN_STYLE; url: string }>
  >;
  dataDeleted: boolean;
  setDataDeleted: React.Dispatch<React.SetStateAction<boolean>>;
  socket: null | Socket;
  setUser: React.Dispatch<React.SetStateAction<UserType | undefined>>;
  defaultProfilePic: string;
  onlineUsers: UserWithSocketID[];
  setOnlineUsers: React.Dispatch<React.SetStateAction<UserWithSocketID[]>>;
  setProfileId: React.Dispatch<React.SetStateAction<string>>;
  profileID: string;
  friends: UserType[];
  setFriends: React.Dispatch<React.SetStateAction<UserType[]>>;
  token: string | null;
  chatingWith: UserType[];
  setChatingWith: React.Dispatch<React.SetStateAction<UserType[]>>;
  allUsers: UserType[];
  setAllUsers: React.Dispatch<React.SetStateAction<UserType[]>>;
  currentlyChattingWith: null | UserType;
  setCurrentlyChattingWith: React.Dispatch<
    React.SetStateAction<null | UserType>
  >;
  backgroundType: string;
  setBackgroundType: React.Dispatch<React.SetStateAction<string>>;
}>({
  user: undefined,
  backgroundMusic: "",
  setBackgroundMusic: () => {},
  currentPage: Page.chat,
  setCurrentPage: () => {},
  currentTab: "public",
  setCurrentTab: () => {},
  backgrundStyle: { style: BACKGROUN_STYLE.default, url: "" },
  setBackgroundStyle: () => {},
  dataDeleted: false,
  setDataDeleted: () => {},
  socket: null,
  setUser: () => {},
  defaultProfilePic: "/icons/default.png",
  onlineUsers: [],
  setOnlineUsers: () => {},
  setProfileId: () => {},
  profileID: "",
  friends: [],
  setFriends: () => {},
  token: null,
  chatingWith: [],
  setChatingWith: () => {},
  allUsers: [],
  setAllUsers: () => {},
  currentlyChattingWith: null,
  setCurrentlyChattingWith: () => {},
  backgroundType: "",
  setBackgroundType: () => {},
});

export default function GlobalState({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<undefined | UserType>(undefined);
  const [token, setToken] = useState<null | string>(null);
  const [backgroundMusic, setBackgroundMusic] = useState("");
  const [currentPage, setCurrentPage] = useState<Page>(Page.chat);
  const [currentTab, setCurrentTab] = useState("");
  const [defaultProfilePic, _setDefaultProfilePic] =
    useState("/icons/default.png");
  const [backgrundStyle, setBackgroundStyle] = useState<{
    style: BACKGROUN_STYLE;
    url: string;
  }>({ style: BACKGROUN_STYLE.default, url: "" });
  const [dataDeleted, setDataDeleted] = useState(false);
  const [socket, setSocket] = useState<null | Socket>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserWithSocketID[]>([]);
  const [profileID, setProfileId] = useState("");
  const [friends, setFriends] = useState<UserType[]>([]);
  const [chatingWith, setChatingWith] = useState<UserType[]>([]);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [currentlyChattingWith, setCurrentlyChattingWith] =
    useState<UserType | null>(null);
  const [backgroundType, setBackgroundTypeState] = useState(
    (typeof window !== "undefined" && localStorage.getItem("backgroundType")) ||
      "public"
  );

  const setBackgroundType = useCallback(
    (type: React.SetStateAction<string>) => {
      setBackgroundTypeState((prev) => {
        const next = typeof type === "function" ? type(prev) : type;
        if (typeof window !== "undefined") {
          localStorage.setItem("backgroundType", next);
        }
        return next;
      });
    },
    []
  );
  const query = useQuery();

  useEffect(() => {
    setDataDeleted(false);
    setToken(getCookie("token=") || "");
  }, [currentPage]);

  useEffect(() => {
    if (!token) {
      setBackgroundType("public");
    }
  }, [token]);

  useEffect(() => {
    if (token && user) return;
    const getUser = async () => {
      const resp = await query<{ user: UserType | null }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/private-profile`,
        method: "GET",
        headers: {
          Authorization: token || "",
        },
      });
      if (resp?.user) {
        setUser({
          ...resp.user,
        });
        if (resp.user.backgroundType) {
          setBackgroundType(resp.user.backgroundType);
        } else {
          // If no preference in DB, use current or default
          setBackgroundType(backgroundType || "public");
        }
        socket?.emit("connected", {
          ...resp.user,
          socketID: socket?.id,
        });
      } else {
        socket?.emit("connected", {
          ...resp?.user,
          socketID: socket?.id,
        });
      }
    };
    void getUser();
    const abort = new AbortController();
    window.addEventListener(
      "new-profile-pic",
      () => {
        void getUser();
      },
      abort
    );
    socket?.on("new-default-profile-all", () => {
      void getUser();
    });
    socket?.on("user-deleted-all", (deletedUser: UserType) => {
      setChatingWith((prev) => prev.filter((u) => u && deletedUser && u._id !== deletedUser._id));
      setCurrentlyChattingWith((prev) =>
        prev?._id === deletedUser?._id ? null : prev
      );
    });
    return () => {
      abort.abort();
      socket?.emit("user-disconnected", { ud: user?._id, socketId: socket.id });
      socket?.off("new-default-profile-all");
      socket?.off("user-deleted-all");
    };
  }, [token, socket]);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL, {
      reconnection: true, // important!
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      autoConnect: true,
    });
    setSocket(newSocket);

    return () => {
      newSocket.emit("user-disconnected", { socketId: newSocket.id });
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && user) {
      const handleConnect = () => {
        socket.emit("connected", user);
      };
      
      socket.on("connect", handleConnect);
      
      // If already connected when this runs, emit immediately
      if (socket.connected) {
        handleConnect();
      }

      const abort = new AbortController();
      window.addEventListener(
        "beforeunload",
        () => {
          socket?.emit("user-disconnected", {
            id: user?._id,
            socketId: socket?.id,
          });
        },
        abort
      );
      return () => {
        socket.off("connect", handleConnect);
        abort.abort();
      };
    }
  }, [socket, user]);

  return (
    <Context.Provider
      value={{
        user,
        backgroundMusic,
        setBackgroundMusic,
        currentPage,
        setCurrentPage,
        currentTab,
        setCurrentTab,
        backgrundStyle,
        setBackgroundStyle,
        dataDeleted,
        setDataDeleted,
        socket,
        setUser,
        defaultProfilePic,
        onlineUsers,
        setOnlineUsers,
        profileID,
        setProfileId,
        friends,
        setFriends,
        token,
        chatingWith,
        setChatingWith,
        allUsers,
        setAllUsers,
        currentlyChattingWith,
        setCurrentlyChattingWith,
        backgroundType,
        setBackgroundType,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useUser = () => {
  const user = useContext(Context);
  return user.user;
};

export const useSocket = () => {
  const socket = useContext(Context);
  return socket.socket;
};
