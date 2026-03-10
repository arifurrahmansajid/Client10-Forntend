declare module "zodiac-signs" {
  export interface ZodiacSign {
    name: string;
    symbol: string;
    sun: string;
    element: string;
    quality: string;
  }

  export interface Zodiac {
    getSignByDate({
      day,
      month,
      year,
    }: {
      day: number;
      month: number;
      year?: number;
    }): ZodiacSign | undefined;
  }

  export default function zodiacSigns(locale: string): Zodiac;
}
