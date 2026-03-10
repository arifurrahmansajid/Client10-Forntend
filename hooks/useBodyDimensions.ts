"use client";
import { useEffect, useState } from "react";

export default function useBodyDimensions() {
  const [bodyHeight, setBodyHeight] = useState({
    width: 0,
    height: 0,
  });
  useEffect(() => {
    const body = document.body;
    const abort = new AbortController();
    setBodyHeight({
      width: body.clientWidth,
      height: body.scrollHeight,
    });
    window.addEventListener(
      "resize",
      () => {
        setBodyHeight({
          width: document.body.clientWidth,
          height: document.body.scrollHeight,
        });
      },
      abort
    );
    return () => {
      abort.abort();
    };
  }, []);

  return bodyHeight;
}
