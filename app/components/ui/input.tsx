"use client";
import Image from "next/image";
import React, { ComponentProps, useState } from "react";

interface InputProps extends ComponentProps<"input"> {
  className?: string;
  label?: string;
}
export default function Input({ className, label, type, ...rest }: InputProps) {
  const [inputType, setInputType] = useState(type);
  return (
    <div className="flex items-start flex-col w-full relative">
      <label>{label}</label>
      <input
        type={inputType}
        className={`min-w-56 bg-transparent outline-none ${className} placeholder:text-white text-white pb-1.5 focus:!bg-transparent`}
        {...rest}
      />
      {type === "password" ? (
        <Image
          src="/icons/eye.png"
          width={24}
          height={24}
          alt="date input"
          className="absolute right-0 top-4.5 -translate-y-2/4 cursor-pointer"
          onClick={() => {
            if (inputType === "password") {
              setInputType("text");
            } else {
              setInputType("password");
            }
          }}
          unoptimized
        />
      ) : null}
    </div>
  );
}
