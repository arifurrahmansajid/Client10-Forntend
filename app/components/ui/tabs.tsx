"use client";
import React, { ComponentProps, useContext, useEffect } from "react";
import Button from "./button";
import { Context } from "@/app/utils/context";
import { Page } from "@/app/utils/constant";

interface TabsProps extends ComponentProps<"section"> {
  label: string[];
  defaultValue?: string;
  children?: React.ReactNode;
  position?: "start" | "end";
}

export const Tabs = ({
  label,
  defaultValue,
  className,
  children,
  position = "start",
  ...rest
}: TabsProps) => {
  const { setCurrentTab, currentPage, user, setProfileId } =
    useContext(Context);
  const handleChangeTab = (tab: string) => {
    setCurrentTab(tab.toLowerCase());
  };
  useEffect(() => {
    if (!defaultValue) return;
    handleChangeTab(defaultValue);
  }, [defaultValue, currentPage]);
  return (
    <section
      className={`mt-5.5 flex items-center justify-center lg:justify-start p-1 lg:p-0 gap-x-8 lg:gap-x-12 lg:self-start ${className}`}
      {...rest}
    >
      {position === "start" && children}
      {label.map((text) => {
        return (
          <Button
            key={text}
            onClick={() => {
              handleChangeTab(text);
              if (currentPage !== Page.publicProfile) {
                setProfileId("");
              }
            }}
            disabled={text.includes("Private") && !user}
            className="cursor-pointer lg:text-base text-[12px]"
          >
            {text}
          </Button>
        );
      })}
      {position === "end" && children}
    </section>
  );
};

export default function TabsContent({
  children,
  tabValue,
}: {
  children: React.ReactNode;
  tabValue: string;
}) {
  const { currentTab } = useContext(Context);

  return (
    <section className="self-start">
      {currentTab === tabValue.toLowerCase() ? children : null}
    </section>
  );
}
