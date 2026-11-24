import RichText from "@/components/RichText";
import Link from "next/link";
import { getT } from "@/lib/texts/server";

interface Props {
  messages: string[];
  bgColor?: string;
  textColor?: string;
  /** Seconds for one full loop (lower = faster) */
  speed?: number;
  href?: string;
}

export const ANNOUNCEMENT_HEIGHT = 36;

export default async function AnnouncementBar({ messages, bgColor, textColor, speed = 30, href }: Props) {
  if (messages.length === 0) return null;
  const t = await getT();

  // One "set" of messages; repeated so the strip is always wider than the screen.
  const set = (key: string) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key !== "a"}>
      {Array.from({ length: 3 }).flatMap((_, r) =>
        messages.map((m, i) => (
          <span key={`${r}-${i}`} className="flex items-center whitespace-nowrap">
            <span dir="auto" className="px-8 text-[11px] tracking-[0.2em] uppercase"><RichText text={m} /></span>
            <span className="text-[8px] opacity-60">✦</span>
          </span>
        ))
      )}
    </div>
  );

  const strip = (
    <div
      dir="ltr"
      className="announce-track flex w-max"
      style={{ animationDuration: `${Math.max(5, speed)}s` }}
    >
      {set("a")}
      {set("b")}
    </div>
  );

  return (
    <div data-font-area="announce"
      role="region"
      aria-label={t("announce.region")}
      className="announce-bar fixed top-0 left-0 right-0 z-[60] overflow-hidden flex items-center"
      style={{
        height: ANNOUNCEMENT_HEIGHT,
        backgroundColor: bgColor || "#1C1711",
        color: textColor || "#F5EFE2",
      }}
    >
      {href ? (
        <Link href={href} className="block w-full">{strip}</Link>
      ) : (
        strip
      )}
    </div>
  );
}
