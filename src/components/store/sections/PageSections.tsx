import { Fragment } from "react";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { applyOrder, getSavedOrder } from "@/lib/section-order";
import CustomSection from "@/components/store/sections/CustomSection";
import ReviewsSection from "@/components/store/sections/ReviewsSection";
import SectionLists from "@/components/store/sections/SectionLists";

/**
 * The sections the admin added to a page (Admin > Pages): Custom sections and Reviews photos.
 * Put it at the end of any page to let the admin add content there. They show in Sort Order.
 */
export default async function PageSections({ page, targetId }: { page: string; targetId?: string }) {
  const sections = await prisma.siteSection.findMany({
    where: { pageSlug: page, type: { in: ["custom", "reviews"] }, isVisible: true },
    orderBy: { sortOrder: "asc" },
  });
  // Category / Product pages: a section can be for all of them or only for the ones the admin picked
  const visible = sections.filter((s) => {
    const c = parseJson<Record<string, string>>(s.content, {});
    if (c._target !== "selected") return true;
    let ids: string[] = [];
    try { const v = JSON.parse(c._targetIds || "[]"); ids = Array.isArray(v) ? v : []; } catch { ids = []; }
    return !!targetId && ids.includes(targetId);
  });
  if (visible.length === 0) return null;
  const saved = await getSavedOrder(page);
  const ordered = saved ? applyOrder(visible, saved) : visible;
  return (
    <>
      {ordered.map((s) => {
        const content = parseJson<Record<string, string>>(s.content, {});
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
