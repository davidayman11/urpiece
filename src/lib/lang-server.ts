import { cookies } from "next/headers";
import { LANG_COOKIE, isLang, type Lang } from "@/lib/lang";

/** The language the visitor chose (cookie), or English. Works in server components and route handlers. */
export async function getLang(): Promise<Lang> {
  try {
    const v = (await cookies()).get(LANG_COOKIE)?.value;
    return isLang(v) ? v : "en";
  } catch {
    return "en";
  }
}
