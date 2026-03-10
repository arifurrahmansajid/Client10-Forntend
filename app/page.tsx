"use client";
import React, { useContext, useEffect } from "react";
import { Context } from "./utils/context";
import { Page } from "./utils/constant";
import Chat from "./components/features/chat"; // Eager load Chat
import Navbar from "./components/ui/navbar";
import toast from "react-hot-toast";
import { getCookie } from "./utils/utils";
import { useQuery } from "@/hooks/useQuery";

export default function Home() {
  const { currentPage } = useContext(Context);
  const query = useQuery();

  // Lazy components
  const [components, setComponents] = React.useState<{
    GIF: null | (() => React.JSX.Element);
    ImagePage: null | (() => React.JSX.Element);
    Music: null | (() => React.JSX.Element);
    Video: null | (() => React.JSX.Element);
    Register: null | (() => React.JSX.Element);
    Profile: null | (() => React.JSX.Element);
    PublicProfile: null | (() => React.JSX.Element);
    AdminPage: null | (() => React.JSX.Element);
  }>({
    GIF: null,
    ImagePage: null,
    Music: null,
    Video: null,
    Register: null,
    Profile: null,
    PublicProfile: null,
    AdminPage: null,
  });

  // Load additional pages after initial render
  useEffect(() => {
    localStorage.removeItem("user");

    // Manually preload rest of the pages
    Promise.all([
      import("./page/gif/gif-page"),
      import("./page/image/image-page"),
      import("./page/music/music-page"),
      import("./page/video/video-page"),
      import("./page/register/register-page"),
      import("./page/profile/profile-page"),
      import("./page/public-profile/public-profile"),
      import("./page/admin/admin-page"),
    ])
      .then(
        ([GIF, ImagePage, Music, Video, Register, Profile, PublicProfile, AdminPage]) => {
          setComponents({
            GIF: GIF.default,
            ImagePage: ImagePage.default,
            Music: Music.default,
            Video: Video.default,
            Register: Register.default,
            Profile: Profile.default,
            PublicProfile: PublicProfile.default,
            AdminPage: AdminPage.default,
          });
        }
      )
      .catch((err) => {
        toast.error((err as Error).message);
      });
  }, []);

  useEffect(() => {
    const handleSetCookie = async () => {
      const res = await query<{ token: string }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/token`,
        method: "GET",
      });
      const cookieExists = getCookie("token=");
      if (!cookieExists) {
        if (res?.token) {
          document.cookie = `token=${res.token}; path=/;`;
        }
      }
    };
    void handleSetCookie();
  }, []);

  const { GIF, ImagePage, Music, Video, Register, Profile, PublicProfile, AdminPage } =
    components;

  return (
    <section className="h-fit">
      <div className="hidden lg:block">
        <Navbar />
      </div>

      {currentPage === Page.chat && <Chat />}
      {currentPage === Page.gif && GIF && <GIF />}
      {currentPage === Page.image && ImagePage && <ImagePage />}
      {currentPage === Page.music && Music && <Music />}
      {currentPage === Page.video && Video && <Video />}
      {currentPage === Page.register && Register && <Register />}
      {currentPage === Page.profile && Profile && <Profile />}
      {currentPage === Page.publicProfile && PublicProfile && <PublicProfile />}
      {currentPage === Page.admin && AdminPage && <AdminPage />}
    </section>
  );
}
