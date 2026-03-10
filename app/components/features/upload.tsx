"use client";
import { getCookie } from "@/app/utils/utils";
import Image from "next/image";
import React, {
  ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Button from "../ui/button";
import toast from "react-hot-toast";
import { useSocket } from "@/app/utils/context";
import { useMutation } from "@/hooks/useMutation";
import useDisable from "@/hooks/useDisable";

interface UploadProps extends ComponentProps<"input"> {
  text: string;
  url?: string;
  method?: string;
  cb?: (file?: string) => void;
  showAddMoreFile?: boolean;
  publicUpload?: boolean;
  showXbutton?: boolean;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const CONCURRENT_UPLOADS = 3;

export default function Upload({
  text,
  url,
  method,
  className,
  cb,
  showAddMoreFile = true,
  publicUpload,
  showXbutton = true,
  ...rest
}: UploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{ file: File; id: number }[]>([]);
  const [filePreview, setFilePreview] = useState<
    {
      preview: string;
      name: string;
      size: number;
      duration?: number;
      progress: number;
      aborted?: boolean;
      url?: string;
      id: number;
    }[]
  >([]);
  const socket = useSocket();
  const mutation = useMutation();
  const { uploadDisabled } = useDisable("/upload");

  const handleGetPreview = useCallback((file: { file: File; id: number }) => {
    const preview = URL.createObjectURL(file.file);
    setFilePreview((prev) => [
      ...prev,
      {
        preview,
        name: file.file.name,
        size: Math.round(file.file.size / 1024 / 1024),
        progress: 0,
        id: file.id,
      },
    ]);
  }, []);

  const uploadFileInChunks = async (fileObj: { file: File; id: number }) => {
    const file = fileObj.file;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const token = getCookie("token=") || "";

    try {
      if (url) {
        // Standard single-file upload (used for Profile Pic, etc.)
        const formData = new FormData();
        formData.append("files", file);

        const res = await fetch(url, {
          method: method || "POST",
          headers: {
            Authorization: publicUpload ? "" : token,
          },
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to upload file");
        
        // Emulate progress since we can't track it with standard fetch easily
        setFilePreview((prev) =>
          prev.map((p) => (p.id === fileObj.id ? { ...p, progress: 100 } : p))
        );

        const resData = await res.json();
        
        setFilePreview((prev) =>
          prev.map((p) =>
            p.id === fileObj.id
              ? { ...p, progress: 100, url: resData.url ? resData.url[0] : undefined }
              : p
          )
        );
      } else {
        // Chunked multi-part upload for large files (default backend `/upload` API)
        const initRes = await fetch(`${backendUrl}/upload/init`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: publicUpload ? "" : token,
          },
          body: JSON.stringify({ fileName: file.name, totalChunks }),
        });

        if (!initRes.ok) throw new Error("Failed to initialize upload");
        const { uploadId } = await initRes.json();

        // 2. Upload Chunks
        const chunkProgress = new Array(totalChunks).fill(0);
        const updateOverallProgress = () => {
          const totalUploaded = chunkProgress.reduce((a, b) => a + b, 0);
          const percent = Math.round((totalUploaded / file.size) * 100);
          setFilePreview((prev) =>
            prev.map((p) => (p.id === fileObj.id ? { ...p, progress: percent } : p))
          );
        };

        const uploadChunk = async (index: number) => {
          const start = index * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);
          const formData = new FormData();
          formData.append("chunk", chunk);
          formData.append("uploadId", uploadId);
          formData.append("chunkIndex", index.toString());

          const res = await fetch(`${backendUrl}/upload/chunk`, {
            method: "POST",
            headers: {
              Authorization: publicUpload ? "" : token,
            },
            body: formData,
          });

          if (!res.ok) throw new Error(`Failed to upload chunk ${index}`);
          chunkProgress[index] = end - start;
          updateOverallProgress();
        };

        // Concurrent chunk uploads
        const queue = Array.from({ length: totalChunks }, (_, i) => i);
        const workers = Array.from({ length: Math.min(totalChunks, CONCURRENT_UPLOADS) }, async () => {
          while (queue.length > 0) {
            const index = queue.shift()!;
            await uploadChunk(index);
          }
        });
        await Promise.all(workers);

        // 3. Complete
        const fileType = rest.accept?.split("/")[0] || "file";
        const completeRes = await fetch(`${backendUrl}/upload/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: publicUpload ? "" : token,
          },
          body: JSON.stringify({ uploadId, fileName: file.name, totalChunks, fileType }),
        });

        if (!completeRes.ok) throw new Error("Failed to complete upload");
        const resData = await completeRes.json();

        setFilePreview((prev) =>
          prev.map((p) =>
            p.id === fileObj.id
              ? { ...p, progress: 100, url: resData.url[0] }
              : p
          )
        );
      }

      socket?.emit("new-file-uploaded");
      if (cb) cb();
      if (!showAddMoreFile) {
        setFilePreview([]);
        setFiles([]);
      }
      toast.success(`${file.name} uploaded successfully`);

    } catch (error: any) {
      console.error(error);
      toast.error(`Error uploading ${file.name}: ${error.message}`);
      setFilePreview((prev) =>
        prev.map((p) => (p.id === fileObj.id ? { ...p, aborted: true } : p))
      );
    }
  };

  const handleUploadFile = useCallback(() => {
    if (!files.length) return;
    files.forEach((file) => {
      void handleGetPreview(file);
      void uploadFileInChunks(file);
    });
    setFiles([]); // Clear queue after starting uploads
  }, [files, handleGetPreview, publicUpload, socket, cb, showAddMoreFile, rest.accept]);

  const handleDeleteFile = async (url?: string) => {
    if (!url) return;
    const res = await mutation<{ message: string }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL
        }/chat/files/${encodeURIComponent(url)}`,
      method: "DELETE",
    });
    if (res?.message) {
      setFilePreview((prev) => prev.filter((prevFile) => prevFile.url !== url));
      if (cb) {
        cb();
      }
      socket?.emit("new-file-uploaded");
      toast.success(res.message);
    }
  };

  useEffect(() => {
    if (files.length > 0) {
      void handleUploadFile();
    }
  }, [files, handleUploadFile]);

  useEffect(() => {
    return () => {
      filePreview.forEach((file) => {
        URL.revokeObjectURL(file.preview);
      });
    };
  }, [filePreview]);

  return (
    <>
      <div
        className={`border border-white p-6 w-full overflow-y-auto max-h-[80vh] ${className}`}
      >
        {filePreview.length ? null : (
          <Button
            className="w-full h-full cursor-pointer"
            onClick={() => {
              inputRef.current?.click();
            }}
            disabled={uploadDisabled}
          >
            {text}
          </Button>
        )}
        {filePreview.map((file) => {
          const accept = (rest.accept || "").toLowerCase();
          const isImage = accept.includes("image") || [".jpg", ".jpeg", ".png", ".svg", ".webp"].some(ext => accept.includes(ext));
          const isVideo = accept.includes("video");
          const isAudio = accept.includes("audio");

          return (
            <div
              key={file.id}
              className="flex items-center justify-between my-2 p-3 bg-white/5 border border-white/10 rounded-xl w-full translate-y-0 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                {isVideo ? (
                  <video src={file.preview} className="w-16 h-16 object-cover rounded-lg shadow-lg" muted />
                ) : isImage ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden shadow-lg border border-white/10">
                    <Image
                      src={file.preview}
                      fill
                      alt="preview"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 rounded-lg flex items-center justify-center border border-white/10 shadow-lg">
                    <span className="text-[10px] font-bold text-center px-1 break-all tracking-tighter opacity-80">{file.name.split('.').pop()?.toUpperCase()}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="lg:text-base text-sm font-semibold max-w-[200px] truncate text-white/90">
                    {file.name}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">{file.size} MB</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-blue-400">{file.progress}%</span>
                </div>

                {showXbutton && (
                  <Button
                    onClick={() => void handleDeleteFile(file.url)}
                    disabled={!file.url}
                    className="p-2 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-full transition-all border border-white/5 hover:border-red-500/30"
                  >
                    <Image src="/icons/cancel.png" width={14} height={14} alt="cancel" className="opacity-60" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        <input
          type="file"
          className="hidden"
          ref={inputRef}
          {...rest}
          onChange={(e) => {
            const selectedFiles = Array.from(e.target.files || []);
            setFiles(selectedFiles.map(file => ({ file, id: Date.now() + Math.random() })));
            e.target.value = ""; // Reset input
          }}
        />
      </div>
      {filePreview.length && showAddMoreFile ? (
        <div className="mt-3">
          <Button onClick={() => inputRef.current?.click()}>Add File</Button>
        </div>
      ) : null}
    </>
  );
}
