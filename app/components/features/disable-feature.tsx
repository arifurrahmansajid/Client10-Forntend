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
        if (chatDisabled) return "Disable Chat";
        return "Enable Chat";

      case "/upload":
        if (uploadDisabled) return "Disable Upload";
        return "Enable Upload";

      case "/delete":
        if (deleteDisabled) return "Disable Delete";
        return "Enable Delete";
      case "/music":
        if (musicDisabled) return "Disable Background";
        return "Enable Background";
      case "/bg":
        if (backgroundDisabled) return "Disable Background";
        return "Enable Background";

      default:
        break;
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
