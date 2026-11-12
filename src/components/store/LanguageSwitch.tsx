"use client";

import { useLang } from "@/components/store/TextsProvider";
import { LANG_COOKIE, type Lang } from "@/lib/lang";

/**
 * Switches the whole store between English and Arabic. The choice is remembered (cookie) for a year.
 * The button always shows the OTHER language in its own letters, so it is readable to everyone.
 */
export default function LanguageSwitch({ className = "" }: { className?: string }) {
  const lang = useLang();
  const next: Lang = lang === "ar" ? "en" : "ar";
  const switchTo = () => {
    document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload(); // simplest way to re-draw everything (direction, fonts, texts)
  };
  return (
    <button
      type="button"
      onClick={switchTo}
      lang={next}
      aria-label={next === "ar" ? "التبديل إلى العربية" : "Switch to English"}
      className={className}
    >
      {next === "ar" ? "العربية" : "English"}
    </button>
  );
}
