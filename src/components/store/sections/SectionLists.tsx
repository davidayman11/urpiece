import { parseJson } from "@/lib/utils";
import CustomLists from "@/components/store/sections/CustomLists";

/**
 * The product / bundle / category lists the admin added UNDER a section (any section type except Custom,
 * which has its own). They are picked in Admin > Pages > the section > "Lists under this section".
 */
export default async function SectionLists({ section }: { section?: { type: string; content: string } | null }) {
  if (!section || section.type === "custom") return null;
  const content = parseJson<Record<string, string>>(section.content, {});
  let keys: string[] = [];
  try { const v = JSON.parse(content._lists || "[]"); keys = Array.isArray(v) ? v : []; } catch { keys = []; }
  if (keys.length === 0) return null;
  const lists = await CustomLists({ content, fields: keys, fg: "#1C1711" });
  return lists ? <section className="bg-[#F5EFE2] pb-16 md:pb-20 pt-4">{lists}</section> : null;
}
