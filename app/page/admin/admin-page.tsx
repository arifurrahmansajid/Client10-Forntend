"use client";
import React, { Suspense } from "react";
import TabsContent, { Tabs } from "@/app/components/ui/tabs";
import DisbaleFeature from "@/app/components/features/disable-feature";

export default function AdminPage() {
  return (
    <Suspense>
      <div className="p-6 max-w-6xl m-auto">
        <h1 className="text-3xl font-bold mb-8 border-b pb-4">Admin Dashboard</h1>
        
        <Tabs
          label={["System Controls", "Information"]}
          position="start"
          defaultValue="System Controls"
        >
        </Tabs>

        <TabsContent tabValue="System Controls">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div className="p-6 bg-secondary/20 rounded-xl border border-border flex flex-col items-center gap-4 transition-all hover:shadow-lg">
                <span className="text-lg font-semibold">Enable/Disable Chat</span>
                <p className="text-sm text-center text-muted-foreground">Toggle the global chat system visibility and functionality.</p>
                <DisbaleFeature path="/chat" />
            </div>
            <div className="p-6 bg-secondary/20 rounded-xl border border-border flex flex-col items-center gap-4 transition-all hover:shadow-lg">
                <span className="text-lg font-semibold">File Uploads</span>
                <p className="text-sm text-center text-muted-foreground">Control whether users can upload new files to the platform.</p>
                <DisbaleFeature path="/upload" />
            </div>
            <div className="p-6 bg-secondary/20 rounded-xl border border-border flex flex-col items-center gap-4 transition-all hover:shadow-lg">
                <span className="text-lg font-semibold">Delete Controls</span>
                <p className="text-sm text-center text-muted-foreground">Toggle the ability for users to delete their own content.</p>
                <DisbaleFeature path="/delete" />
            </div>
            <div className="p-6 bg-secondary/20 rounded-xl border border-border flex flex-col items-center gap-4 transition-all hover:shadow-lg">
                <span className="text-lg font-semibold">Music System</span>
                <p className="text-sm text-center text-muted-foreground">Control global background music playback and settings.</p>
                <DisbaleFeature path="/music" />
            </div>
            <div className="p-6 bg-secondary/20 rounded-xl border border-border flex flex-col items-center gap-4 transition-all hover:shadow-lg">
                <span className="text-lg font-semibold">Background Visuals</span>
                <p className="text-sm text-center text-muted-foreground">Toggle background image and video features globally.</p>
                <DisbaleFeature path="/bg" />
            </div>
          </div>
        </TabsContent>

        <TabsContent tabValue="Information">
          <div className="mt-6 p-6 bg-secondary/10 rounded-xl border border-dashed text-center">
            <h3 className="text-xl font-medium mb-2">Extended Admin View</h3>
            <p className="text-muted-foreground">Use the sidebar to view all Registered and Online users. As an admin, you can now see IP addresses and delete users directly from their profiles.</p>
          </div>
        </TabsContent>
      </div>
    </Suspense>
  );
}
