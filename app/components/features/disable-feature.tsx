"use client";
import { useUser } from "@/app/utils/context";
import useDisable from "@/hooks/useDisable";
import React from "react";
import Button from "../ui/button";

interface DisbaleFeatureProps {
  path: string;
}

export default function DisbaleFeature({ path }: DisbaleFeatureProps) {
  const {
    handleDisbale,
    chatDisabled,
    uploadDisabled,
    deleteDisabled,
    musicDisabled,
    backgroundDisabled,
  } = useDisable(path);
  const user = useUser();
  if (!user || !user.roles.includes("admin")) return null;
  const handleRenderProperButton = () => {
    switch (path) {
      case "/chat":
        return chatDisabled ? "Enable Chat" : "Disable Chat";

      case "/upload":
        return uploadDisabled ? "Enable Upload" : "Disable Upload";

      case "/delete":
        return deleteDisabled ? "Enable Delete" : "Disable Delete";

      case "/music":
        return musicDisabled ? "Enable Music" : "Disable Music";

      case "/bg":
        return backgroundDisabled ? "Enable Background" : "Disable Background";

      default:
        return "Toggle";
    }
  };
  return (
    <Button
      onClick={() => {
        void handleDisbale();
      }}
    >
      {handleRenderProperButton()}
    </Button>
  );
}
