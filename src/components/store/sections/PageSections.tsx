import { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { applyOrder, getSavedOrder } from "@/lib/section-order";
import CustomSection from "@/components/store/sections/CustomSection";
import ReviewsSection from "@/components/store/sections/ReviewsSection";
import MarqueeStrip from "@/components/store/sections/MarqueeStrip";
import RecommendedSection from "@/components/store/sections/RecommendedSection";
import SectionLists from "@/components/store/sections/SectionLists";

/**
 * The sections the admin added to a page (Admin > Pages): Custom sections, Reviews photos and Scrolling strips.
 * Use position="top" above the page content and position="bottom" below it. They show in the order set in the admin.
 */
export default async function PageSections({ page, targetId, position = "bottom" }: { page: string; targetId?: string; position?: "top" | "bottom" }) {
  const sections = await prisma.siteSection.findMany({
    where: { pageSlug: page, type: { in: ["custom", "reviews", "marquee", "recommended"] }, isVisible: true },
    orderBy: { sortOrder: "asc" },
  });
  // Category / Product pages: a section can be for all of them or only for the ones the admin picked
  const visible = sections.filter((s) => {
    const c = parseJson<Record<string, string>>(s.content, {});
    // each section is placed above ("top") or below ("bottom", the default) the page's own content
    if ((c._position === "top") !== (position === "top")) return false;
    if (c._target !== "selected") return true;
    let ids: string[] = [];
    try { const v = JSON.parse(c._targetIds || "[]"); ids = Array.isArray(v) ? v : []; } catch { ids = []; }
    return !!targetId && ids.includes(targetId);
  });
  if (visible.length === 0) return null;
  const saved = await getSavedOrder(page);
  const ordered = applyOrder(visible, saved, false);
  return (
    <>
      {ordered.map((s) => {
        const content = parseJson<Record<string, string>>(s.content, {});
        if (s.type === "marquee") {
          return (
            <Fragment key={s.id}>
              <MarqueeStrip content={content} />
              <SectionLists section={s} />
            </Fragment>
          );
        }
        if (s.type === "recommended") return <RecommendedSection key={s.id} content={content} currentProductId={targetId} />;
        return s.type === "custom" ? (
          <CustomSection key={s.id} content={content} />
        ) : (
          <Fragment key={s.id}>
            <ReviewsSection content={content} />
            <SectionLists section={s} />
          </Fragment>
        );
      })}
    </>
  );
}
