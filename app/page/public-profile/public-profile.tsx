"use client";
import { useQuery } from "@/hooks/useQuery";
import { UserType } from "@/types/object";
import React, { useContext, useEffect, useState } from "react";
import ProfileForm from "../profile/components/profile-form";
import { Context } from "@/app/utils/context";
import TabsContent, { Tabs } from "@/app/components/ui/tabs";
import GifContainer from "../gif/component/gif-container";
import ImageContainer from "../image/component/image-container";
import VideoContainer from "../video/component/video-container";
import MusicContainer from "../music/component/music-container";

export default function PubLicProfile() {
  const [profile, setProfile] = useState<UserType | undefined>(undefined);
  const { profileID } = useContext(Context);
  const query = useQuery();
  useEffect(() => {
    if (!profileID) return;
    const getProfile = async () => {
      const res = await query<{ user: UserType }>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/public-profile/${profileID}`,
        method: "GET",
      });
      if (res?.user) {
        setProfile(res.user);
      }
    };
    void getProfile();
  }, [profileID]);
  return (
    <>
      <Tabs
        label={["Profile", "Picture", "Gif", "Video", "Music"]}
        defaultValue="Profile"
        className="!justify-center"
      />
      <TabsContent tabValue="Profile">
        <ProfileForm userDetails={profile} setUserDetails={setProfile} />
      </TabsContent>
      <TabsContent tabValue="Gif">
        <GifContainer />
      </TabsContent>
      <TabsContent tabValue="Picture">
        <ImageContainer />
      </TabsContent>
      <TabsContent tabValue="Video">
        <VideoContainer />
      </TabsContent>
      <TabsContent tabValue="Music">
        <MusicContainer />
      </TabsContent>
    </>
  );
}
