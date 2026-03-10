"use client";
import TabsContent, { Tabs } from "@/app/components/ui/tabs";
import React, { Suspense } from "react";
import RegisterForm from "./component/register-form";
import { useUser } from "@/app/utils/context";
import LoginForm from "./component/login-form";
import Profile from "../profile/profile-page";

export default function Register() {
  const user = useUser();
  if (user) return <Profile />;
  return (
    <Suspense>
      <Tabs label={["Login", "Register"]} className="!justify-center" />
      <TabsContent tabValue="Register">
        <RegisterForm />
      </TabsContent>
      <TabsContent tabValue="Login">
        <LoginForm />
      </TabsContent>
    </Suspense>
  );
}
