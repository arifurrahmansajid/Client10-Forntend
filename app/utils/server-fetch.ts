"use server";

import { ErrorResponse } from "@/hooks/useMutation";
import { Query } from "@/types/object";

export async function serverFetch<T>(data: Query): Promise<T | string> {
  try {
    const res = await fetch(data.url, {
      method: data.method,
      headers: {
        "Content-Type": "application/json",
        ...data.headers,
      },
    });
    const json = (await res.json()) as T | ErrorResponse;
    if ((json as ErrorResponse).error)
      throw new Error((json as ErrorResponse).error);
    return json as T;
  } catch (error) {
    return (error as Error).message;
  }
}
