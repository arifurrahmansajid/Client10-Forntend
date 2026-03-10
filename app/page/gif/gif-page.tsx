import TabsContent, { Tabs } from "@/app/components/ui/tabs";
import React, { Suspense } from "react";
import Upload from "@/app/components/features/upload";
import GifContainer from "./component/gif-container";
import DeletePublicGIF from "./component/delete-pubic";
import DisbaleFeature from "@/app/components/features/disable-feature";

export default function GIF() {
  return (
    <Suspense>
      <Tabs
        label={["Public", "Private", "Upload Public", "Upload Private"]}
        position="end"
        defaultValue="Public"
      >
        <DeletePublicGIF />
        <DisbaleFeature path="/bg" />
        <DisbaleFeature path="/upload" />
        <DisbaleFeature path="/delete" />
      </Tabs>
      <TabsContent tabValue="Public">
        <GifContainer />
      </TabsContent>
      <TabsContent tabValue="Private">
        <GifContainer />
      </TabsContent>
      <TabsContent tabValue="Upload Public">
        <div className="w-full py-2">
          <Upload
            text="Upload Public Gif"
            accept=".gif"
            method="POST"
            url={`${process.env.NEXT_PUBLIC_BACKEND_URL}/gif`}
            multiple
            publicUpload
          />
        </div>
      </TabsContent>
      <TabsContent tabValue="Upload Private">
        <div className="w-full py-2">
          <Upload
            text="Upload Private Gif"
            accept=".gif"
            method="POST"
            url={`${process.env.NEXT_PUBLIC_BACKEND_URL}/gif`}
            multiple
          />
        </div>
      </TabsContent>
    </Suspense>
  );
}
