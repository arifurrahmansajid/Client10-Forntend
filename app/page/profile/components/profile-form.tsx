"use client";
import Input from "@/app/components/ui/input";
import { CHINESEANIMAL, PLANETS } from "@/app/utils/constant";
import { calculateAge, getYYYYMMDD } from "@/app/utils/utils";
import { UserType } from "@/types/object";
import React, { ChangeEvent, useEffect, useState } from "react";
import zodiacSigns from "zodiac-signs";
import { getLunar } from "chinese-lunar-calendar";

export default function ProfileForm({
  userDetails,
  setUserDetails,
  editable = true,
}: {
  userDetails?: UserType;
  setUserDetails: React.Dispatch<React.SetStateAction<UserType | undefined>>;
  editable?: boolean;
}) {
  const [starSign, setStarSign] = useState("");
  const [planet, setPlanet] = useState("");
  const [animal, setAnimal] = useState("");
  const zodiac = zodiacSigns("en");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserDetails(
      (prev) =>
        ({
          ...prev,
          [name]: value,
        } as UserType)
    );
  };

  useEffect(() => {
    if (!userDetails?.dob) return;
    const dob = new Date(userDetails.dob);
    const date = dob.getDate();
    const month = (dob.getMonth() || 0) + 1;
    if (date && month) {
      const star = zodiac.getSignByDate({ day: date, month: month })?.name;
      if (star) {
        setStarSign(star);
        setPlanet(PLANETS[star]);
      }
      const year = dob.getFullYear();
      if (year && year.toString().length === 4) {
        setAnimal(CHINESEANIMAL[getLunar(year, month, date).zodiac]);
      }
    }
  }, [userDetails?.dob]);
  return (
    <form className="w-full p-1 lg:p-0 lg:w-2/4 m-auto flex items-start justify-start gap-y-1 flex-col mt-4 pr-3 h-[83vh] overflow-y-auto">
      <Input
        label="Name"
        name="name"
        className="w-full"
        defaultValue={userDetails?.name}
        onChange={handleChange}
        disabled={!editable}
      />
      <Input
        label="Race"
        name="race"
        className="w-full"
        defaultValue={userDetails?.race || ""}
        onChange={handleChange}
        disabled={!editable}
      />
      <Input
        label="Gender"
        name="gender"
        className="w-full"
        defaultValue={userDetails?.gender || ""}
        onChange={handleChange}
        disabled={!editable}
      />
      <Input
        label="User"
        name="email"
        type="text"
        className="w-full"
        defaultValue={userDetails?.email}
        onChange={handleChange}
        disabled={!editable}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        className="w-full"
        onChange={handleChange}
        disabled={!editable}
      />
      <Input
        label="Date of Birth"
        name="dob"
        type="date"
        className="w-full"
        defaultValue={userDetails?.dob ? getYYYYMMDD(userDetails.dob) : ""}
        onChange={handleChange}
        disabled={!editable}
      />
      <Input
        label="Age"
        name="age"
        type="number"
        className="w-full"
        readOnly
        defaultValue={userDetails?.dob ? calculateAge(userDetails.dob) : ""}
        key={new Date(userDetails?.dob || "").toDateString() || ""}
        disabled
      />
      <Input
        label="Star Sign"
        name="starSign"
        type="text"
        readOnly
        className="w-full"
        defaultValue={starSign}
        disabled
      />
      <Input
        label="Zodiac Animal"
        name="zodiac"
        type="text"
        readOnly
        className="w-full"
        defaultValue={animal}
        disabled
      />
      <Input
        label="Planet"
        name="planet"
        type="text"
        readOnly
        className="w-full"
        defaultValue={planet}
        disabled
      />
      <Input
        label="Relationship"
        name="relationship"
        type="text"
        readOnly
        className="w-full"
        defaultValue={userDetails?.relationShip || ""}
        disabled
      />
    </form>
  );
}
