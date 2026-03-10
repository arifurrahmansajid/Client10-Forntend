import Button from "@/app/components/ui/button";
import { BACKGROUN_STYLE, Page } from "@/app/utils/constant";
import { Context, useSocket } from "@/app/utils/context";
import { getCookie } from "@/app/utils/utils";
import useDisable from "@/hooks/useDisable";
import { useMutation } from "@/hooks/useMutation";
import { Picture } from "@/types/object";
import React, { useContext } from "react";
import toast from "react-hot-toast";

export default function ImageCard({
  image,
  setImages,
  idx,
  setCurrentIndex,
  showOptionlButton,
}: {
  image: Picture;
  setImages: React.Dispatch<React.SetStateAction<Picture[]>>;
  idx: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number | null>>;
  showOptionlButton: boolean;
}) {
  const mutation = useMutation();
  const socket = useSocket();
  const { backgroundDisabled } = useDisable("/bg");
  const { deleteDisabled } = useDisable("/delete");
  const {
    setBackgroundStyle,
    user,
    currentPage,
    currentTab,
    setBackgroundType,
  } = useContext(Context);
  const handleDelete = async () => {
    if (deleteDisabled && currentTab === "public") {
      toast.error("Delete is currently disabled for public content");
      return;
    }
    const res = await mutation<{ message: string }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/images/delete-image/${image._id}`,
      method: "DELETE",
      headers: {
        Authorization: getCookie("token=") || "",
      },
    });
    if (res) {
      toast.success(res.message);
      socket?.emit("new-file-uploaded");
      setImages((prev) => {
        return prev.filter((img) => image._id !== img._id);
      });
    }
  };
  const handelSetBackGround = async () => {
    const body =
      image?.style === BACKGROUN_STYLE.image
        ? BACKGROUN_STYLE.imageFullScreen
        : image?.style === BACKGROUN_STYLE.imageFullScreen
        ? BACKGROUN_STYLE.imageRepeat
        : image.style === BACKGROUN_STYLE.imageRepeat
        ? BACKGROUN_STYLE.imageRepeat2
        : image.style === BACKGROUN_STYLE.imageRepeat2
        ? null
        : image.style === null
        ? BACKGROUN_STYLE.image
        : null;

    const res = await mutation<{ message: string; updatedImage: Picture }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/images/set-background/${image._id}?type=${currentTab}`,
      method: "PUT",
      headers: {
        Authorization: getCookie("token=") || "",
      },
      body: JSON.stringify({
        style: image.style ? body : BACKGROUN_STYLE.image,
      }),
    });
    if (res?.message) {
      setBackgroundType(currentTab);
      setImages((prev) => {
        return prev.map((img) => {
          if (img._id === image._id) {
            return res.updatedImage;
          }
          return { ...img, style: null };
        }) as Picture[];
      });
      socket?.on("set-background", (data: Picture) => {
        setImages((prev) => {
          return prev.map((img) => {
            if (img._id === image._id) {
              return data;
            }
            return { ...img, style: null };
          }) as Picture[];
        });
      });
      if (!res.updatedImage.setAsBackground) {
        setBackgroundStyle({
          style: BACKGROUN_STYLE.default,
          url: "",
        });
        socket?.emit(
          user ? "background-private" : "background",
          res.updatedImage
        );
        toast.success("Bacground removed successfully");
        return;
      }
      toast.success(res.message);
      setBackgroundStyle({
        style: res.updatedImage.style,
        url: image.url,
      });
      socket?.emit(
        user ? "background-private" : "background",
        res.updatedImage
      );
    }
  };
  return (
    <section>
      <img
        src={image.url}
        className="m-auto aspect-square w-full h-[300px] object-contain"
        loading="lazy"
        alt=""
        onClick={() => {
          setCurrentIndex(idx);
        }}
      ></img>
      <div className="flex items-center justify-start gap-x-6 mt-1">
        <Button
          className="cursor-pointer"
          onClick={() => {
            setCurrentIndex(idx);
          }}
        >
          View
        </Button>
        {currentPage === Page.publicProfile ? null : (
          <>
            <Button
              className="cursor-pointer"
              onClick={() => {
                void handelSetBackGround();
              }}
              disabled={backgroundDisabled}
            >
              Background
            </Button>
            {showOptionlButton && (
              <Button
                className="cursor-pointer"
                onClick={(e) => {
                  if (deleteDisabled && currentTab === "public") {
                    e.preventDefault();
                    return;
                  }
                  void handleDelete();
                }}
                disabled={deleteDisabled && currentTab === "public"}
              >
                Delete
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
