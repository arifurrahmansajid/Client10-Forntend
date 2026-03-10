import TabsContent, { Tabs } from "@/app/components/ui/tabs";
import React, { Suspense } from "react";
import Upload from "@/app/components/features/upload";
import VideoContainer from "./component/video-container";
import DeletePublic from "./component/delete-public";
import DisbaleFeature from "@/app/components/features/disable-feature";

export default function Video() {
  return (
    <Suspense>
      <Tabs
        label={["Public", "Private", "Upload Public", "Upload Private"]}
        position="end"
        defaultValue="Public"
      >
        <DeletePublic />
        <DisbaleFeature path="/bg" />
        <DisbaleFeature path="/upload" />
        <DisbaleFeature path="/delete" />
      </Tabs>
      <TabsContent tabValue="Public">
        <VideoContainer />
      </TabsContent>
      <TabsContent tabValue="Private">
        <VideoContainer />
      </TabsContent>
      <TabsContent tabValue="Upload Public">
        <div className="w-full py-2">
          <Upload
            text="Upload Public Video"
            accept="video/*, .mkv"
            multiple
            method="POST"
            url={`${process.env.NEXT_PUBLIC_BACKEND_URL}/videos`}
            publicUpload
          />
        </div>
      </TabsContent>
      <TabsContent tabValue="Upload Private">
        <div className="w-full py-2">
          <Upload
            text="Upload Private Video"
            accept="video/*, .nkv"
            multiple
            method="POST"
            url={`${process.env.NEXT_PUBLIC_BACKEND_URL}/videos`}
          />
        </div>
      </TabsContent>
    </Suspense>
  );
}
