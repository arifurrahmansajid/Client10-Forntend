import React from "react";
import Button from "../ui/button";

export default function PictureModal({
  open,
  setOpen,
  src,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  src?: string;
}) {
  return (
    <dialog
      open={open}
      className="w-screen h-screen top-0 z-50 isolate bg-black fixed left-0"
    >
      <div className="w-screen flex items-center justify-end px-4 py-3 absolute z-10 text-white">
        <Button
          className="scale-200"
          onClick={() => {
            setOpen(false);
          }}
        >
          &#10539;
        </Button>
      </div>
      <div>
        <div className="flex items-center justify-center h-screen bg-black overflow-hidden">
          <img
            src={src}
            alt=""
            className="max-w-full max-h-[70%] object-contain"
          />
        </div>
      </div>
    </dialog>
  );
}
