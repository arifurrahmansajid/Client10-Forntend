import { useEffect, useState } from "react";

export default function useDebounce(string: string) {
  const [value, setValue] = useState("");
  let timer: null | NodeJS.Timeout = null;

  useEffect(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      setValue(string);
    }, 2000);
  }, [string]);
  return value;
}
