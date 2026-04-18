import { format, parseISO } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import i18n from "@/i18n";

function currentLocale() {
  return i18n.resolvedLanguage === "en" ? enUS : ru;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return format(parseISO(iso), "d MMM yyyy", { locale: currentLocale() });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "";
  return format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: currentLocale() });
}
