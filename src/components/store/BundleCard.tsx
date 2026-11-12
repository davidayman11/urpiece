import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { summarizeBundle, type BundleView } from "@/lib/bundles";
import { coverImage } from "@/lib/product-images";


import { Txt } from "@/components/store/TextsProvider";
import { getLang } from "@/lib/lang-server";
import { L } from "@/lib/localize";
export default async function BundleCard({ bundle }: { bundle: BundleView }) {
  const lang = await getLang();
  const name = L(lang, bundle.name, bundle.nameAr);
  const s = summarizeBundle(bundle);
  const pct = s.listTotal > 0 ? Math.round((s.savings / s.listTotal) * 100) : 0;
  return (
    <Link href={`/bundle/${bundle.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#EDE6D4]">
        {bundle.image ? (
          <Image src={bundle.image} alt={name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <div className="absolute inset-0 grid grid-cols-2">
            {bundle.items.slice(0, 4).map((it) => {
              let img = "";
              img = coverImage(it.product.images, it.product.variants);
              return (
                <div key={it.id} className="relative bg-[#E0D8C4]">
                  {img && <Image src={img} alt="" fill className="object-cover" />}
                </div>
              );
            })}
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className="bg-[#1C1711] text-[#F5EFE2] text-[9px] tracking-[0.2em] uppercase px-2 py-1"><Txt k="bundle.card.badge" /></span>
          {pct > 0 && <span className="bg-[#B23A3A] text-[#F5EFE2] text-[9px] tracking-[0.2em] uppercase px-2 py-1"><Txt k="bundle.card.save" vars={{ pct }} /></span>}
          {!s.inStock && <span className="bg-[#8A7E6E] text-[#F5EFE2] text-[9px] tracking-[0.2em] uppercase px-2 py-1"><Txt k="bundle.card.outOfStock" /></span>}
        </div>
      </div>
      <div className="pt-3.5 pb-1">
        <p className="text-[9px] tracking-[0.25em] uppercase text-[#A8975E] mb-1"><Txt k="bundle.card.pieces" vars={{ count: bundle.items.length }} /></p>
        <h3 className="text-sm font-serif text-[#1C1711] group-hover:text-[#8A7A4A] transition-colors leading-snug">{name}</h3>
        <p className="mt-1.5 text-sm text-[#5A5040] tabular-nums">
          {s.savings > 0 && <span className="line-through text-[#8A7E6E] mr-2">{formatPrice(s.listTotal)}</span>}
          {s.hasChoice && bundle.priceType === "PERCENT" ? <Txt k="bundle.card.from" /> : ""}
          {formatPrice(s.price)}
        </p>
      </div>
    </Link>
  );
}
