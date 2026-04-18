import axios, { AxiosError } from "axios";
import i18n from "@/i18n";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export type ApiError = {
  detail: string;
  code?: string;
  field?: string;
};

export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    if (!err.response) {
      return i18n.t("errors.network");
    }
    const data = err.response.data as ApiError | undefined;
    const code = data?.code;
    if (code) {
      const translated = i18n.t(`errors.${code}`, { defaultValue: "" });
      if (translated) return translated;
    }
    if (data?.detail) return data.detail;
  }
  if (err instanceof Error) return err.message;
  return i18n.t("errors.unknown");
}
