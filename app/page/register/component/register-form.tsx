"use client";
import Input from "@/app/components/ui/input";
import {
  BACKGROUN_STYLE,
  CHINESEANIMAL,
  getCookieExpiryDate,
  Page,
  PLANETS,
} from "@/app/utils/constant";
import { calculateAge } from "@/app/utils/utils";
import { useMutation } from "@/hooks/useMutation";
import { UserInput } from "@/types/input";
import React, { FormEvent, useContext, useEffect, useState } from "react";
import zodiacSigns from "zodiac-signs";
import { getLunar } from "chinese-lunar-calendar";
import Button from "@/app/components/ui/button";
import { Context, useSocket } from "@/app/utils/context";

export default function RegisterForm() {
  const [dob, setDob] = useState<null | Date>(null);
  const [starSign, setStarSign] = useState("");
  const [planet, setPlanet] = useState("");
  const [animal, setAnimal] = useState("");
  const [loading, setLoading] = useState(false);
  const mutation = useMutation();
  const zodiac = zodiacSigns("en");
  const { setCurrentPage, setBackgroundStyle, user } = useContext(Context);
  const socket = useSocket();

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: UserInput = {
      name: formData.get("name") as string,
      race: formData.get("race") as string,
      gender: formData.get("gender") as UserInput["gender"],
      email: formData.get("prevent_fill") as string,
      password: formData.get("password") as string,
      dob: new Date(formData.get("dob") as string),
      age: Number(formData.get("age")),
      starSign: starSign,
      zodiac: formData.get("zodiac") as string,
      planet: formData.get("planet") as string,
    };
    setLoading(true);
    const res = await mutation<{ token: string }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users`,
      method: "POST",
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (res) {
      socket?.emit("new-user-registered");
      socket?.emit("user-disconnected", {
        socketId: socket.id,
        id: user?._id,
      });
      document.cookie = `token=${
        res?.token
      };expires=${getCookieExpiryDate().toUTCString()};path=/`;
      document.cookie = "tmpToken=";
      setBackgroundStyle({ style: BACKGROUN_STYLE.default, url: "" });
      setCurrentPage(Page.profile);
    }
  };

  useEffect(() => {
    const date = dob?.getDate();
    const month = (dob?.getMonth() || 0) + 1;
    if (date && month) {
      const star = zodiac.getSignByDate({ day: date, month: month })?.name;
      if (star) {
        setStarSign(star);
        setPlanet(PLANETS[star]);
      }
      const year = dob?.getFullYear();
      if (year && year.toString().length === 4) {
        setAnimal(CHINESEANIMAL[getLunar(year, month, date).zodiac]);
      }
    }
  }, [dob]);

  return (
    <form
      className="w-full p-1 lg:p-0 lg:w-2/4 m-auto flex items-start justify-start gap-y-1 flex-col mt-4 pr-3 h-[83vh] overflow-y-auto"
      onSubmit={(e) => {
        void handleFormSubmit(e);
      }}
      autoComplete="off"
    >
      <Input label="Name" name="name" className="w-full" autoComplete="off" />
      <Input label="Race" name="race" className="w-full" autoComplete="off" />
      <Input
        label="Gender"
        name="gender"
        className="w-full"
        autoComplete="off"
      />
      <Input label="User" name="prevent_fill" type="text" className="w-full" />
      <Input
        label="Password"
        name="password"
        type="password"
        className="w-full"
      />
      <Input
        label="Date of Birth"
        name="dob"
        type="date"
        className="w-full"
        onChange={(e) => {
          setDob(new Date(e.target.value));
        }}
      />
      <Input
        label="Age"
        name="age"
        type="number"
        className="w-full"
        readOnly
        value={dob ? calculateAge(dob) : ""}
        disabled
      />
      <Input
        label="Star Sign"
        name="starSign"
        type="text"
        readOnly
        className="w-full"
        value={starSign}
        disabled
      />
      <Input
        label="Zodiac Animal"
        name="zodiac"
        type="text"
        readOnly
        className="w-full"
        value={animal}
        disabled
      />
      <Input
        label="Planet"
        name="planet"
        type="text"
        readOnly
        className="w-full"
        value={planet}
        disabled
      />
      <Button type="submit" disabled={loading} className="currsor-pointer">
        Register
      </Button>
    </form>
  );
}
