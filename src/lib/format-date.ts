import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { Lang } from "@/lib/lang";

/** date-fns format() with Arabic month / day names in the Arabic version. */
export function fmtDate(date: Date | string | number, pattern: string, lang: Lang): string {
  return format(new Date(date), pattern, lang === "ar" ? { locale: ar } : undefined);
}
