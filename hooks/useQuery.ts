import { Query } from "@/types/object";
import { ErrorResponse } from "./useMutation";
import toast from "react-hot-toast";

export function useQuery() {
  const query = async <T>(data: Query): Promise<T | undefined> => {
    try {
      const res = await fetch(data.url, {
        method: data.method,
        headers: {
          "Content-Type": "application/json",
          ...data.headers,
        },
        signal: data.signal?.signal,
      });
      const json = (await res.json()) as T | ErrorResponse;
      if ((json as ErrorResponse).error)
        throw new Error((json as ErrorResponse).error);
      return json as T;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      toast.error((error as Error).message);
    } finally {
    }
  };
  return query;
}
