import { getLang } from "@/lib/lang-server";
import { cx } from "@/lib/localize";
import RecommendedForYou from "@/components/store/RecommendedForYou";

/** The "Recommended for you" section the admin added in Admin > Pages (text/colors are optional; Site Text is the fallback). */
export default async function RecommendedSection({ content, currentProductId }: { content: Record<string, string>; currentProductId?: string }) {
  const lang = await getLang();
  return (
    <RecommendedForYou
      currentProductId={currentProductId}
      eyebrow={cx(content, "eyebrow", lang)}
      heading={cx(content, "heading", lang)}
      eyebrowColor={content.eyebrowColor}
      headingColor={content.headingColor}
    />
  );
}
