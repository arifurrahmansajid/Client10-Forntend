"use client";

import { Context } from "@/app/utils/context";
import { useContext } from "react";
import toast from "react-hot-toast";

interface Mutation {
  url: string;
  method: RequestInit["method"];
  body?: RequestInit["body"];
  headers?: RequestInit["headers"];
  abort?: AbortController;
}

export interface ErrorResponse {
  error: string;
  status: number;
}
export function useMutation(isDeletingAllPublicData = false) {
  const { setDataDeleted } = useContext(Context);
  async function mutation<T>(data: Mutation): Promise<T | undefined> {
    try {
      const res = await fetch(data.url, {
        method: data.method,
        headers: {
          "Content-Type": "application/json",
          ...data.headers,
        },
        body: data.body,
        signal: data.abort?.signal,
      });
      const json = (await res.json()) as T | ErrorResponse;
      if ((json as ErrorResponse).error)
        throw new Error((json as ErrorResponse).error);
      if (isDeletingAllPublicData) setDataDeleted(true);
      return json as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      toast.error((error as Error).message);
    } finally {
    }
  }
  return mutation;
}
