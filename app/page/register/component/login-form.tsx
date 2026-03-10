import Button from "@/app/components/ui/button";
import Input from "@/app/components/ui/input";
import {
  BACKGROUN_STYLE,
  getCookieExpiryDate,
  Page,
} from "@/app/utils/constant";
import { Context, useSocket } from "@/app/utils/context";
import { useMutation } from "@/hooks/useMutation";
import React, { FormEvent, useContext, useState } from "react";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const mutation = useMutation();
  const { setCurrentPage, setBackgroundStyle, user } = useContext(Context);
  const socket = useSocket();
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fromData = new FormData(e.currentTarget);
    const data = {
      email: fromData.get("email") as string,
      password: fromData.get("password") as string,
    };
    setLoading(true);
    const res = await mutation<{ token: string }>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/users`,
      method: "PUT",
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (res) {
      socket?.emit("user-disconnected", {
        socketId: socket.id,
        id: user?._id,
      });
      document.cookie = `token=${
        res?.token
      };expires=${getCookieExpiryDate().toUTCString()};path=/`;
      setBackgroundStyle({ style: BACKGROUN_STYLE.default, url: "" });
      document.cookie = "tmpToken=";
      setCurrentPage(Page.profile);
    }
  };
  return (
    <form
      className="flex p-1 lg:p-0 items-start justify-start gap-y-1 flex-col mt-4 w-full lg:w-2/4 m-auto"
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      autoComplete="off"
    >
      <Input name="email" type="text" label="User" className="w-full" />
      <Input
        name="password"
        type="password"
        label="Password"
        className="w-full"
        autoComplete="new-password"
      />
      <Button className="cursor-pointer" disabled={loading}>
        Login
      </Button>
    </form>
  );
}
