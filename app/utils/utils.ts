import { UserType } from "@/types/object";
import { PREVIEW_SUPPORTED_FILES } from "./constant";

export const calculateAge = (date: Date) => {
  const currentDate = new Date().getTime();
  const dob = new Date(date).getTime();
  const age = Math.floor((currentDate - dob) / 1000 / 60 / 60 / 24 / 365);
  return age;
};

export const getYYYYMMDD = (date: Date) => {
  if (!date) return "";
  const newDate = new Date(date);
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth() + 1).padStart(2, "0");
  const day = String(newDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getCookie = (cookie: string) => {
  const cookies = document.cookie
    .split("; ")
    .find((row) => row.startsWith(cookie))
    ?.split("=")[1];
  return cookies;
};

export const toTitle = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const formatDate = (date: Date) => {
  if (!date)
    return {
      time: `${new Date().toTimeString()}`,
      date: `${0}/${0}/${1990}`,
    };
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const daydate = date.getDate();

  const dateFormate = new Intl.DateTimeFormat("en-us", {
    hour: "numeric",
    minute: "2-digit",
  });
  return {
    time: `${dateFormate.format(date)}`,
    date: `${daydate}/${month}/${year}`,
  };
};

export const isAlreadyChatingWith = (user: UserType, users: UserType[]) => {
  return users.find((u) => u._id === user._id);
};

export const handleSetChatType = (type: string) => {
  localStorage.setItem("chat", type);
};
export const handleGetSlicedName = (name: string) => {
  const split = name.split(".");
  const ext = split[split.length - 1];
  return `${name.slice(0, 15)}...${ext}`;
};

export const IsPreviewSupportedAndShowPreview = (fileURL: string) => {
  const split = fileURL.split(".");
  const extension = split[split.length - 1];
  if (!PREVIEW_SUPPORTED_FILES.includes(extension))
    return {
      supported: false,
      preview: "",
      type: "",
    };
  return {
    supported: true,
    preview: fileURL,
    type: PREVIEW_SUPPORTED_FILES.find((e) => e === extension)!,
  };
};

export const createVideoAndGiveDuration = (
  previwew: string
): Promise<number> => {
  const vid = document.createElement("video");
  vid.src = previwew;
  vid.preload = "metadata";
  return new Promise((resolve) => {
    vid.onloadedmetadata = () => {
      const duration = vid.duration;
      resolve(Math.round(duration));
    };
  });
};
