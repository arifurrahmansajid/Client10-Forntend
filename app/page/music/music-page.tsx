import TabsContent, { Tabs } from "@/app/components/ui/tabs";
import React, { Suspense } from "react";
import Upload from "@/app/components/features/upload";
import DeleteMusic from "./component/delete-music";
import MusicContainer from "./component/music-container";
import DisbaleFeature from "@/app/components/features/disable-feature";

export default function Music() {
  return (
    <Suspense>
      <Tabs
        label={["Public", "Private", "Upload Public", "Upload Private"]}
        position="end"
        defaultValue="Public"
      >
        <DeleteMusic />
        <DisbaleFeature path="/music" />
        <DisbaleFeature path="/upload" />
        <DisbaleFeature path="/delete" />
      </Tabs>
      <TabsContent tabValue="Public">
        <MusicContainer />
      </TabsContent>
      <TabsContent tabValue="Private">
        <MusicContainer />
      </TabsContent>
      <TabsContent tabValue="Upload Public">
        <div className="w-full py-2">
          <Upload
            text="Upload Public Music"
            accept="audio/*"
            url={`${process.env.NEXT_PUBLIC_BACKEND_URL}/music`}
            method="POST"
            multiple
            publicUpload
          />
        </div>
      </TabsContent>
      <TabsContent tabValue="Upload Private">
        <div className="w-full py-2">
          <Upload
            text="Upload Private Music"
            accept="audio/*"
            url={`${process.env.NEXT_PUBLIC_BACKEND_URL}/music`}
            method="POST"
            multiple
          />
        </div>
      </TabsContent>
    </Suspense>
  );
}
