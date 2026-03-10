import React, { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import Button from "../ui/button";
import Image from "next/image";
import { useMutation } from "@/hooks/useMutation";

export interface MessageFiles {
  file: File;
  xhr?: XMLHttpRequest;
  aborted: boolean;
  abort?: AbortController;
  progress: number;
  preview?: string;
  uploaded?: boolean;
  url?: string;
  duration?: number;
}

export default function UploadChatFiles({
  files,
  previews,
  setPreviews,
}: {
  files: MessageFiles[];
  previews: MessageFiles[];
  setPreviews: React.Dispatch<React.SetStateAction<MessageFiles[]>>;
}) {
  const mutation = useMutation();
  const handleGetPreview = useCallback(
    (file: File) => {
      const preview = URL.createObjectURL(file);
      setPreviews((prev) => [
        ...prev,
        {
          preview,
          name: file.name,
          size: Math.round(file.size / 1024 / 1024),
          progress: 0,
          aborted: false,
          file: file,
        },
      ]);
    },
    [setPreviews]
  );
  const handleUploadFiles = useCallback(() => {
    if (files.length === 0) {
      setPreviews([]);
    }
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      void handleGetPreview(file.file);
      const formData = new FormData();
      formData.append("files", file.file);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/files`);
      xhr.upload.onprogress = (e) => {
        const percent = Math.round((e.loaded / e.total) * 100);
        setPreviews((prev) =>
          prev.map((prevFile) =>
            prevFile.file.name === file.file.name
              ? { ...prevFile, progress: percent, xhr: xhr }
              : prevFile
          )
        );
      };
      xhr.send(formData);
      xhr.onload = () => {
        const res = JSON.parse(xhr.response as string) as { files: string[] };
        if (xhr.status === 200) {
          setPreviews((prev) =>
            prev.map((prevFile) =>
              prevFile.file.name === file.file.name
                ? {
                    ...prevFile,
                    progress: 100,
                    xhr: xhr,
                    uploaded: true,
                    url: res.files[0],
                  }
                : prevFile
            )
          );
          toast.success(`${file.file.name} uploaded successfully`);
        }
      };

      xhr.onabort = () => {
        setPreviews((prev) =>
          prev.map((prevFile) =>
            prevFile.file.name === file.file.name
              ? { ...prevFile, aborted: true }
              : prevFile
          )
        );
      };
    }
  }, [files, handleGetPreview, setPreviews]);

  const handleDeleteFile = async (url?: string) => {
    if (!url) return;
    const file = previews.find((prevFile) => prevFile.url === url);
    if (file) {
      URL.revokeObjectURL(file.preview!);
    }
    const res = await mutation<{ message: string }>({
      url: `${
        process.env.NEXT_PUBLIC_BACKEND_URL
      }/chat/files/${encodeURIComponent(url)}`,
      method: "DELETE",
    });
    if (res?.message) {
      toast.success(res.message);
      setPreviews((prev) => prev.filter((prevFile) => prevFile.url !== url));
    }
  };

  useEffect(() => {
    void handleUploadFiles();
  }, [handleUploadFiles]);

  if (!files || !files.length || !previews.length) return null;

  return (
    <div className="w-full border-2 border-b-0 border-white gap-x-3 gap-y-3 min-h-32 max-h-[75vh] overflow-y-auto">
      {previews.map((file) => {
        return (
          <article
            className="w-full min-h-32 shrink-0 px-2 py-1 relative flex items-center justify-between"
            key={file.file.name}
          >
            {file.file.type.startsWith("image") && (
              <Image
                src={file.preview || ""}
                width={100}
                height={100}
                alt=""
                unoptimized
              />
            )}
            {file.file.type.startsWith("video") && (
              <video src={file.preview || ""} className="size-28" autoPlay />
            )}

            <p>
              <span className="lg:text-base text-[12px] inline-block w-[120px] lg:w-auto break-all">
                {file.file.name}
              </span>
            </p>
            <div className="w-2/4 flex items-center justify-center gap-x-3">
              <progress
                value={file.progress}
                max={100}
                className="w-[20rem]"
              ></progress>
              <span className="inline-block w-12">{file.progress}%</span>
              <Button
                className="flex items-center justify-center w-8 h-8 relative"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleDeleteFile(file.url);
                }}
                disabled={!file.url}
              >
                <Image src="/icons/cancel.png" fill alt="" objectFit="cover" />
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
