declare module "chinese-lunar-calendar" {
  export interface PlanetData {
    lunarMonth: number;
    lunarDate: number;
    isLeap: boolean;
    solarTerm: string | null;
    lunarYear: string;
    zodiac: string;
    dateStr: string;
  }
  export function getLunar(
    year: number,
    month: number,
    day: number
  ): PlanetData;
}
