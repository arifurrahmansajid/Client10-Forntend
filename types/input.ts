export interface UserInput {
  name: string;
  gender: "male" | "female";
  email: string;
  password: string;
  dob: Date;
  age: number | null;
  race: string;
  starSign: string;
  zodiac: string;
  planet: string;
  profilePic?: string;
  phone?: string;
  countryCode?: string | null | undefined;
}
