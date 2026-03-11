import { BACKGROUN_STYLE, BACKGROUND_TYPE } from "@/app/utils/constant";

export interface UserType {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  gender: "male" | "female";
  email: string;
  password: string;
  dob: Date;
  age: number;
  roles: "admin" | "user";
  isSpammer: boolean;
  race: string | null | undefined;
  starSign: string | null | undefined;
  zodiac: string | null | undefined;
  planet: string | null | undefined;
  recovery: string | null | undefined;
  profilePic: string | null | undefined;
  phone: string | null | undefined;
  countryCode: string | null | undefined;
  ip: string | null | undefined;
  relationShip: string | null | undefined;
  backgroundType: string | null | undefined;
}

export interface Query {
  url: string;
  headers?: RequestInit["headers"];
  method: "GET";
  signal?: AbortController;
}

export interface Musics {
  name: string;
  url: string;
  setAsBackground: boolean;
  user: string | null | undefined;
  _id: string;
  style: BACKGROUN_STYLE;
}

export interface Video {
  name: string;
  url: string;
  setAsBackground: boolean;
  user: string | null | undefined;
  _id: string;
  style: BACKGROUN_STYLE;
}

export interface Picture {
  name: string;
  url: string;
  setAsBackground: boolean;
  user: string | null | undefined;
  _id: string;
  style: BACKGROUN_STYLE;
}

export interface GIF {
  name: string;
  url: string;
  setAsBackground: boolean;
  user: string | null | undefined;
  _id: string;
  style: BACKGROUN_STYLE;
}

export interface Message {
  createdAt: string;
  updatedAt: string;
  user: UserType | null;
  sentBy: UserType | null;
  sentTo: UserType | null;
  message: string;
  _id: string;
  files: string[];
  roomId?: string;
}

export interface DisableButton {
  _id: string;
  name: string;
  disable: boolean;
}

export interface UserWithSocketID extends UserType {
  socketID: string;
}

export interface BackgroundType {
  type: BACKGROUND_TYPE;
  url: string;
  style: BACKGROUN_STYLE;
}

export interface DefaultProfilePicuture {
  name: string;
  url: string;
  _id: string;
}

export interface Friend {
  user: UserType;
  friend: UserType;
}

export interface PeerConnections {
  peer: RTCPeerConnection;
  user: string;
  isCaller: boolean;
  _listeners?: {
    handleTrack: (e: RTCTrackEvent) => void;
    handleNegoTiation: () => void;
    tmp: (e: Event) => void;
    sendIceCandidate: (e: RTCPeerConnectionIceEvent) => boolean | undefined;
    connectionState: (e: Event) => void;
  };
}
