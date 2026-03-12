import TabsContent, { Tabs } from "@/app/components/ui/tabs";
import React, { Suspense } from "react";
import Upload from "@/app/components/features/upload";
import ImageContainer from "./component/image-container";
import DeleteImages from "./component/delete-images";
import DisbaleFeature from "@/app/components/features/disable-feature";

export default function ImagePage() {
  return (
    <Suspense>
      <Tabs
        label={["Public", "Private", "Upload Public", "Upload Private"]}
        position="end"
        defaultValue="Public"
      >
        <DeleteImages />
        <DisbaleFeature path="/bg" />
        <DisbaleFeature path="/upload" />
        <DisbaleFeature path="/delete" />
      </Tabs>
      <TabsContent tabValue="Public">
        <ImageContainer />
      </TabsContent>
      <TabsContent tabValue="Private">
        <ImageContainer />
      </TabsContent>
      <TabsContent tabValue="Upload Public">
        <div className="w-full py-2">
          <Upload
            text="Upload Public Picture"
            accept=".jpg , .jpeg , .png, .svg, .webp"
            multiple
            method="POST"
            url={`${process.env.NEXT_PUBLIC_BACKEND_URL}/images`}
            publicUpload
          />
        </div>
      </TabsContent>
      <TabsContent tabValue="Upload Private">
        <div className="w-full py-2">
          <Upload
            text="Upload Private Picture"
            accept=".jpg , .jpeg , .png, .svg, .webp"
            multiple
            method="POST"
            url={`${process.env.NEXT_PUBLIC_BACKEND_URL}/images`}
          />
        </div>
      </TabsContent>
    </Suspense>
  );
}
