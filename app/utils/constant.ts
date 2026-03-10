export enum BACKGROUN_STYLE {
  default = "bg-primary",
  image = "image",
  video = "video",
  imageFullScreen = "imageFullScreen",
  videoFullScreen = "videoFullScreen",
  imageRepeat = "imageRepeat",
  imageRepeat2 = "imageRepeat2",
  gif = "gif",
  gifFullScreen = "gifFullScreen",
  gifRepeat = "gifRepeat",
  gifRepeat2 = "gifRepeat2",
}
export enum BACKGROUND_TYPE {
  image = "image",
  video = "video",
  gif = "gif",
  audio = "audio",
}

export enum Page {
  chat = "chat",
  gif = "gif",
  image = "image",
  music = "music",
  video = "video",
  profile = "profile",
  register = "register",
  publicProfile = "publicProfile",
  admin = "admin",
  videoCall = "videoCall",
}

export const PLANETS: Record<string, string> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Pluto",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Uranus",
  Pisces: "Neptune",
};

export const CHINESEANIMAL: Record<string, string> = {
  鼠: "Rat",
  牛: "Ox",
  虎: "Tiger",
  兔: "Rabbit",
  龙: "Dragon",
  蛇: "Snake",
  马: "Horse",
  羊: "Goat",
  猴: "Monkey",
  鸡: "Rooster",
  狗: "Dog",
  猪: "Pig",
};

export function getCookieExpiryDate() {
  const expires = new Date();
  expires.setTime(expires.getTime() + 1 * 24 * 60 * 60 * 1000);
  return expires;
}

export const IMAGE_REPEAT_X = 9;
export const IMAGE_REPEAT_Y = 8;
export const PREVIEW_SUPPORTED_FILES = [
  "png",
  "jpg",
  "jpeg",
  "webp",
  "svg",
  "mp4",
  "webm",
  "mkv",
  "gif",
  "mp3",
];

export const IMAGES = ["png", "jpg", "jpeg", "webp", "svg", "gif"];

export const VIDEOS = ["mp4", "webm", "mkv"];

export const MUSIC = ["mp3"];
