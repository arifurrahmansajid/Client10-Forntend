import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/ui/navbar";
import GlobalState from "./utils/context";
import { Toaster } from "react-hot-toast";
import GlobalAudioPlayer from "./components/features/global-audio-player";
import GlobalbackGround from "./components/features/global-background";
import UsersData from "./components/features/users-data";
import VideoCallContext from "./utils/video-call-context";
import GlobalVideoCall from "./components/features/global-video-call";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Huntrix",
  description: "Huntrix",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="only light" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased isolate min-h-screen h-fit`}
        suppressHydrationWarning
      >
        <GlobalState>
          <VideoCallContext>
            <GlobalbackGround />
            <Toaster
              position="bottom-right"
              toastOptions={{ duration: 3000 }}
            />
            <GlobalVideoCall />
            <div className="block lg:hidden">
              <Navbar />
            </div>
            <section className="flex items-center justify-between flex-wrap lg:flex-nowrap gap-3 h-[calc(100vh_-_4rem)]">
              <GlobalAudioPlayer />
              <div className="w-full h-auto lg:max-w-[55%] self-start">
                {children}
              </div>
              <UsersData />
            </section>
          </VideoCallContext>
        </GlobalState>
      </body>
    </html>
  );
}
