"use client";
import { IMAGES, MUSIC, VIDEOS } from "@/app/utils/constant";
import {
  handleGetSlicedName,
  IsPreviewSupportedAndShowPreview,
} from "@/app/utils/utils";
import Image from "next/image";
import React, { useState } from "react";
import PictureModal from "./picture-modal";
import Button from "../ui/button";

export default function ShowMessageFilePreview({ file }: { file: string }) {
  const preview = IsPreviewSupportedAndShowPreview(file);
  const [openModal, setOpenModal] = useState(false);

  const downloadFile = async (file: string) => {
    const res = await fetch(file); // or some external URL
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = file.replace(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/public/`,
      ""
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (!preview.supported) {
    return (
      <>
        <Image
          src="/icons/send-file.png"
          width={44}
          height={44}
          alt="Uploading File"
          unoptimized
        />
        <span className="text-sm text-center mt-2 mb-1">
          {handleGetSlicedName(
            file.replace(`${process.env.NEXT_PUBLIC_BACKEND_URL}/public/`, "")
          )}
        </span>
        <Button
          onClick={() => {
            void downloadFile(file);
          }}
        >
          <Image
            src="/icons/download.png"
            width={28}
            height={28}
            alt={`download ${file}`}
          />
        </Button>
      </>
    );
  }
  if (IMAGES.includes(preview.type)) {
    return (
      <>
        <PictureModal
          open={openModal}
          setOpen={setOpenModal}
          src={preview.preview}
        />
        <Image
          src={preview.preview}
          fill
          alt="Image Preview"
          unoptimized
          onClick={() => {
            setOpenModal(true);
          }}
        />
      </>
    );
  }
  if (VIDEOS.includes(preview.type)) {
    return (
      <>
        <video
          src={file}
          className="object-fill w-full h-full"
          controls
        ></video>
      </>
    );
  }
  if (MUSIC.includes(preview.type)) {
    return <audio src={preview.preview} controls className="w-75" />;
  }
}
