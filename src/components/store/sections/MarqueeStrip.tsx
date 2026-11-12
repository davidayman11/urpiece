import { getT } from "@/lib/texts/server";

interface Props {
  content: Record<string, string>;
}

const ICONS: Record<string, React.ReactNode> = {
  heart: <path d="M12 20s-7-4.4-7-9.5A4 4 0 0112 7.6 4 4 0 0119 10.5C19 15.6 12 20 12 20z" />,
  truck: (
    <>
      <path d="M3 7h11v9H3z" />
      <path d="M14 10h4l3 3v3h-7" />
      <circle cx="7.5" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </>
  ),
  star: <path d="M12 3l2.6 6 6.4.6-4.8 4.2 1.4 6.2L12 16.8 6.4 20l1.4-6.2L3 9.6 9.4 9z" />,
  sparkle: <path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z" />,
  gift: (
    <>
      <rect x="4" y="10" width="16" height="10" />
      <rect x="3" y="7" width="18" height="3" />
      <path d="M12 7v13" />
      <path d="M12 7c-2-3-5-3-5-1s3 1 5 1zM12 7c2-3 5-3 5-1s-3 1-5 1z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  diamond: (
    <>
      <path d="M6 4h12l3 5-9 11L3 9z" />
      <path d="M3 9h18" />
    </>
  ),
};

export const STRIP_ICONS = ["heart", "truck", "star", "sparkle", "gift", "shield", "diamond"];

export default async function MarqueeStrip({ content }: Props) {
  const messages = (content.messages || "").split("\n").map((m) => m.trim()).filter(Boolean);
  if (messages.length === 0) return null;
  const t = await getT();

  const icon = content.icon === "none" ? null : ICONS[content.icon || "heart"] ?? ICONS.heart;
  const iconColor = content.iconColor || "#C4B07A";
  const speed = Math.max(5, parseFloat(content.speed) || 30);
  const reverse = content.direction === "right";

  const set = (key: string) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key !== "a"}>
      {Array.from({ length: 3 }).flatMap((_, r) =>
        messages.map((m, i) => (
          <span key={`${r}-${i}`} className="flex items-center whitespace-nowrap">
            <span dir="auto" className="px-8 text-sm md:text-base font-medium">{m}</span>
            {icon && (
              <svg
                width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor}
                strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"
              >
                {icon}
              </svg>
            )}
          </span>
        ))
      )}
    </div>
  );

  return (
    <div data-font-area="strip"
      role="region"
      aria-label={t("home.marquee.region")}
      className="marquee-strip overflow-hidden py-4"
      style={{ backgroundColor: content.bgColor || "#1C1711", color: content.textColor || "#F5EFE2" }}
    >
      <div
        className="announce-track flex w-max"
        style={{ animationDuration: `${speed}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        {set("a")}
        {set("b")}
      </div>
    </div>
  );
}
