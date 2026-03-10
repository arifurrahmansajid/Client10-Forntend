"use client";
import Image from "next/image";
import React, { useState } from "react";
import Button from "./button";
import { toTitle } from "@/app/utils/utils";

export interface Options {
  label: string;
  value: string;
}
interface SelectProps {
  options: Options[];
  className?: string;
  name?: string;
  defaulvalue?: string;
  label?: string;
  onValueChange?: (value: string) => void;
}

export default function Select({
  options,
  className,
  name,
  defaulvalue,
  label,
  onValueChange,
}: SelectProps) {
  const [selectedOption, setSelecteOption] = useState({ label: "", value: "" });
  const [showList, setShowList] = useState(false);
  const [isInsideList, setIsInsideList] = useState(false);
  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => {
        setIsInsideList(true);
      }}
      onMouseLeave={() => {
        setIsInsideList(false);
      }}
      onBlur={() => {
        if (!isInsideList) {
          setShowList(false);
        }
      }}
    >
      <label
        htmlFor={name}
        onClick={() => {
          setShowList((prev) => !prev);
        }}
      >
        {label}
      </label>
      <Button
        className="cursor-pointer py-1.5 w-full text-start flex items-center justify-between"
        onClick={(e) => {
          e.preventDefault();
          setShowList((prev) => !prev);
        }}
      >
        <input
          type="text"
          className="hidden"
          defaultValue={selectedOption.value || defaulvalue}
          // key={selectedOption.value}
          name={name}
        />
        <span>{toTitle(selectedOption.label || defaulvalue || "")} </span>
        <Image
          width={20}
          height={20}
          src="/icons/caret.svg"
          alt="dropdown button"
          className={`${showList ? "" : "rotate-180"}`}
          unoptimized
        />
      </Button>
      {showList && (
        <div className="absolute w-full top-full left-0 max-h-48 overflow-y-auto z-10 bg-primary">
          <ul>
            {options.map((option) => (
              <li key={option.label}>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    setSelecteOption(option);
                    setShowList(false);
                    setIsInsideList(false);
                    if (onValueChange) onValueChange(option.value);
                  }}
                  className={`cursor-pointer px-4 py-1.5 w-full text-start bg-transparent text-white`}
                >
                  {option.label}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
